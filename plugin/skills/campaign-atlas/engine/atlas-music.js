/* ================================================================
   CAMPAIGN ATLAS: MUSIC
   Every place has its own theme, made in the browser as it plays: no sound files, nothing to download, nothing to
   licence. A theme is two choices. The MOOD is what the place is (a crypt, a market, the docks, a chase); it decides
   the layers: a drone, slow chords, a sparse melody, textures (wind, rain, water, a crowd, machinery) and events
   (a bell, dripping water, a clock, a heartbeat). The FLAVOUR is where and when the story is (medieval, industrial,
   wartime, modern, arabic, east asian...); it decides the scale, the way chords are built, and a band of that time
   and place: its own instruments for the tune, the chords, the drone and the bass, its own drums and dance rhythms,
   and its own ornaments. The user asked for this (14 Oct 2026): "medieval should have the instruments which they
   had during the medieval time and should sound specific to that era". Each place's melody is grown from its own
   name, so a place always sounds like itself and no two places share a tune.

   A place says music: "crypt" (see `atlas.js catalogue` for the moods); without it, the mood is guessed from the
   place's name. The campaign may say music: { flavour: "arabic", home: "night" } or music: false in ATLAS.configure.

   Browsers only allow sound after a click, so music starts from the page's Music button, never by itself.
   This file loads without a browser (the checker reads its lists); sound is only touched when play is pressed.
   ================================================================ */
(function (A) {
  "use strict";
  const mulberry32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  const SCALES = {
    dorian: [0, 2, 3, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], phrygian: [0, 1, 3, 5, 7, 8, 10],
    hijaz: [0, 1, 4, 5, 7, 8, 10], yo: [0, 2, 5, 7, 9], insen: [0, 1, 5, 7, 10], lydian: [0, 2, 4, 6, 7, 9, 11], whole: [0, 2, 4, 6, 8, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    // the Arab maqamat, with their quarter tones (1.5 is a note half way between a semitone and a tone)
    bayati: [0, 1.5, 3, 5, 7, 8, 10], saba: [0, 1.5, 3, 4, 7, 8, 10], rast: [0, 2, 3.5, 5, 7, 9, 10.5]
  };
  // where and when: the scale for easy moods and for tense ones, the root note, and the band.
  //   keys, wind, bell: the instruments a mood's tune can be given to (a mood says lead: "keys" and gets this style's
  //   keyboard or plucked instrument, "wind" its melody instrument, "bell" its instrument for dark places);
  //   pad: what holds the chords; ost: what plays the dance figures; bass: the bass (null: this music had none);
  //   drone: an instrument holding the keynote under everything (otherwise a plain low hum);
  //   harmony: "open" builds every chord of bare fifths and octaves (the middle ages had no thirds in its chords),
  //   "drone" keeps one chord on the keynote under the tune (as Arab music does); otherwise thirds, as from the 1600s on;
  //   orn: "grace" puts a quick note above some notes, "bend" slides into them; toll, horn: the bell and the horn that
  //   sound in the distance (toll: null, no bells); swap: this style's own instrument for one a mood asks for by name;
  //   kit: which drum rhythm (RHYTHMS, below) plays for each kind of pulse; moods: a mood played differently here
  //   (another lead, another scale); echo: [seconds, feedback, loudness] for the styles that had echo units.
  const FLAVOURS = {
    // The default: the dark-mystery, cosmic-horror film score the user asked for. An orchestra, not a band: slow piano
    // and harp figures over low strings, a solo cello, voices, a celesta, and a deep drum where the dread gathers.
    arkham:        { label: "Dark mystery, orchestral horror", light: "aeolian", dark: "harmonic", root: 45, keys: "grand", wind: "cello", pad: "strings", bell: "grand", ost: "stab", cine: true },
    // a lute, a recorder, a portative organ, a hurdy-gurdy droning under it all; the vielle (the fiddle of the age)
    // in the tavern, the shawm in the market, the busine (the long war trumpet) and nakers in battle, monks' plainchant
    // in church and crypt; tabor and frame drum; chords of bare fifths, in the church modes
    medieval:      { label: "Medieval", light: "dorian", dark: "phrygian", root: 50, keys: "lute", wind: "recorder", pad: "portative", bell: "cymbala", ost: "lute", bass: null, drone: "gurdy", harmony: "open", orn: "grace", horn: "frhorn",
                     swap: { choir: "chant" }, kit: { dance: "estampie", frame: "tabor", march: "tabor", drum: "nakers", chase: "nakers", ritual: "bendir" },
                     moods: { tavern: { lead: "vielle", scale: "mixolydian" }, market: { lead: "shawm" }, battle: { lead: "busine" }, base: { lead: "busine" }, palace: { lead: "harp" }, sorrow: { lead: "vielle" }, crypt: { lead: "chant", rate: .2 }, temple: { lead: "chant" } } },
    // the gaslight age, 1840 to 1910: an upright parlour piano, a clarinet, a string quartet, a harmonium, a double
    // bass; the barrel organ in the street, a violin in the tavern's waltz, a brass band (cornet and tuba) on parade
    industrial:    { label: "Industrial age, gaslight", light: "harmonic", dark: "phrygian", root: 48, keys: "upright", wind: "clarinet", pad: "quartet", bell: "musicbox", ost: "upright", bass: "cbass", drone: "harmonium",
                     swap: { choir: "choirF" }, kit: { dance: "waltz", frame: "barrel", march: "band", drum: "band", chase: "galop" },
                     moods: { tavern: { lead: "violin" }, market: { lead: "barrel" }, street: { lead: "barrel" }, sorrow: { lead: "violin", padInst: "harmonium" }, base: { lead: "cornet" }, battle: { lead: "cornet" } } },
    // the world wars, 1914 to 1945: a lone violin over a string orchestra, an old upright piano, a cello in the dark
    // places, the double bass; an accordion and a clarinet in the cafés and streets, tango and polka; the military
    // snare and bass drum; men's voices; a field harmonium for the chaplain
    wartime:       { label: "Wartime, 1914 to 1945", light: "aeolian", dark: "harmonic", root: 50, keys: "upright", wind: "violin", pad: "quartet", bell: "cello", ost: "accordion", bass: "cbass", drone: "cbass",
                     swap: { choir: "choirM", organ: "harmonium" }, kit: { march: "military", drum: "military", chase: "military", dance: "tango", frame: "polka", ritual: "funeral" },
                     moods: { tavern: { lead: "accordion" }, market: { lead: "accordion" }, street: { lead: "clarinet" }, station: { lead: "clarinet" } } },
    // today: a felt piano, an electric guitar through an echo, a Rhodes, a vibraphone, warm analogue pads, sub bass;
    // a laid-back drum machine, trailer drums for a fight, a pulsing synth bass for a chase
    modern:        { label: "Modern", light: "aeolian", dark: "phrygian", root: 45, keys: "felt", wind: "eguitar", pad: "warmpad", bell: "vibes", ost: "synbass", bass: "sub", seventh: true, echo: [.42, .36, .26],
                     swap: { choir: "choirF", organ: "warmpad" }, kit: { dance: "lofi", frame: "lofi", drum: "hybrid", march: "hybrid", chase: "electro" },
                     moods: { night: { lead: "rhodes" }, market: { lead: "rhodes" } } },
    // the synthesisers of the films: a CS-80 swelling open, a gliding synth lead, FM bells and FM electric piano, a
    // theremin for the laboratory and the dread, a sequenced arpeggio, gated drums, long echoes
    scifi:         { label: "Science fiction", light: "lydian", dark: "whole", root: 43, keys: "fmkeys", wind: "synlead", pad: "cs80", bell: "fmbell", ost: "arp", bass: "sub", seventh: true, echo: [.5, .42, .32],
                     swap: { choir: "choirF", organ: "cs80" }, kit: { dance: "seq", frame: "seq", chase: "seq", drum: "gated", march: "gated" },
                     moods: { laboratory: { lead: "theremin" }, dread: { lead: "theremin" }, hospital: { lead: "theremin" } } },
    // the oud, the ney (the reed flute, more breath than note), the qanun, the rebab droning, the violins of an
    // Egyptian orchestra; darbuka, riq and tabl in the old rhythms (maqsum, baladi, saidi, zaffa); maqam Bayati with
    // its quarter tones, Hijaz when it darkens, Saba in grief; no church bells
    arabic:        { label: "Arabian, desert", light: "bayati", dark: "hijaz", root: 50, keys: "oud", wind: "ney", pad: "kaman", bell: "qanun", ost: "oud", bass: null, drone: "rebab", harmony: "drone", orn: "grace", toll: null,
                     swap: { choir: "ney", organ: "kaman" }, kit: { frame: "maqsum", dance: "baladi", drum: "saidi", march: "zaffa", chase: "maqsum", ritual: "bendir" },
                     moods: { sorrow: { scale: "saba" }, temple: { lead: "ney" }, church: { lead: "ney" }, night: { lead: "ney" }, tavern: { lead: "qanun" } } },
    // Japan: the koto, the shakuhachi with its breath and bent notes, the shamisen, the shō's held chords, the high
    // shinobue at a festival, singing bowls and the great temple bell; taiko drums and wooden clappers; Buddhist chant
    eastasia:      { label: "East Asian, Japanese", light: "yo", dark: "insen", root: 50, keys: "koto", wind: "shakuhachi", pad: "sho", bell: "bowl", ost: "shamisen", bass: null, orn: "bend", toll: "bonsho",
                     swap: { choir: "chant", organ: "sho" }, kit: { drum: "taiko", march: "taiko", chase: "taiko", ritual: "taikoslow", dance: "matsuri", frame: "matsuri" },
                     moods: { tavern: { lead: "shamisen" }, market: { lead: "shinobue" }, battle: { lead: "shinobue" } } },
    // a Spanish guitar, the mandolin's tremolo, the bouzouki, the accordion; tambourine, tarantella, a town band
    mediterranean: { label: "Mediterranean", light: "harmonic", dark: "phrygian", root: 52, keys: "nylon", wind: "mandolin", pad: "accordion", bell: "bell", ost: "bouzouki", bass: "pizz",
                     swap: { choir: "choirF" }, kit: { dance: "tarantella", frame: "tamburello", drum: "banda", march: "banda", chase: "tarantella" }, moods: {} },
    // the fantasy film: a harp, the concert flute, lush strings, a celesta, French horns and timpani; a tin whistle
    // in the woods, a fiddle and the bodhrán for a jig in the tavern; war drums in battle
    fantasy:       { label: "Fantasy", light: "dorian", dark: "phrygian", root: 48, keys: "harp", wind: "fflute", pad: "lush", bell: "celesta", ost: "harp", bass: "lowstr", horn: "frhorn",
                     swap: { choir: "choirF", organ: "lush" }, kit: { dance: "jig", frame: "bodhran", drum: "war", march: "war", chase: "war", ritual: "warslow" },
                     moods: { tavern: { lead: "fiddle" }, forest: { lead: "whistle" }, street: { lead: "whistle" }, battle: { lead: "frhorn" }, base: { lead: "frhorn" } } }
  };
  // The drum rhythms of each style. One character to each step (div steps to a beat, 2 unless said); a lane shorter
  // than the bar repeats. Drums: K kick, k soft kick, V deep electronic kick, S snare, s soft, Z a snare roll, H h
  // hi-hat, C clap, D d dum of a hand drum, T t its tek and ka, J j jingles (riq, tambourine), B b tabor, N n nakers,
  // O o taiko, W wooden clappers, M m bodhrán, P timpani, Q a gated tom. Notes: a the bass, f its fifth, c a chord,
  // 1 2 3 the chord's notes one by one, 4 the first an octave up. bass, chord, ost: who plays them (else the style's).
  const RHYTHMS = {
    estampie:   { div: 3, lanes: ["B.bB.b", "c..c.."] },
    tabor:      { lanes: ["B.bbB.b.B.bbBbb.", "c...c...c...c..."] },
    nakers:     { lanes: ["N.n.N.nnN.n.NnNn", "a...a...a...a.a."] },
    bendir:     { lanes: ["D...d...D...d.dd"] },
    maqsum:     { lanes: ["DT.TD.T.", "..j...jJ", "1..1..2."] },
    baladi:     { lanes: ["DD.TD.T.", "j.j.j.jJ", "1.31..2."] },
    saidi:      { lanes: ["DT.DD.T.", "J...J...", "a..aa..."] },
    zaffa:      { lanes: ["D.TTD.T.", "J.j.J.j."] },
    taiko:      { lanes: ["O...o.o.O...o.oo", "....W.......W..."] },
    taikoslow:  { lanes: ["O.......o...o..."] },
    matsuri:    { lanes: ["o.oo.oo.", "W..W..W.", "1...2..."] },
    tarantella: { div: 3, speed: 1.3, lanes: ["Jjj", "a.c"] },
    tamburello: { lanes: ["D.jJD.jJ", "a..c.ac."] },
    banda:      { lanes: ["K.s.K.s.K.s.KsSs", "a.c.f.c."], bass: "tuba", chord: "cornet" },
    waltz:      { beats: 6, speed: 1.45, lanes: ["a.c.c.f.c.c."] },
    barrel:     { lanes: ["a.c.f.c."], bass: "barrel", chord: "barrel" },
    band:       { lanes: ["K.s.K.s.K.s.KsSs", "a.c.f.c."], bass: "tuba", chord: "cornet" },
    galop:      { lanes: ["K.s.K.s.K.s.KsKs", "1.2.3.2."] },
    military:   { lanes: ["K.......K.......", "S.ssS.s.S.ssZ.s.", "a.......f......."], bass: "tuba" },
    tango:      { div: 4, beats: 4, lanes: ["a..fc.c."], bass: "pizz" },
    polka:      { lanes: ["a.c.f.c.", "..s...s."], bass: "tuba" },
    funeral:    { lanes: ["K.......k......."] },
    lofi:       { swing: .14, lanes: ["K.....K.K..K....", "....S.......S...", "h.h.h.h.h.h.h.h.", "c.......c......."], chord: "rhodes" },
    hybrid:     { lanes: ["V..V..V.V..V..VV", "....C.......C...", "1.1.1.1.1.1.1.1."] },
    electro:    { div: 4, beats: 4, lanes: ["K...K...K...K...", "..h...h...h...h.", "1131112311311123"] },
    seq:        { div: 4, beats: 4, lanes: ["V.......Q.......", "1234123412341234"] },
    gated:      { lanes: ["V...Q...V.Q.Q...", "....C.......C...", "1.......1......."] },
    jig:        { div: 3, lanes: ["M.mM.m", "a.ca.c"] },
    bodhran:    { lanes: ["M.mmM.m.", "a...c..."] },
    war:        { lanes: ["P.....P.P.....P.", "O..o..O.O..o.Oo.", "....S.......S.SS", "1.1.1.1.1.1.2.2."], ost: "stab" },
    warslow:    { lanes: ["P.......O.......", "........o...o..."] }
  };
  // what the place is. pad, drone: how loud (0 to 1). lead: which part carries the tune (keys, wind, bell) or an
  // instrument by name; rate: how often it plays. tex: lasting textures with their loudness. ev: events, with the
  // seconds between them (heart: beats a minute). pulse: a rhythm. tension: 0 easy to 1 unbearable. rev: how much
  // the room rings. bar: seconds to a chord. reg: an octave down (-1) or up (1).
  const MOODS = {
    calm:       { label: "Calm, at home", pad: .5, drone: .25, lead: "keys", rate: .7, tension: .1, rev: .35, bar: 9 },
    street:     { label: "Street by day", pad: .35, drone: .15, lead: "wind", rate: .55, tex: { crowd: .22 }, ev: { clank: 14 }, tension: .15, rev: .25, bar: 8 },
    night:      { label: "City at night", pad: .45, drone: .4, lead: "keys", rate: .4, tex: { wind: .12 }, ev: { toll: 55 }, tension: .4, rev: .5, bar: 11, reg: -1 },
    market:     { label: "Market", pad: .25, drone: .1, lead: "keys", rate: .9, tex: { crowd: .32 }, pulse: { kind: "frame", bpm: 96 }, tension: .1, rev: .2 },
    tavern:     { label: "Tavern, inn", pad: .2, lead: "wind", rate: 1, tex: { crowd: .28, fire: .1 }, pulse: { kind: "dance", bpm: 112 }, tension: .05, rev: .2 },
    church:     { label: "Church", pad: .6, padInst: "organ", drone: .35, lead: "choir", rate: .4, ev: { toll: 38 }, tension: .25, rev: .85, bar: 12 },
    temple:     { label: "Temple, shrine", pad: .5, drone: .45, lead: "bell", rate: .45, ev: { toll: 30 }, tension: .3, rev: .8, bar: 12 },
    crypt:      { label: "Crypt, tomb", pad: .25, drone: .6, lead: "bell", rate: .25, tex: { wind: .08 }, ev: { drip: 3.5 }, tension: .75, rev: .9, bar: 13, reg: -1 },
    library:    { label: "Library, study", pad: .3, drone: .15, lead: "keys", rate: .6, tex: { fire: .06 }, ev: { tick: 1 }, tension: .2, rev: .3, bar: 9 },
    manor:      { label: "Great house", pad: .45, drone: .1, lead: "keys", rate: .8, ev: { tick: 1 }, tension: .2, rev: .4, bar: 8 },
    palace:     { label: "Palace, court", pad: .55, lead: "keys", rate: .85, tension: .1, rev: .55, bar: 8, reg: 1 },
    docks:      { label: "Docks, harbour", pad: .3, drone: .3, lead: "wind", rate: .45, tex: { water: .3, wind: .12 }, ev: { horn: 48, clank: 11 }, tension: .3, rev: .35, bar: 10 },
    sea:        { label: "At sea", pad: .4, drone: .3, lead: "wind", rate: .5, tex: { sea: .4, wind: .2 }, tension: .25, rev: .3, bar: 10 },
    sewer:      { label: "Sewers, tunnels", pad: .15, drone: .55, lead: "bell", rate: .15, tex: { water: .22 }, ev: { drip: 2.2, clank: 26 }, tension: .7, rev: .95, bar: 12, reg: -1 },
    cellar:     { label: "Cellar, vault", pad: .2, drone: .5, lead: "keys", rate: .25, ev: { drip: 6 }, tension: .6, rev: .7, bar: 12, reg: -1 },
    cave:       { label: "Cave", pad: .2, drone: .5, lead: "wind", rate: .2, tex: { wind: .15 }, ev: { drip: 2.6 }, tension: .55, rev: 1, bar: 13 },
    laboratory: { label: "Laboratory", pad: .3, drone: .3, lead: "bell", rate: .5, tex: { hum: .16 }, ev: { steam: 9 }, tension: .45, rev: .3, bar: 9 },
    hospital:   { label: "Hospital, asylum", pad: .35, drone: .35, lead: "bell", rate: .35, tex: { hum: .08 }, ev: { heart: 54 }, tension: .6, rev: .6, bar: 11 },
    prison:     { label: "Prison, camp", pad: .2, drone: .6, lead: "wind", rate: .25, tex: { wind: .2 }, ev: { clank: 18, toll: 70 }, tension: .7, rev: .55, bar: 13, reg: -1 },
    factory:    { label: "Factory, works", pad: .2, drone: .4, tex: { hum: .28 }, ev: { clank: 2.4, steam: 7 }, pulse: { kind: "machine", bpm: 76 }, tension: .5, rev: .4 },
    warehouse:  { label: "Warehouse", pad: .25, drone: .45, lead: "keys", rate: .3, tex: { wind: .08 }, ev: { clank: 20, drip: 9 }, tension: .5, rev: .7, bar: 11 },
    station:    { label: "Station, railway", pad: .3, drone: .25, lead: "keys", rate: .5, tex: { crowd: .2, hum: .06 }, ev: { steam: 8, horn: 40, clank: 9 }, tension: .3, rev: .6, bar: 9 },
    forest:     { label: "Woods, park, garden", pad: .4, drone: .15, lead: "wind", rate: .6, tex: { wind: .18 }, ev: { chirp: 4 }, tension: .15, rev: .35, bar: 10 },
    moor:       { label: "Moor, wilderness", pad: .3, drone: .45, lead: "wind", rate: .35, tex: { wind: .4 }, ev: { thunder: 70 }, tension: .5, rev: .4, bar: 12 },
    desert:     { label: "Desert", pad: .3, drone: .5, lead: "wind", rate: .4, tex: { wind: .3 }, tension: .35, rev: .45, bar: 12 },
    storm:      { label: "Storm", pad: .3, drone: .5, tex: { rain: .4, wind: .35 }, ev: { thunder: 22 }, tension: .65, rev: .4, bar: 11 },
    ritual:     { label: "Ritual, cult", pad: .35, padInst: "choir", drone: .7, lead: "bell", rate: .3, ev: { whisper: 7 }, pulse: { kind: "ritual", bpm: 52 }, tension: .95, rev: .8, reg: -1 },
    dread:      { label: "Dread", pad: .2, drone: .8, lead: "bell", rate: .15, tex: { wind: .1 }, ev: { whisper: 11, heart: 46 }, tension: 1, rev: .75, bar: 14, reg: -1 },
    mystery:    { label: "Investigation", pad: .4, drone: .3, lead: "keys", rate: .65, ev: { tick: 1 }, tension: .45, rev: .45, bar: 9 },
    sorrow:     { label: "Sorrow, aftermath", pad: .55, drone: .2, lead: "wind", rate: .6, tex: { rain: .12 }, tension: .35, rev: .6, bar: 12 },
    chase:      { label: "Chase", pad: .3, drone: .3, lead: "keys", rate: .8, pulse: { kind: "chase", bpm: 140 }, tension: .7, rev: .25 },
    battle:     { label: "Battle", pad: .4, drone: .4, lead: "wind", rate: .6, pulse: { kind: "drum", bpm: 124 }, tension: .8, rev: .3 },
    base:       { label: "Military base", pad: .25, drone: .35, lead: "keys", rate: .3, tex: { wind: .2, hum: .1 }, ev: { clank: 16 }, pulse: { kind: "march", bpm: 88 }, tension: .45, rev: .25 },
    ruins:      { label: "Ruins, war zone", pad: .3, drone: .55, lead: "wind", rate: .3, tex: { wind: .3, fire: .08 }, ev: { thunder: 28 }, tension: .7, rev: .5, bar: 13 },
    ship:       { label: "Space station, ship", pad: .4, drone: .5, lead: "bell", rate: .4, tex: { hum: .22 }, ev: { beep: 6 }, tension: .4, rev: .5, bar: 11 },
    silence:    { label: "Silence", off: true }
  };
  // Each mood's loudness, set by measuring it (A.music.measure) so that a study is not a whisper beside a storm.
  // Measure again and adjust if a mood's layers are changed.
  const TRIM = { calm: 1.6, street: 1.5, night: 1.1, market: 1.4, tavern: 1.35, church: 1.1, temple: 1, crypt: .72, library: 2.2, manor: 2.2, palace: 2.2, docks: 1.15, sea: .87, sewer: .86, cellar: 1, cave: .9, laboratory: 1.27, hospital: .8, prison: .8, factory: .78, warehouse: 1.1, station: 1.6, forest: 1.6, moor: .9, desert: .94, storm: .72, ritual: .63, dread: .6, mystery: 1.6, sorrow: 1.85, chase: .8, battle: .85, base: 1, ruins: .82, ship: .82 };
  const TRIM_CINE = { calm: 2.6, street: 1.82, night: 1.68, market: 1.76, tavern: 1.71, church: 1.56, temple: 1.38, crypt: 1.22, library: 2.6, manor: 2.28, palace: 2.58, docks: 1.95, sea: 1.75, sewer: 1.74, cellar: 1.84, cave: 1.63, laboratory: 1.62, hospital: .79, prison: 1.9, factory: 1.38, warehouse: 1.6, station: 2.2, forest: 2.6, moor: 1.79, desert: 2.07, storm: 1.3, ritual: 1.24, dread: .78, mystery: 1.57, sorrow: 2.55, chase: 1.16, battle: 1.08, base: 1.61, ruins: 1.54, ship: 1.64 };   // the same, for the orchestral style (measured after it was matched to the reference recording)
  // each of the other styles, measured again once it had its own band: one number a mood, in the order of MOODS
  // (silence left out). A style without a row uses TRIM. Measured 14 Oct 2026 over three tunes a mood (seeds 777, 4242
  // and 31337, averaged), each mood brought to the loudness the gaslight style had (an RMS of about 0.066 through the
  // master). The quietest places, a cellar or a crypt, need most; the sparse ones still vary from tune to tune.
  const LEVELS = {
    //           calm  street night market tavern church temple crypt library manor palace docks sea  sewer cellar cave  lab   hosp  prison factory wareh station forest moor desert storm ritual dread myst sorrow chase battle base ruins ship
    medieval:      [1.72, 1.51, 1.77, 1.62, 1.27, 1.54, 1.5, 3.45, 2.24, 1.78, 1.45, 1.8, 0.93, 4.37, 3.46, 3.16, 1.5, 0.96, 1.54, 1.01, 3.19, 1.83, 1.36, 1.45, 1.53, 1.17, 1.83, 1.15, 2.01, 1.58, 0.72, 0.79, 1.52, 1.43, 1.23],
    industrial:    [1.93, 1.72, 1.6, 1.74, 1.55, 1.52, 1.53, 2.89, 2.3, 1.98, 1.8, 1.6, 0.98, 3.54, 3.58, 2.3, 1.58, 1, 2.11, 1.02, 3.8, 1.97, 1.41, 1.15, 1.23, 1.15, 1.52, 1.14, 2.17, 1.75, 0.87, 1.09, 1.04, 1.11, 1.29],
    wartime:       [1.84, 1.57, 1.48, 1.79, 1.51, 1.61, 1.37, 2.22, 2.26, 1.96, 1.81, 1.8, 1.01, 2.65, 2.77, 2.29, 1.53, 0.97, 1.82, 1, 2.9, 1.47, 1.8, 1.24, 1.38, 1.1, 1.87, 1.05, 2.02, 1.65, 1.21, 1.5, 1.29, 1.23, 1.21],
    modern:        [1.42, 2.15, 1.11, 1.14, 1.09, 1.37, 0.99, 0.79, 1.79, 1.6, 1.46, 1.43, 0.94, 0.92, 1.01, 0.99, 1.21, 0.85, 0.79, 0.78, 1.07, 1.32, 2.1, 0.88, 0.89, 0.76, 0.63, 0.54, 1.27, 1.85, 0.58, 0.5, 0.53, 0.83, 0.84],
    scifi:         [1.54, 2.05, 1.07, 0.73, 0.77, 1.29, 0.92, 0.76, 2.16, 2.16, 1.86, 1.4, 0.92, 0.87, 0.97, 0.94, 1.07, 0.8, 0.77, 0.77, 1.05, 1.44, 2.03, 0.86, 0.87, 0.75, 0.61, 0.53, 1.41, 1.72, 0.61, 0.66, 0.7, 0.81, 0.79],
    arabic:        [4.24, 1.89, 1.77, 1.28, 0.96, 2.36, 2.53, 2.86, 3.36, 3.9, 3.55, 2.02, 1.06, 4.47, 5, 2.79, 1.72, 1.04, 2.66, 1.03, 4.97, 2.36, 1.7, 1.32, 1.43, 1.24, 1.9, 1.17, 4.07, 2.47, 1.15, 1.08, 1.3, 1.31, 1.48],
    eastasia:      [1.58, 1.38, 1.01, 0.96, 0.93, 1.21, 0.85, 0.75, 2.2, 2.03, 2.22, 1.25, 0.89, 0.86, 1.01, 0.95, 1, 0.79, 0.77, 0.77, 1.08, 1.42, 1.56, 0.83, 0.85, 0.75, 0.6, 0.54, 1.4, 1.23, 0.53, 0.54, 0.61, 0.8, 0.74],
    mediterranean: [1.75, 2.03, 1.09, 1.17, 1.39, 1.14, 0.86, 0.71, 2.43, 2.65, 2.97, 1.39, 0.93, 0.81, 0.98, 0.94, 0.96, 0.79, 0.78, 0.77, 1.06, 1.48, 2.09, 0.86, 0.87, 0.75, 0.57, 0.53, 1.46, 1.71, 0.98, 0.81, 0.84, 0.81, 0.71],
    fantasy:       [1.51, 1.35, 1.03, 0.99, 0.75, 1.21, 0.92, 0.78, 2.15, 2.06, 2.04, 1.23, 0.88, 0.88, 0.99, 0.93, 1.18, 0.84, 0.78, 0.77, 1.06, 1.39, 1.55, 0.82, 0.84, 0.75, 0.56, 0.54, 1.34, 1.17, 0.5, 0.5, 0.5, 0.78, 0.81]
  };
  const ORDER = Object.keys(MOODS).filter(k => !MOODS[k].off);
  const trimOf = (F, fl, mood) => F.cine ? TRIM_CINE[mood] || 1 : LEVELS[fl] ? LEVELS[fl][ORDER.indexOf(mood)] || 1 : TRIM[mood] || 1;
  // a place that does not say what it is: its name usually does
  const GUESS = [
    [/crypt|tomb|catacomb|ossuar|morgue|mortuar|mausole|graveyard|burial/, "crypt"], [/sewer|tunnel|drain|culvert|underground|catacomb/, "sewer"], [/cellar|vault|basement|undercroft|strongroom/, "cellar"], [/cave|cavern|grotto|mine\b|quarry/, "cave"],
    [/ritual|cult|altar|coven|sanctum|lair|pit\b|summon/, "ritual"], [/asylum|hospital|infirmar|sanator|clinic|\bward\b|med-?lab|surgery|bedlam/, "hospital"], [/laborator|\blab\b|workshop of|observator|alchem/, "laboratory"],
    [/barracks|\bbase\b|\bfort\b|garrison|outpost|armou?ry|checkpoint|motor pool|headquarters|operations|\bhq\b|hangar|helipad/, "base"], [/prison|gaol|jail|\bcells?\b|\bcamp\b|stalag|penitent|workhouse|dungeon/, "prison"], [/ruin|bombed|rubble|wreck|war ?zone|no man/, "ruins"],
    [/opium|\bden\b|rookery|slum|tenement|doss|brothel|gambling/, "night"],
    [/cathedral|\bchurch\b|\bchapel\b|abbey|priory|minster|basilica|duomo|convent|monaster/, "church"], [/temple|shrine|mosque|synagogue|pagoda|masjid/, "temple"],
    [/tavern|\binn\b|pub\b|public house|\bbar\b|alehouse|saloon|cantina|club\b|music hall|cabaret/, "tavern"], [/market|bazaar|souk|suq|arcade|fair\b|exchange/, "market"],
    [/dock|quay|wharf|harbou?r|pier|port\b|custom|shipyard|basin|landing/, "docks"], [/\bship\b|vessel|schooner|steamer|yacht|aboard|lighthouse/, "sea"], [/station|railway|terminus|depot|platform|goods yard/, "station"],
    [/factory|works\b|foundry|mill\b|gasworks|refiner|plant\b|forge|brewery|tanner/, "factory"], [/warehouse|store\b|storehouse|godown|hangar|coal ?yard|depository/, "warehouse"],
    [/library|archive|museum|study|bookshop|office|record|registry|newspaper|university|college|school|court\b/, "library"], [/palace|palazzo|palais|schloss|court of|throne|castle|\bkeep\b|citadel|alc[aá]zar|signoria/, "palace"],
    [/manor|mansion|villa|\bhouse\b|\bhall\b|hotel|townhouse|residence|estate|lodge|rectory|\bhome\b/, "manor"], [/park|garden|wood|forest|grove|orchard|green\b|common\b|cemetery/, "forest"], [/moor|marsh|fen\b|heath|wild|mountain|crag|cliff/, "moor"],
    [/desert|dune|oasis|wadi|waste/, "desert"], [/street|lane|alley|square|plaza|piazza|row\b|court\b|bridge|crossroad/, "night"], [/deck\b|bay\b|airlock|reactor|hydropon|orbital|module/, "ship"]
  ];
  // the name is asked first, then the tagline; on a ship among the stars a dock is not a waterside
  function guess(meta) {
    for (const s of [(meta.name || "").toLowerCase(), (meta.tagline || "").toLowerCase()]) for (const [re, m] of GUESS) if (re.test(s)) return (m === "docks" || m === "sea") && flavour() === "scifi" ? "ship" : m;
    return "mystery";
  }
  // the campaign's flavour: said outright, or taken from the look and region of its city, or from its paper
  function flavour() {
    const c = A.config.music || {}; if (c.flavour && FLAVOURS[c.flavour]) return c.flavour;
    if (c.flavour !== "auto") return "arkham";         // flavour: "auto" takes it from the city instead
    const D = A.cityData;
    if (D) { if (D.region === "desert") return "arabic"; if (D.region === "eastasia") return "eastasia"; const look = typeof D.look === "object" ? D.look.base : D.look; if (look === "modern") return "modern"; if (look === "medieval") return D.region === "mediterranean" ? "mediterranean" : "medieval"; return D.region === "mediterranean" ? "mediterranean" : "industrial"; }
    return A.config.paper === "blueprint" ? "scifi" : "industrial";
  }
  // what plays for a place: { mood, flavour, seed, label, guessed }
  function themeFor(id) {
    const m = A.meta[id] || {}, own = m.music, mood = (own && typeof own === "object" ? own.mood : own) || guess(m), fl = (own && typeof own === "object" && FLAVOURS[own.flavour]) ? own.flavour : flavour();
    const M = MOODS[mood] ? mood : "mystery";
    return { mood: M, flavour: fl, seed: hashStr(id + "|" + M), label: MOODS[M].label, guessed: !own, place: id };
  }
  // A place's songs: the one suggested for it, and the moments there that call for another. A place says
  // music: { mood: "prison", also: { "The spot count": "dread", "After the gong": "night" } }; every song is one of the
  // moods, played with the place's own tune (the dread at Block 22 is not the dread at the farm).
  // A place that does not name its moments has them suggested from its scenes (its encounters): each scene's title,
  // or else the first sentence of what happens, is read for what kind of moment it is. This is part of Atlas, so every
  // campaign has suggested songs, not only one whose places were given them by hand (the user, 14 Oct 2026: "these
  // features are for atlas").
  const MOMENTS = [
    [/(fight|\bbattle|\battack|\bassault|\braid\b|\bambush|\bbrawl|\bduel|\bskirmish|\bshoot|gunfire|\bbombard|\bbomber|air raid|\bsiege|\bmelee|last stand|\bboarding)/, "battle"],
    [/\b(chase|pursu|flee|flight|escape|run for|on the run|getaway|hunted|race\b|stampede|collapse|cave-in|flood|fire spreads|burning|breach|sinking)/, "chase"],
    [/\b(ritual|rite\b|ceremony|summon|sacrifice|invocation|s[eé]ance|cult(ist)?s?\b|coven)/, "ritual"],
    [/\b(storm|thunder|lightning|blizzard|gale|tempest|hurricane)/, "storm"],
    [/\b(search|roll call|count\b|inspection|selection|interrogat|question|caught|discover|patrol|guard|sentry|watchman|dogs?\b|hounds?|boots|footsteps|stalk|lurk|creature|monster|horror|the thing|presence|alarm|siren|knock|trap\b|haunt|ghost|ghoul|vampire|werewolf|zombie|undead|wraith|demon|dragon|beast|whisper|scream|bomb\b)/, "dread"],
    [/\b(fever|wound|injur|sick|illness|plague|quarantine|surgeon|surgery|doctor|bleed|infirm)/, "hospital"],
    [/\b(death|dies|dying|funeral|burial|grief|mourn|farewell|goodbye|parting|last words|vigil|lament|memorial)/, "sorrow"],
    [/\b(feast|party|banquet|celebrat|dance|ball\b|wedding|toast|drinking|carous|festival|revel|gathering|inn\b|tavern|pub\b|saloon)/, "tavern"],
    [/\b(dinner|audience with|reception|soir[eé]e|tea with|at court)/, "manor"],
    [/\b(mass\b|prayer|service|hymn|vespers|christmas|easter|blessing|sermon|confession)/, "church"],
    [/\b(offer|bargain|deal\b|bribe|negotiat|meeting|interview|conversation|clue|riddle|puzzle|letter|cipher|visitor|stranger|heist|robbery|burgl|theft|break(ing)? in|trial\b|hearing|verdict)/, "mystery"],
    [/\b(train|station|platform|railway)/, "station"],
    [/\b(fog|mist|lost in|wilderness|moor|heath|wastes)/, "moor"],
    [/\b(night|midnight|after dark|curfew|lights out|moonlight|dusk|nightfall)/, "night"],
    [/\b(tunnel|dig\b|digging|underground|crawl|cellar|vault|grating|drain|sewer|mine\b)/, "cave"],
    [/\b(river|weir|crossing|ford\b|boat|ferry|swim|sea\b|ship|shore|bridge)/, "sea"],
    [/\b(market|street|crowd|procession|parade|cart\b|traffic|square\b)/, "street"],
    [/\b(woods|forest|trees|garden|clearing)/, "forest"],
    [/\b(rest\b|sleep|supper|meal|breakfast|first light|dawn|homecoming)/, "calm"]
  ];
  function momentMood(t, d) {
    for (const s of [String(t || "").toLowerCase(), String(d || "").split(/(?<=[.!?])\s/)[0].toLowerCase()]) for (const [re, m] of MOMENTS) if (re.test(s)) return m;
    return null;
  }
  function guessMoments(id, main) {
    const M = A.get && A.maps && A.maps[id] ? A.get(id, 99) : null, out = [];
    for (const e of Object.values((M && M.enc) || {})) {
      const m = momentMood(e.t, e.d); if (!m || m === main || !MOODS[m] || !e.t) continue;
      out.push([e.t, m]); if (out.length >= 4) break;
    }
    return out;
  }
  function songsOf(id) {
    const own = (A.meta[id] || {}).music, main = themeFor(id);
    let also = own && typeof own === "object" && own.also, guessed = false;
    if (!also && !MOODS[main.mood].off) { also = guessMoments(id, main.mood); guessed = true; }
    return { main, guessed, also: (Array.isArray(also) ? also : Object.entries(also || {})).filter(([, m]) => MOODS[m]).map(([when, mood]) => ({ when, mood, label: MOODS[mood].label })) };
  }
  function spec(id, mood) {
    const own = id && A.meta[id] ? A.meta[id].music : null, fl = own && typeof own === "object" && FLAVOURS[own.flavour] ? own.flavour : flavour();
    return { mood, flavour: fl, seed: hashStr((id || "over") + "|" + mood), label: MOODS[mood].label, place: id || null };
  }

  /* ---- instruments. o: partials [wave, ratio, level, detune]. d: struck or plucked, rings this long. Otherwise
          held: a attack, s level, r release. vib: [speed, depth in cents]; trem: [speed, depth] of loudness;
          breath: the air around a blown note; chiff: the click or puff that starts a note; slide: [semitones,
          seconds] the note slides in from; lp: a fixed tone; lpEnv: the tone of a struck note, bright then dull;
          bloom: [from, to, seconds] a held note brightening as it opens (brass); fsweep: [speed, Hz] a slow sweep of
          the tone; fm: [ratio, depth, seconds, what is left] the bell-like tone of FM synthesis; formants: the
          shapes of a mouth or a wooden body; echo: sent to the style's echo. */
  const INST = {
    flute:    { o: [["sine", 1, 1], ["sine", 2, .12], ["sine", 3, .04]], a: .09, s: .8, r: .35, vib: [4.8, 7], breath: .05, lp: 3200 },
    reed:     { o: [["triangle", 1, .8], ["square", 1, .1], ["sine", 2, .15]], a: .07, s: .75, r: .3, vib: [5.2, 5], lp: 1800 },
    horn:     { o: [["sawtooth", 1, .5], ["square", 1, .2], ["sine", .5, .5]], a: .35, s: .8, r: .9, lp: 420 },
    pluck:    { o: [["triangle", 1, .9], ["sawtooth", 1, .22], ["sine", 2, .2]], a: .004, d: 1.6, lpEnv: [6, 1.5] },
    oud:      { o: [["sawtooth", 1, .45], ["triangle", 1, .7], ["sine", .5, .25]], a: .004, d: 1.1, lpEnv: [5, 1.2], chiff: .05 },
    koto:     { o: [["triangle", 1, .8], ["sawtooth", 1, .3], ["sine", 3, .1]], a: .003, d: 1.9, lpEnv: [9, 2], chiff: .04 },
    piano:    { o: [["triangle", 1, .8], ["sine", 2, .25], ["sine", 3, .08]], a: .006, d: 2.6, lpEnv: [5, 1.5] },
    epiano:   { o: [["sine", 1, .9], ["sine", 2, .18], ["sine", 4, .06]], a: .008, d: 3.2 },
    musicbox: { o: [["sine", 2, .8], ["sine", 5.52, .13], ["sine", 8, .05]], a: .003, d: 2.4 },
    glass:    { o: [["sine", 1, .8], ["sine", 3.01, .1], ["sine", 2, .1]], a: .5, s: .7, r: 1.6 },
    blip:     { o: [["sine", 2, .7], ["square", 2, .06]], a: .004, d: .5 },
    bell:     { o: [["sine", .5, .5], ["sine", 1, 1], ["sine", 1.19, .5], ["sine", 1.5, .35], ["sine", 2, .45], ["sine", 2.51, .2], ["sine", 3.01, .15]], a: .004, d: 7 },
    organ:    { o: [["sine", 1, .7], ["sine", 2, .4], ["sine", 3, .18], ["sine", 4, .1], ["sine", .5, .3]], a: .6, s: .85, r: 1.8, lp: 2400 },
    strings:  { o: [["sawtooth", 1, .5, -7], ["sawtooth", 1, .5, 7], ["sawtooth", .5, .2, 3]], a: 2.2, s: .8, r: 3, lp: 1100 },
    synth:    { o: [["sawtooth", 1, .45, -9], ["square", 1, .22, 9], ["sine", .5, .4]], a: 2.6, s: .8, r: 3.5, lp: 900 },
    choir:    { o: [["sawtooth", 1, .35, -5], ["sawtooth", 1, .35, 5], ["sine", 1, .5]], a: 1.8, s: .8, r: 2.6, lp: 700, vib: [4.4, 9] },
    stab:     { o: [["sawtooth", 1, .5, -6], ["sawtooth", 1, .5, 6]], a: .02, s: .8, r: .12, lp: 1400 },
    bass:     { o: [["sine", 1, 1], ["triangle", 1, .18]], a: .05, d: 4 },
    hitstr:   { o: [["sawtooth", 1, .5, -9], ["sawtooth", 1, .5, 9], ["square", .5, .2]], a: .03, d: 2.8, lpEnv: [7, 1.2] },
    // the orchestra of the dark-mystery style: a grand piano with the pedal down, a harp, a solo cello, the low
    // strings, high strings shivering, a low brass swell, and voices (formants: the mouth shaping "ooh" and "aah")
    grand:    { o: [["triangle", 1, .7, -3], ["triangle", 1, .7, 3], ["sine", 2, .22], ["sine", 3, .07], ["sine", .5, .12]], a: .006, d: 4.2, lpEnv: [6, 1.2] },
    harp:     { o: [["triangle", 1, .9], ["sine", 2, .3], ["sine", 3, .1]], a: .003, d: 2.6, lpEnv: [8, 2] },
    cello:    { o: [["sawtooth", 1, .6], ["sawtooth", 1, .3, 6], ["sine", .5, .15]], a: .22, s: .85, r: .8, lp: 1300, vib: [5, 9] },
    lowstr:   { o: [["sawtooth", 1, .5, -5], ["sawtooth", 1, .5, 5], ["sine", 1, .4]], a: 1.6, s: .85, r: 2.8, lp: 430 },
    hstr:     { o: [["sawtooth", 1, .5, -8], ["sawtooth", 1, .5, 8]], a: 2.8, s: .9, r: .3, lp: 2800, trem: [9, .35] },
    brass:    { o: [["sawtooth", 1, .6], ["square", 1, .18], ["sine", .5, .3]], a: 1.5, s: .85, r: 1.6, lp: 520 },
    choirM:   { o: [["sawtooth", 1, .5, -6], ["sawtooth", 1, .5, 6], ["sawtooth", 1, .3]], a: 2, s: .85, r: 2.8, vib: [4.6, 8], breath: .012, formants: [[340, 5, 1], [800, 7, .45], [2500, 8, .12]] },
    choirF:   { o: [["sawtooth", 1, .5, -7], ["sawtooth", 1, .5, 7], ["sawtooth", 1, .3]], a: 2.2, s: .85, r: 3, vib: [5, 8], breath: .012, formants: [[720, 5, 1], [1150, 7, .5], [2750, 8, .14]] },
    // the middle ages: a lute strung in pairs, a recorder, the vielle, the shawm (a loud double reed), a hurdy-gurdy
    // buzzing, a portative organ, a hammered dulcimer, little bells, the busine, plainchant, a horn
    lute:     { o: [["triangle", 1, .7, -4], ["triangle", 1, .7, 4], ["sawtooth", 1, .16], ["sine", 2, .3, 3]], a: .003, d: 1.3, lpEnv: [8, 1.6], chiff: .05 },
    recorder: { o: [["sine", 1, 1], ["triangle", 1, .18], ["sine", 2, .06]], a: .03, s: .8, r: .12, vib: [5.2, 3], breath: .08, chiff: .07, lp: 3800 },
    vielle:   { o: [["sawtooth", 1, .55, -3], ["sawtooth", 1, .45, 4], ["sawtooth", 2, .12]], a: .1, s: .85, r: .25, vib: [5.6, 7], formants: [[480, 3, .9], [1400, 4, .7], [2900, 5, .3]] },
    shawm:    { o: [["sawtooth", 1, .6], ["square", 1, .35], ["sawtooth", 2, .25]], a: .04, s: .85, r: .12, vib: [5.8, 5], formants: [[1100, 3, 1], [2300, 4, .7], [3400, 6, .3]] },
    gurdy:    { o: [["sawtooth", 1, .5, -3], ["sawtooth", 1, .5, 3], ["sawtooth", 2, .15]], a: .35, s: .9, r: .7, trem: [24, .16], formants: [[700, 2.5, 1], [1800, 4, .5]] },
    portative:{ o: [["sine", 1, .7], ["sine", 2, .45], ["triangle", 1, .2], ["sine", 3, .12]], a: .12, s: .85, r: .35, breath: .02, lp: 3000 },
    dulcimer: { o: [["triangle", 1, .7, -6], ["triangle", 1, .7, 6], ["sine", 2.01, .3], ["sine", 3.03, .12]], a: .002, d: 2.4, lpEnv: [11, 2.6] },
    cymbala:  { o: [["sine", 1, 1], ["sine", 2.76, .3], ["sine", 5.4, .08]], a: .003, d: 3.2 },
    busine:   { o: [["sawtooth", 1, .65], ["square", 1, .2], ["sawtooth", 2, .15]], a: .05, s: .85, r: .2, bloom: [1.2, 7, .12] },
    chant:    { o: [["sawtooth", 1, .5, -5], ["sawtooth", 1, .5, 5], ["sawtooth", 1, .35]], a: .35, s: .85, r: .6, vib: [4.2, 3], breath: .01, formants: [[600, 5, 1], [1000, 6, .5], [2450, 8, .12]] },
    frhorn:   { o: [["sawtooth", 1, .45], ["triangle", 1, .5], ["sine", .5, .12]], a: .22, s: .85, r: .5, vib: [4.8, 4], bloom: [1, 3.2, .4] },
    // the gaslight age and the wars: an upright piano a little out of tune, a clarinet, a solo violin, a string
    // quartet, a harmonium, the barrel organ, a cornet and a tuba, a double bass bowed and plucked, an accordion
    upright:  { o: [["triangle", 1, .7, -7], ["triangle", 1, .7, 6], ["sine", 2, .28, 2], ["sine", 3, .1], ["sawtooth", 1, .05]], a: .005, d: 2.2, lpEnv: [7, 1.5] },
    clarinet: { o: [["square", 1, .45], ["sine", 1, .5], ["sine", 3, .08]], a: .06, s: .8, r: .22, vib: [5, 3], breath: .02, lp: 1900 },
    violin:   { o: [["sawtooth", 1, .6], ["sawtooth", 1, .25, 5], ["sawtooth", 2, .08]], a: .14, s: .85, r: .35, vib: [5.8, 16], slide: [-.5, .12], formants: [[450, 2, .8], [1100, 3, .8], [2600, 4, .55], [4200, 5, .2]] },
    quartet:  { o: [["sawtooth", 1, .42, -6], ["sawtooth", 1, .42, 6], ["triangle", 1, .3]], a: 1.2, s: .8, r: 2, lp: 1900, vib: [5.4, 6] },
    harmonium:{ o: [["sawtooth", 1, .4], ["square", 1, .22], ["sawtooth", 2, .1, 3]], a: .18, s: .85, r: .5, lp: 1500, trem: [5.2, .1] },
    barrel:   { o: [["square", 1, .25], ["sine", 1, .55], ["sine", 2, .4], ["triangle", 4, .08]], a: .02, s: .8, r: .1, trem: [6.8, .22], lp: 3200 },
    cornet:   { o: [["sawtooth", 1, .6], ["square", 1, .16], ["sine", 1, .3]], a: .05, s: .82, r: .18, vib: [5.2, 4], bloom: [1.5, 6, .1] },
    tuba:     { o: [["sawtooth", 1, .4], ["sine", 1, .7]], a: .04, s: .8, r: .15, lp: 520 },
    cbass:    { o: [["sawtooth", 1, .45], ["sine", 1, .6]], a: .35, s: .8, r: .9, lp: 650, vib: [5, 5] },
    pizz:     { o: [["triangle", 1, .8], ["sine", 1, .5], ["sine", 2, .15]], a: .004, d: .9, lpEnv: [5, 1.2] },
    accordion:{ o: [["sawtooth", 1, .35, -9], ["sawtooth", 1, .35, 9], ["square", 1, .15], ["sawtooth", 2, .08]], a: .05, s: .85, r: .12, lp: 2600 },
    // today: a felt piano, a Rhodes, an electric guitar, a warm analogue pad, a vibraphone, a sub bass, a synth bass
    felt:     { o: [["sine", 1, .9], ["triangle", 1, .35], ["sine", 2, .15], ["sine", 3, .04]], a: .01, d: 2.8, lpEnv: [3.5, 1], chiff: .03 },
    rhodes:   { o: [["sine", 1, .9], ["sine", 2, .12]], fm: [1, 1.6, .25, .05], a: .006, d: 3, trem: [4.6, .18] },
    eguitar:  { o: [["triangle", 1, .7], ["sawtooth", 1, .14], ["sine", 2, .22]], a: .004, d: 2.2, lpEnv: [5, 1.6], echo: 1 },
    warmpad:  { o: [["sawtooth", 1, .38, -12], ["sawtooth", 1, .38, 12], ["sawtooth", .5, .22]], a: 3, s: .8, r: 4, lp: 650, fsweep: [.07, 350] },
    vibes:    { o: [["sine", 1, 1], ["sine", 4, .18], ["sine", 10, .03]], a: .003, d: 3.4, trem: [5.5, .32], echo: 1 },
    sub:      { o: [["sine", 1, 1], ["sine", 2, .08]], a: .02, d: 3.6 },
    synbass:  { o: [["sawtooth", 1, .5], ["square", 1, .25, 5]], a: .004, d: .45, lpEnv: [7, 1.2] },
    // science fiction: a CS-80 pad, a gliding synth lead, a theremin, FM bells and keys, a sequenced arpeggio
    cs80:     { o: [["sawtooth", 1, .45, -10], ["sawtooth", 1, .45, 10], ["sawtooth", 2, .1]], a: 1.4, s: .85, r: 3, bloom: [1, 5, 1.6] },
    synlead:  { o: [["sawtooth", 1, .5], ["sawtooth", 1, .4, 8]], a: .06, s: .85, r: .5, vib: [5.5, 10], slide: [-2, .1], bloom: [2, 7, .25], echo: 1 },
    theremin: { o: [["sine", 1, 1], ["sine", 2, .06], ["triangle", 1, .1]], a: .3, s: .9, r: .6, vib: [6.2, 26], slide: [-3, .35], echo: 1 },
    fmbell:   { o: [["sine", 1, 1]], fm: [3.5, 2.2, 1.2, .05], a: .003, d: 4.5, echo: 1 },
    fmkeys:   { o: [["sine", 1, .9], ["sine", 2, .1]], fm: [1, 2.4, .35, .08], a: .004, d: 2.6, echo: 1 },
    arp:      { o: [["square", 1, .45], ["sawtooth", 1, .3, 7]], a: .003, d: .35, lpEnv: [12, 2] },
    // the Arab world: the ney, the qanun, the rebab, the violins of the orchestra (the oud is above)
    ney:      { o: [["sine", 1, .9], ["sine", 2, .22], ["sine", 3, .06]], a: .22, s: .75, r: .4, vib: [5, 9], breath: .2, slide: [-.7, .25], lp: 3000 },
    qanun:    { o: [["triangle", 1, .7, -3], ["triangle", 1, .7, 3], ["sine", 2, .35], ["sine", 3, .15], ["sawtooth", 1, .06]], a: .002, d: 1.7, lpEnv: [13, 3] },
    rebab:    { o: [["sawtooth", 1, .55], ["sawtooth", 1, .3, 6]], a: .2, s: .85, r: .5, vib: [5.8, 14], formants: [[750, 3, 1], [1700, 4, .6], [2800, 6, .25]] },
    kaman:    { o: [["sawtooth", 1, .42, -7], ["sawtooth", 1, .42, 7], ["sawtooth", 1, .2]], a: 1.1, s: .85, r: 1.8, lp: 1700, vib: [6, 12] },
    // Japan: the shakuhachi, the shamisen, the shō, the shinobue, a singing bowl, the temple bell (the koto is above)
    shakuhachi:{ o: [["sine", 1, .9], ["triangle", 1, .15], ["sine", 2, .12]], a: .18, s: .72, r: .5, vib: [4.6, 14], breath: .26, chiff: .1, slide: [-1, .3], lp: 2600 },
    shamisen: { o: [["sawtooth", 1, .5], ["triangle", 1, .5], ["sawtooth", 2, .1, 6]], a: .002, d: .8, lpEnv: [15, 2.2], chiff: .08 },
    sho:      { o: [["square", 1, .2], ["sawtooth", 1, .22], ["sine", 1, .5], ["sine", 2, .2]], a: 1.4, s: .8, r: 1.6, lp: 2400 },
    shinobue: { o: [["sine", 1, 1], ["sine", 2, .1]], a: .06, s: .8, r: .2, vib: [5.5, 10], breath: .12, chiff: .08, lp: 4500 },
    bowl:     { o: [["sine", 1, .8, -2], ["sine", 1, .6, 2], ["sine", 2.71, .3], ["sine", 5.15, .08]], a: .01, d: 8 },
    bonsho:   { o: [["sine", .5, .6], ["sine", 1, 1, -5], ["sine", 1, .7, 5], ["sine", 2.37, .3], ["sine", 3.9, .1]], a: .02, d: 12 },
    // the Mediterranean: a Spanish guitar, the mandolin in tremolo, the bouzouki (the accordion is above)
    nylon:    { o: [["triangle", 1, .8], ["sine", 2, .22], ["sine", 3, .07], ["sawtooth", 1, .05]], a: .004, d: 2.1, lpEnv: [5, 1.3] },
    mandolin: { o: [["triangle", 1, .6, -4], ["triangle", 1, .6, 4], ["sawtooth", 1, .16], ["sine", 2, .2]], a: .01, s: .75, r: .25, trem: [13, .45], lp: 3400 },
    bouzouki: { o: [["sawtooth", 1, .35], ["triangle", 1, .5], ["triangle", 2, .35, 5]], a: .002, d: 1.1, lpEnv: [12, 2.5] },
    // fantasy: the concert flute, a tin whistle, a fiddle, lush strings, a celesta (the harp and horn are above)
    fflute:   { o: [["sine", 1, 1], ["sine", 2, .16], ["sine", 3, .05]], a: .1, s: .8, r: .4, vib: [5.2, 9], breath: .045, lp: 3600 },
    whistle:  { o: [["sine", 1, 1], ["triangle", 1, .1], ["sine", 2, .05]], a: .02, s: .8, r: .1, vib: [5.6, 6], breath: .07, chiff: .07, lp: 5000 },
    fiddle:   { o: [["sawtooth", 1, .6], ["sawtooth", 1, .22, 6]], a: .04, s: .85, r: .12, vib: [5.5, 8], formants: [[500, 2, .8], [1300, 3, .8], [2800, 4, .5]] },
    lush:     { o: [["sawtooth", 1, .4, -9], ["sawtooth", 1, .4, 9], ["sawtooth", 2, .1], ["triangle", 1, .3]], a: 1.6, s: .85, r: 2.6, lp: 2300, vib: [5, 5] },
    celesta:  { o: [["sine", 1, .9], ["sine", 4, .12], ["sine", 2, .06]], a: .002, d: 1.8 }
  };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  // swell: a held note that rises to its height a little before half way and falls away again, as a section breathes;
  // bend: [semitones, seconds] this one note slides in from (an ornament), in place of the instrument's own slide
  function voice(T, name, midi, t, dur, vel, bus, swell, bend) {
    const I = INST[name] || INST.piano, ac = T.ac, f = hz(Math.max(24, Math.min(100, midi))), g = ac.createGain(), lp = ac.createBiquadFilter();
    let end;
    g.gain.setValueAtTime(0, t);
    if (I.d) { g.gain.linearRampToValueAtTime(vel, t + I.a); g.gain.setTargetAtTime(0, t + I.a, I.d / 4.5); end = t + I.a + I.d * 1.35; }
    else if (swell) { const hold = Math.max(dur, 1); g.gain.linearRampToValueAtTime(vel * I.s, t + hold * .45); g.gain.setTargetAtTime(vel * I.s * .14, t + hold * .45, hold * .2); g.gain.setTargetAtTime(0, t + hold, I.r / 4); end = t + hold + I.r * 1.6; }
    else { const hold = Math.max(dur, I.a + .03); g.gain.linearRampToValueAtTime(vel * I.s, t + I.a); g.gain.setTargetAtTime(0, t + hold, I.r / 4); end = t + hold + I.r * 1.6; }
    lp.type = "lowpass";
    if (I.lpEnv) { lp.frequency.setValueAtTime(Math.min(12000, f * I.lpEnv[0]), t); lp.frequency.setTargetAtTime(Math.min(12000, f * I.lpEnv[1]), t, I.d / 6); }
    else if (I.bloom) { lp.frequency.setValueAtTime(Math.min(12000, f * I.bloom[0]), t); lp.frequency.linearRampToValueAtTime(Math.min(12000, f * I.bloom[1]), t + I.bloom[2]); }
    else lp.frequency.value = I.lp || 9000;
    if (I.fsweep) { const sl = ac.createOscillator(), sg = ac.createGain(); sl.frequency.value = I.fsweep[0]; sg.gain.value = I.fsweep[1]; sl.connect(sg); sg.connect(lp.frequency); sl.start(t); sl.stop(end); }
    // the partials meet in `pre`; from there through a low-pass, or through a bank of formants for a voice
    const pre = ac.createGain(); let tail = lp;
    if (I.formants) { tail = ac.createGain(); for (const [ff, q, lv] of I.formants) { const b = ac.createBiquadFilter(), bg = ac.createGain(); b.type = "bandpass"; b.frequency.value = ff; b.Q.value = q; bg.gain.value = lv * 2.2; pre.connect(b); b.connect(bg); bg.connect(tail); } } else pre.connect(lp);
    if (I.trem) { const tl = ac.createOscillator(), tg = ac.createGain(), am = ac.createGain(); tl.frequency.value = I.trem[0]; tg.gain.value = I.trem[1]; am.gain.value = 1 - I.trem[1]; tl.connect(tg); tg.connect(am.gain); tail.connect(am); tail = am; tl.start(t); tl.stop(end); }
    let lfo = null, lg = null;
    if (I.vib) { lfo = ac.createOscillator(); lg = ac.createGain(); lfo.frequency.value = I.vib[0]; lg.gain.value = I.vib[1]; lfo.connect(lg); lfo.start(t); lfo.stop(end); }
    // FM: one more oscillator shakes the pitch of the others, hard at the strike and then less (a tine, a bell)
    let fmg = null;
    if (I.fm) { const mo = ac.createOscillator(); fmg = ac.createGain(); mo.frequency.value = f * I.fm[0]; fmg.gain.setValueAtTime(f * I.fm[1], t); fmg.gain.setTargetAtTime(f * I.fm[1] * (I.fm[3] || 0), t, I.fm[2]); mo.connect(fmg); mo.start(t); mo.stop(end); }
    const sl = bend || I.slide;
    for (const [type, ratio, level, det] of I.o) {
      const o = ac.createOscillator(), og = ac.createGain(); o.type = type; if (det) o.detune.value = det; og.gain.value = level * .5;
      if (sl) { o.frequency.setValueAtTime(f * ratio * Math.pow(2, sl[0] / 12), t); o.frequency.exponentialRampToValueAtTime(f * ratio, t + sl[1]); } else o.frequency.value = f * ratio;
      if (lg) lg.connect(o.detune);
      if (fmg) fmg.connect(o.frequency);
      o.connect(og); og.connect(pre); o.start(t); o.stop(end);
    }
    if (I.breath) { const s = ac.createBufferSource(), b = ac.createBiquadFilter(), bg = ac.createGain(); s.buffer = T.E.white; s.loop = true; b.type = "bandpass"; b.frequency.value = Math.min(9000, f * 2); b.Q.value = 1.5; bg.gain.value = I.breath; s.connect(b); b.connect(bg); bg.connect(g); s.start(t, T.rnd() * 2); s.stop(end); }
    if (I.chiff) burst(T, t, .03, vel * I.chiff, "bandpass", Math.min(8000, f * 4), .9, T.E.white, bus || T.mus || T.in);
    tail.connect(g); g.connect(bus || T.mus || T.in);
    if (I.echo && T.dly) g.connect(T.dly);
  }
  // one-shots: a sine that falls in pitch (a drip, a drum), a burst of filtered noise (a tick, a hiss, a clank)
  const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0, t + a, d / 4); };
  function ping(T, t, f0, f1, d, vel, bus, type) { const ac = T.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d); env(g, t, .004, vel, d); o.connect(g); g.connect(bus || T.in); o.start(t); o.stop(t + d * 1.7 + .05); }
  function burst(T, t, d, vel, type, f, q, buf, bus, attack) { const ac = T.ac, s = ac.createBufferSource(), b = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = buf || T.E.white; s.loop = true; b.type = type; b.frequency.value = f; if (q) b.Q.value = q; env(g, t, attack || Math.min(.008, d / 4), vel, d); s.connect(b); b.connect(g); g.connect(bus || T.in); s.start(t, T.rnd() * 2); s.stop(t + (attack || 0) + d * 1.8 + .05); return b; }

  // A voice made of nothing: an oscillator for the throat, its pitch following a contour ([fraction of the length, Hz]),
  // a wobble, breath, a fast rattle (a growl), grit (a soft clipper, the strain of a scream), and band-passes for the
  // mouth or muzzle, which may move (a cat's "ow"). far: heard from a distance, its top cut away.
  function vocal(T, t, v) {
    const ac = T.ac, d = v.dur, end = t + d + .15, pre = ac.createGain(), sum = ac.createGain(), lp = ac.createBiquadFilter(), out = ac.createGain();
    const osc = ac.createOscillator(); osc.type = v.wave || "sawtooth";
    osc.frequency.setValueAtTime(v.pitch[0][1], t); for (const [k, f] of v.pitch.slice(1)) osc.frequency.linearRampToValueAtTime(f, t + d * k);
    if (v.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = v.vib[0]; lg.gain.value = v.vib[1]; l.connect(lg); lg.connect(osc.detune); l.start(t); l.stop(end); }
    osc.connect(pre); osc.start(t); osc.stop(end);
    if (v.noise) { const s = ac.createBufferSource(), ng = ac.createGain(); s.buffer = T.E.white; s.loop = true; ng.gain.value = v.noise; s.connect(ng); ng.connect(pre); s.start(t, T.rnd() * 2); s.stop(end); }
    let src = pre;
    if (v.rattle) { const am = ac.createGain(), r = ac.createOscillator(), rg = ac.createGain(); am.gain.value = 1 - v.rattle[1]; r.frequency.value = v.rattle[0]; rg.gain.value = v.rattle[1]; r.connect(rg); rg.connect(am.gain); pre.connect(am); r.start(t); r.stop(end); src = am; }
    if (v.grit) { const ws = ac.createWaveShaper(), n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = Math.tanh((i / (n - 1) * 2 - 1) * v.grit); ws.curve = c; src.connect(ws); src = ws; }
    for (const [f, q, lv, f2] of v.form) { const b = ac.createBiquadFilter(), bg = ac.createGain(); b.type = "bandpass"; b.Q.value = q; b.frequency.setValueAtTime(f, t); if (f2) b.frequency.linearRampToValueAtTime(f2, t + d * .6); bg.gain.value = lv; src.connect(b); b.connect(bg); bg.connect(sum); }
    lp.type = "lowpass"; lp.frequency.value = v.far ? 1500 : 9000;
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(v.vel, t + (v.a || .05)); out.gain.setValueAtTime(v.vel, t + d * (v.hold || .7)); out.gain.linearRampToValueAtTime(0, t + d);
    sum.connect(lp); lp.connect(out); out.connect(T.in);
  }
  const knock1 = (T, t, v) => { ping(T, t, 150, 70, .09, .5 * v); burst(T, t, .07, .4 * v, "bandpass", 360 + T.rnd() * 140, 2.5, T.E.white, T.in, .001); burst(T, t, .012, .12 * v, "highpass", 2600, 0, T.E.white, T.in, .001); };
  /* ---- sounds that come now and then: each plays once, at t, into T.in (a theme's, or the Music tab's "hear it").
          o: the theme's { root, F }. T.rnd is the theme's own dice, so a place always sounds the same. The first nine
          are the sounds Atlas has always had (moved here unchanged); the rest were asked for by the user (14 Oct 2026):
          "person screaming, someone knocking, gun shots, monster sounds, dog barking, cat screaming and stuff like that
          for horror". All are made here, from oscillators and noise: no recordings. */
  const SFX = {
    tick(T, t) { burst(T, t, .012, .1, "highpass", 3200, 0, T.E.white, T.tex); burst(T, t + .5, .012, .075, "highpass", 2400, 0, T.E.white, T.tex); },
    heart(T, t) { ping(T, t, 62, 40, .13, .55); ping(T, t + .27, 54, 38, .12, .38); },
    toll(T, t, o) { voice(T, o.F.toll || "bell", o.root - 2 + (T.rnd() < .5 ? 0 : 12) - 12, t, 6, .3); },
    clank(T, t) { const ac = T.ac, f = 320 + T.rnd() * 420, b = ac.createBiquadFilter(), g = ac.createGain(); b.type = "bandpass"; b.frequency.value = f * 2.2; b.Q.value = 2.5; env(g, t, .002, .12 + T.rnd() * .08, .22 + T.rnd() * .2); for (const r of [1, 1.47, 2.09, 2.83]) { const o = ac.createOscillator(); o.type = "square"; o.frequency.value = f * r; o.connect(b); o.start(t); o.stop(t + .9); } b.connect(g); g.connect(T.in); burst(T, t, .03, .1, "bandpass", 2400, 1); },
    steam(T, t) { burst(T, t, .9 + T.rnd() * .8, .07, "highpass", 2400, 0, T.E.white, T.tex, .12); },
    // lightning close by: the crack of the strike, a second crack sometimes, then its thunder rolling away
    lightning(T, t) { const E = T.E; burst(T, t, .16, .42, "highpass", 1900, 0, E.white, T.in, .002); burst(T, t + .04, .4, .34, "bandpass", 850, .6, E.white, T.in, .002); if (T.rnd() < .6) burst(T, t + .13 + T.rnd() * .1, .18, .22, "highpass", 2400, 0, E.white, T.in, .002); burst(T, t + .2, 3.4 + T.rnd() * 2, .6, "lowpass", 150, 0, E.brown, T.in, .04); burst(T, t + 1.1 + T.rnd(), 2.6, .34, "lowpass", 95, 0, E.brown, T.in, .3); },
    thunder(T, t) { burst(T, t, 3 + T.rnd() * 2, .55, "lowpass", 110 + T.rnd() * 60, 0, T.E.brown, T.in, .25); if (T.rnd() < .5) burst(T, t + .5 + T.rnd(), 2, .3, "lowpass", 90, 0, T.E.brown, T.in, .2); },
    whisper(T, t) { const b = burst(T, t, 1 + T.rnd() * .8, .07, "bandpass", 1200, 6, T.E.white, T.in, .3); b.frequency.linearRampToValueAtTime(2600, t + .6); b.frequency.linearRampToValueAtTime(900, t + 1.6); },
    horn(T, t, o) { voice(T, o.F.horn || "horn", o.root - 14, t, 2.4, .2); if (T.rnd() < .4) voice(T, o.F.horn || "horn", o.root - 14, t + 3.1, 1.2, .16); },
    // a person screaming: a strained voice leaping up and breaking, sometimes far off
    scream(T, t) { const k = .85 + T.rnd() * .4, far = T.rnd() < .45; vocal(T, t, { dur: 1.2 + T.rnd() * .9, pitch: [[0, 380 * k], [.14, 840 * k], [.6, 780 * k], [1, 500 * k]], vib: [7, 45], noise: .22, grit: 3, form: [[900, 4, 1], [1500, 5, .7], [3000, 6, .45]], vel: far ? .16 : .3, far, a: .07 }); },
    // someone knocking at a door: three hard knocks, or two, or four; now and then slow, one... two... three
    knock(T, t) { const slow = T.rnd() < .3, n = slow ? 3 : 2 + Math.floor(T.rnd() * 3), gap = slow ? .9 + T.rnd() * .3 : .28 + T.rnd() * .1; for (let i = 0; i < n; i++) knock1(T, t + i * gap, (slow ? 1 : .85 + T.rnd() * .2) * (i === n - 1 && !slow ? 1.1 : 1)); },
    // footsteps, slow and heavy, coming nearer or going away; a board creaks under one of them
    steps(T, t) { const n = 4 + Math.floor(T.rnd() * 4), gap = .6 + T.rnd() * .2, near = T.rnd() < .5; for (let i = 0; i < n; i++) { const v = .35 + .65 * (near ? i / (n - 1) : 1 - i / (n - 1)), tt = t + i * gap; ping(T, tt, 115, 55, .09, .38 * v); burst(T, tt, .07, .2 * v, "bandpass", 280, 1.5, T.E.white, T.in, .002); if (i === 2 && T.rnd() < .6) SFX.creak(T, tt + .05, null, .5 * v); } },
    // a door creaking open: the slip and catch of a dry hinge, ringing in the wood
    creak(T, t, o, lv) { const ac = T.ac, d = 1.1 + T.rnd() * 1.1, end = t + d + .1, osc = ac.createOscillator(), g = ac.createGain(); osc.type = "sawtooth"; osc.frequency.setValueAtTime(22 + T.rnd() * 8, t); osc.frequency.linearRampToValueAtTime(55 + T.rnd() * 25, t + d * .4); osc.frequency.linearRampToValueAtTime(30, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.3 * (lv || 1), t + .12); g.gain.setValueAtTime(1.3 * (lv || 1), t + d * .8); g.gain.linearRampToValueAtTime(0, t + d); for (const [f, q, l] of [[750 + T.rnd() * 300, 9, 1], [1700 + T.rnd() * 400, 12, .5]]) { const b = ac.createBiquadFilter(), bg = ac.createGain(); b.type = "bandpass"; b.frequency.setValueAtTime(f, t); b.frequency.linearRampToValueAtTime(f * 1.15, t + d); b.Q.value = q; bg.gain.value = l; osc.connect(b); b.connect(bg); bg.connect(g); } g.connect(T.in); osc.start(t); osc.stop(end); },
    // heavy breathing, close: in, and out, two or three times
    breath(T, t) { const n = 2 + Math.floor(T.rnd() * 2); for (let i = 0; i < n; i++) { const tt = t + i * 2.3; const a = burst(T, tt, .8, .26, "bandpass", 650, 1.6, T.E.white, T.in, .5); a.frequency.linearRampToValueAtTime(1300, tt + .8); const b = burst(T, tt + 1, .95, .36, "bandpass", 1200, 1.3, T.E.white, T.in, .25); b.frequency.linearRampToValueAtTime(480, tt + 2); } },
    // something that is not an animal: a low growl with a rattle in it, or now and then a roar
    monster(T, t) { const roar = T.rnd() < .35, k = .8 + T.rnd() * .4; vocal(T, t, roar ? { dur: 1.8 + T.rnd(), pitch: [[0, 110 * k], [.2, 190 * k], [.7, 160 * k], [1, 80 * k]], rattle: [24, .5], noise: .6, grit: 6, form: [[420, 3, 1], [950, 4, .8], [2100, 5, .35]], vel: .42, a: .12 } : { dur: 2 + T.rnd() * 1.4, pitch: [[0, 68 * k], [.3, 92 * k], [1, 55 * k]], rattle: [32 + T.rnd() * 10, .65], noise: .5, grit: 5, form: [[330, 3, 1], [780, 4, .8], [1700, 5, .3]], vel: .48, a: .25, hold: .8 }); ping(T, t, 70 * k, 38, 1.4, .25); },
    // a wolf howling, far off
    wolf(T, t) { const k = .9 + T.rnd() * .2; vocal(T, t, { dur: 2.6 + T.rnd() * 1.5, pitch: [[0, 340 * k], [.22, 540 * k], [.75, 515 * k], [1, 390 * k]], vib: [5, 22], noise: .05, form: [[420, 6, 1, 720], [950, 8, .35]], vel: .36, far: true, a: .3, hold: .65 }); },
    // a dog barking: two to four barks, a big dog or a small one, close or across the way
    dog(T, t) { const n = 2 + Math.floor(T.rnd() * 3), size = .7 + T.rnd() * .45, far = T.rnd() < .5; for (let i = 0; i < n; i++) vocal(T, t + i * (.3 + T.rnd() * .15), { dur: .15 + T.rnd() * .07, pitch: [[0, 430 * size], [.25, 580 * size], [1, 300 * size]], noise: .35, grit: 2.5, form: [[620, 3, 1], [1250, 4, .7], [2600, 5, .3]], vel: far ? .2 : .36, far, a: .01, hold: .35 }); },
    // a cat screaming: the long rising yowl of a tom, or the screech of a fight
    cat(T, t) { const fight = T.rnd() < .4; vocal(T, t, fight ? { dur: .7 + T.rnd() * .4, pitch: [[0, 820], [.2, 1350], [1, 900]], vib: [11, 70], noise: .3, grit: 4, form: [[1100, 4, 1, 2200], [3000, 6, .6]], vel: .26, a: .02 } : { dur: 1.1 + T.rnd() * .7, pitch: [[0, 430], [.4, 700], [.75, 790], [1, 560]], vib: [9, 60], noise: .08, grit: 1.5, form: [[700, 6, 1, 1600], [2200, 7, .6, 3000], [4000, 8, .3]], vel: .26, a: .15 }); },
    // chains rattling: a loose run of iron links
    chains(T, t) { const n = 7 + Math.floor(T.rnd() * 8); for (let i = 0; i < n; i++) { const tt = t + T.rnd() * 1.3; burst(T, tt, .06 + T.rnd() * .05, .4 + T.rnd() * .3, "bandpass", 2600 + T.rnd() * 2400, 9, T.E.white, T.in, .001); burst(T, tt, .02, .22, "bandpass", 900 + T.rnd() * 500, 3, T.E.white, T.in, .001); } },
    // gunshots: one to three, the crack, the boom and the echo off the walls; or far off, only the boom
    gunshot(T, t) { const n = 1 + Math.floor(T.rnd() * 3), far = T.rnd() < .4; for (let i = 0; i < n; i++) { const tt = t + i * (.25 + T.rnd() * .5), v = far ? .4 : 1; if (!far) burst(T, tt, .03, .7, "highpass", 1500, 0, T.E.white, T.in, .001); burst(T, tt, .18, .5 * v, "lowpass", far ? 500 : 900, 0, T.E.white, T.in, .001); ping(T, tt, 95, 40, .35, .5 * v); burst(T, tt + .06, 1.2, .12 * v, "lowpass", 450, 0, T.E.brown, T.in, .05); } }
  };

  /* ---- one theme: a mood in a flavour, grown from a seed. Everything is scheduled ahead by advance(until). */
  function Theme(E, spec, t0) {
    // spec.mix: music the referee made in the Music tab, a mood of their own (see mixM)
    const T = this, ac = E.ac, F = FLAVOURS[spec.flavour] || FLAVOURS.industrial, M = spec.mix ? Object.assign({}, spec.mix) : Object.assign({}, MOODS[spec.mood] || MOODS.mystery, F.moods && F.moods[spec.mood]), rnd = mulberry32(spec.seed || 1);
    Object.assign(T, { E, ac, M, F, rnd, t0, spec, mods: [], stops: [], dead: false });
    const G = v => { const g = ac.createGain(); g.gain.value = v; return g; };
    T.out = G(0); T.out.gain.setValueAtTime(0, t0); T.out.gain.linearRampToValueAtTime(spec.raw ? 1 : spec.mix ? (spec.mix.auto || (F.cine ? 1.8 : 1.4)) * (spec.mix.loud || 1) : trimOf(F, FLAVOURS[spec.flavour] ? spec.flavour : "industrial", spec.mood), t0 + 2.5);
    const tone = ac.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = F.cine ? (M.tension > .6 ? 2600 : 3600) : M.tension > .6 ? 4200 : 9500;
    T.in = G(1); T.tex = G(F.cine ? .35 : 1);
    // the orchestra plays through one more gain, which rises and falls from bar to bar: the music breathes
    if (F.cine) { T.mus = G(.3); T.mus.gain.setValueAtTime(.3, t0); T.mus.connect(T.in); }
    const send = G((M.rev || .3) * .55 * (F.cine ? 1.35 : 1)), send2 = G((M.rev || .3) * .18);
    T.in.connect(tone); T.tex.connect(tone); tone.connect(T.out); T.in.connect(send); T.tex.connect(send2); send.connect(E.revIn); send2.connect(E.revIn); T.out.connect(E.master);
    T.links = [send, send2];
    if (M.off) return;

    const scale = SCALES[M.scale || (M.tension > .55 ? F.dark : F.light)], N = scale.length;
    const root = F.root + [0, 2, -2, 3, -3, 5][Math.floor(rnd() * 6)];
    const note = d => scale[((d % N) + N) % N] + 12 * Math.floor(d / N);
    const chord = deg => {
      if (F.harmony === "open" || F.harmony === "drone") { const n = root + 12 + (F.harmony === "drone" ? 0 : note(deg)); return [n, n + 7, n + 12]; }
      const c = [0, 2, 4].map(k => root + 12 + note(deg + k)); if (F.seventh) c.push(root + 12 + note(deg + 6)); return c;
    };
    // (the orchestral style keeps coming home to its minor chord, as the reference does: it never brightens into the relative major)
    const easy = F.cine ? [[0, 3, 0, 4], [0, 5, 0, 4], [0, 0, 3, 4], [0, 5, 3, 0], [0, 3, 5, 0]] : [[0, 3, 4, 0], [0, 5, 3, 4], [0, 2, 3, 4], [0, 4, 5, 3], [0, 3, 0, 4]];
    const hard = F.cine ? [[0, 1, 0, 4], [0, 5, 0, 1], [0, 0, 1, 0], [0, 4, 0, 5], [0, 1, 5, 0]] : [[0, 1, 0, 5], [0, 5, 1, 0], [0, 3, 1, 0], [0, 6, 5, 0], [0, 1, 3, 0]];
    T.prog = (rnd() < M.tension ? hard : easy)[Math.floor(rnd() * 5)];
    // a part named by its role takes the style's instrument for it. "bell" is also an instrument's name: the
    // orchestral style keeps the plain bell it was approved with, every other style plays its own for the dark places
    const pick = n => (F.swap && F.swap[n]) || n, role = r => pick(INST[r] && !(r === "bell" && !F.cine && F.bell) ? r : F[r] || null);
    // (music of the referee's own names its instruments outright, and gets exactly those)
    T.lead = M.lead ? (spec.mix && INST[M.lead] ? M.lead : role(M.lead)) : null; T.padInst = spec.mix && INST[M.padInst] ? M.padInst : pick(M.padInst || F.pad);
    // this style's drums for the mood's pulse, if it has its own (otherwise the plain rhythms in pulse()); music of the
    // referee's own may name any rhythm of any style
    const R = M.rhythm && RHYTHMS[M.rhythm] || M.pulse && F.kit && RHYTHMS[F.kit[M.pulse.kind]] || null;
    const beat = M.pulse ? 60 / M.pulse.bpm / (R && R.speed || 1) : 0;
    T.barLen = M.pulse ? beat * (R && R.beats || 8) : (M.bar || 10) * (.92 + rnd() * .16);
    T.unit = M.pulse ? beat / 2 : T.barLen / 12;
    // the place's own tune: a handful of steps and lengths, kept and varied
    { const n = 4 + Math.floor(rnd() * 4), steps = [-2, -1, -1, 1, 1, 2, 0, 3], lens = M.pulse ? [1, 1, 2, 2, 1, 4] : [1, 2, 2, 3, 3, 4]; let d = [0, 2, 4][Math.floor(rnd() * 3)]; T.motif = []; for (let i = 0; i < n; i++) { T.motif.push({ d, u: lens[Math.floor(rnd() * lens.length)] }); d = Math.max(-3, Math.min(9, d + steps[Math.floor(rnd() * steps.length)])); } }

    // an echo, for the styles that had echo units: what goes in comes back, duller each time, on the beat if there is one
    if (F.echo) { const d = ac.createDelay(2), fb = G(F.echo[1]), wet = G(F.echo[2]), dl = ac.createBiquadFilter(); d.delayTime.value = M.pulse ? beat * .75 : F.echo[0]; dl.type = "lowpass"; dl.frequency.value = 2400; d.connect(dl); dl.connect(fb); fb.connect(d); dl.connect(wet); wet.connect(T.in); T.dly = d; }
    // the drone: root and fifth, low; unease adds a note a semitone off, beating against the root. A style with a
    // droning instrument of its own (a hurdy-gurdy, a rebab, a harmonium) plays that instead, bar by bar, below.
    if (M.drone && !F.drone) {
      const dl = ac.createBiquadFilter(), dg = G(M.drone * (F.cine ? .055 : .16)); dl.type = "lowpass"; dl.frequency.setValueAtTime(300, t0); dl.connect(dg); dg.connect(T.in);
      // (the orchestral style keeps its weight an octave higher: the reference has little below 60 Hz)
      for (const [type, semi, lvl, det] of (F.cine ? [["sawtooth", 0, .4, -4], ["sawtooth", 0, .4, 5], ["triangle", 7, .35, 0], ["sine", -12, .2, 0]] : [["sawtooth", -12, .5, -4], ["sawtooth", -12, .5, 5], ["triangle", -5, .45, 0], ["sine", -24, .9, 0]]).concat(M.tension > .7 ? [["sine", -11, .32, 0], ["sine", -6, .16, 0]] : [])) { const o = ac.createOscillator(), og = G(lvl); o.type = type; o.frequency.value = hz(root + semi); o.detune.value = det; o.connect(og); og.connect(dl); o.start(t0); T.stops.push(o); }
      T.mods.push({ next: t0, step(until) { while (this.next < until) { const d = 5 + rnd() * 7; dl.frequency.linearRampToValueAtTime(180 + rnd() * 420, this.next + d); this.next += d; } } });
    }
    // textures: each a loop of noise (or a hum) through a filter, its loudness and colour wandering
    const loop = buf => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(t0, rnd() * 2); T.stops.push(s); return s; };
    const filt = (type, f, q) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.setValueAtTime(f, t0); if (q) b.Q.value = q; return b; };
    const wander = (first, fn) => T.mods.push({ next: t0 + first, step(until) { while (this.next < until) this.next += fn(this.next); } });
    const chain = (...nodes) => { for (let i = 1; i < nodes.length; i++) nodes[i - 1].connect(nodes[i]); return nodes[nodes.length - 1]; };
    for (const [k, lvl] of Object.entries(M.tex || {})) {
      if (k === "wind") { const b = filt("bandpass", 520, 1.1), g = G(0); g.gain.setValueAtTime(lvl * .3, t0); chain(loop(E.white), b, g, T.tex); wander(0, t => { const d = 2.5 + rnd() * 4.5; b.frequency.linearRampToValueAtTime(260 + rnd() * 900, t + d); g.gain.linearRampToValueAtTime(lvl * (.2 + rnd() * .7), t + d); return d; }); }
      else if (k === "rain") { const g = G(0); g.gain.setValueAtTime(lvl * .22, t0); chain(loop(E.white), filt("highpass", 2600), filt("lowpass", 9000), g, T.tex); wander(0, t => { const d = 4 + rnd() * 6; g.gain.linearRampToValueAtTime(lvl * (.16 + rnd() * .12), t + d); return d; }); }
      else if (k === "water" || k === "sea") { const sea = k === "sea", g = G(0); g.gain.setValueAtTime(lvl * .1, t0); chain(loop(E.white), filt("lowpass", sea ? 900 : 480), g, T.tex); wander(0, t => { const p = (sea ? 7 : 4) + rnd() * (sea ? 4 : 3); g.gain.linearRampToValueAtTime(lvl * (sea ? .55 : .42), t + p * .4); g.gain.linearRampToValueAtTime(lvl * .08, t + p); return p; }); if (sea) chain(loop(E.brown), filt("lowpass", 140), G(lvl * .5), T.tex); }
      else if (k === "hum") { const l = filt("lowpass", 240), g = G(0); g.gain.setValueAtTime(lvl * .4, t0); for (const [type, f, v] of [["sawtooth", 50, .5], ["sine", 100, .6], ["sine", 150.4, .2]]) { const o = ac.createOscillator(), og = G(v); o.type = type; o.frequency.value = f; o.connect(og); og.connect(l); o.start(t0); T.stops.push(o); } chain(l, g, T.tex); wander(0, t => { const d = 3 + rnd() * 5; g.gain.linearRampToValueAtTime(lvl * (.3 + rnd() * .2), t + d); return d; }); }
      else if (k === "crowd") { for (const [f, q, v] of [[520, .7, .34], [1500, 1.4, .13]]) { const g = G(0); g.gain.setValueAtTime(lvl * v, t0); chain(loop(E.white), filt("bandpass", f, q), g, T.tex); wander(0, t => { const d = .25 + rnd() * .6; g.gain.linearRampToValueAtTime(lvl * v * (.45 + rnd() * .75), t + d); return d; }); } }
      else if (k === "fire") { chain(loop(E.brown), filt("lowpass", 320), G(lvl * .9), T.tex); wander(.3, t => { burst(T, t, .004 + rnd() * .008, lvl * (.5 + rnd() * 1.4), "highpass", 1800 + rnd() * 2500, 0, E.white, T.tex); return .06 + rnd() * rnd() * .7; }); }
    }
    // events: single sounds that come round.
    // The user heard the dripping water as "weird droplets, like birds" and asked for it gone (12 Oct 2026): the
    // pitched little sounds (drips, chirps, beeps) are no longer played in any style, and the orchestral style keeps
    // no sound effects at all beyond a bell, thunder, a heartbeat and a whisper: it is music, not a soundscape.
    const mute = spec.mix || !F.cine ? /^(drip|chirp|beep)$/ : /^(drip|chirp|beep|tick|clank|steam)$/;   // (sounds the referee put in their own music they get)
    for (const [k, p] of Object.entries(M.ev || {})) {
      if (mute.test(k) || (k === "toll" && F.toll === null)) continue;
      const o = { root, F }, once = t => SFX[k](T, t, o);     // the sound itself is in SFX; here, how often it comes
      if (k === "drip") wander(rnd() * p, t => { const f = 1300 + rnd() * 1200; ping(T, t, f, f * .55, .07, .2 + rnd() * .12); if (rnd() < .3) ping(T, t + .11 + rnd() * .1, f * 1.3, f * .7, .05, .1); return p * (.4 + rnd() * 1.2); });
      else if (k === "tick") wander(.5, t => { once(t); return 1; });
      else if (k === "heart") wander(1, t => { once(t); return 60 / p * (.97 + rnd() * .06); });
      else if (k === "toll") wander(4 + rnd() * p * .5, t => { once(t); return p * (.75 + rnd() * .5); });
      else if (k === "clank") wander(rnd() * p, t => { once(t); return p * (.4 + rnd() * 1.3); });
      else if (k === "steam") wander(2 + rnd() * p, t => { once(t); return p * (.6 + rnd() * .9); });
      else if (k === "lightning") wander(3 + rnd() * p * .4, t => { once(t); return p * (.6 + rnd() * .8); });
      else if (k === "thunder") wander(6 + rnd() * p * .6, t => { once(t); return p * (.5 + rnd()); });
      else if (k === "chirp") wander(1 + rnd() * p, t => { const n = 2 + Math.floor(rnd() * 3), f = 2400 + rnd() * 1400; for (let i = 0; i < n; i++) ping(T, t + i * .11, f, f * (1.25 + rnd() * .3), .06, .04, T.tex); return p * (.3 + rnd() * 1.6); });
      else if (k === "whisper") wander(3 + rnd() * p, t => { once(t); return p * (.5 + rnd()); });
      else if (k === "horn") wander(8 + rnd() * p * .6, t => { once(t); return p * (.7 + rnd() * .7); });
      else if (SFX[k] && k !== "beep") wander(3 + rnd() * p * .5, t => { once(t); return p * (.6 + rnd() * .8); });   // the horror sounds
      else if (k === "beep") wander(2 + rnd() * p, t => { const f = 1200 + Math.floor(rnd() * 4) * 300; ping(T, t, f, f, .09, .05, T.tex); if (rnd() < .5) ping(T, t + .16, f * 1.5, f * 1.5, .09, .04, T.tex); return p * (.5 + rnd()); });
    }

    // rhythm, where the mood has one: eight beats to the bar
    const kick = (t, v) => ping(T, t, 96, 42, .16, v), tek = (t, v) => burst(T, t, .035, v, "bandpass", 2600, 2), snare = (t, v) => burst(T, t, .09, v, "bandpass", 1900, .8);
    const dum = (t, v) => { ping(T, t, 132, 70, .2, v); burst(T, t, .04, v * .4, "lowpass", 320); };
    function pulse(t, ch, k) {
      const kind = M.pulse.kind, lo = ch[0] - 12;
      for (let j = 0; j < 16; j++) {
        const tt = t + j * beat / 2, on = j % 2 === 0, b = j / 2;
        if (kind === "drum") { if (j % 8 === 0) kick(tt, .5); else if (j % 8 === 4) kick(tt, .36); if (!on && rnd() < .3) ping(T, tt, 150, 90, .12, .2); voice(T, "stab", lo, tt, beat * .28, j % 4 === 0 ? .13 : .08); if (j % 8 === 6 && k % 2) snare(tt, .16); }
        else if (kind === "chase") { voice(T, F.ost, (j % 8 === 6 ? ch[1] : j % 4 === 3 ? ch[2] : ch[0]) - 12, tt, beat * .45, j % 4 === 0 ? .17 : .12); if (on) kick(tt, .26); else tek(tt, .06); }
        else if (kind === "frame") { const c = "D-kT-kT-"[j % 8]; if (c === "D") dum(tt, .36); else if (c === "T") tek(tt, .17); else if (c === "k") tek(tt, .06); }
        else if (kind === "dance") { if (on) { if (b % 4 === 0) dum(tt, .32); else if (b % 2 === 1) tek(tt, .15); else dum(tt, .16); if (b % 2 === 0) ch.forEach((n, i) => voice(T, F.ost, n, tt + i * .018, beat * .8, .06)); } }
        else if (kind === "march") { if (on) { if (b % 2 === 0) kick(tt, .3); else snare(tt, .13); } if (j >= 13 && k % 2) snare(tt, .07); }
        else if (kind === "machine") { if (on) { burst(T, tt, .09, .26, "lowpass", 190, 0, E.brown); ping(T, tt, 70, 48, .1, .2); } else tek(tt, .04); }
        else if (kind === "ritual") { if (on) dum(tt, b % 4 === 0 ? .42 : .3); if (j % 16 === 15) dum(tt, .2); }
      }
    }
    // the drums of the styles that have their own (see RHYTHMS): each stroke a falling tone, a burst of noise, or both
    const DR = {
      K: t => kick(t, .46), k: t => kick(t, .26), V: t => ping(T, t, 64, 36, .55, .55),
      S: t => snare(t, .15), s: t => snare(t, .055), Z: t => { for (let i = 0; i < 6; i++) snare(t + i * .045, .04 + i * .014); },
      H: t => burst(T, t, .035, .05, "highpass", 7600), h: t => burst(T, t, .02, .028, "highpass", 8200),
      C: t => { for (const d of [0, .012, .025]) burst(T, t + d, .012, .1, "bandpass", 1150, 1.3); burst(T, t + .035, .14, .07, "bandpass", 1150, 1.3); },
      D: t => dum(t, .36), d: t => dum(t, .2),
      T: t => burst(T, t, .03, .16, "bandpass", 3100, 3), t: t => burst(T, t, .022, .07, "bandpass", 2500, 2),
      J: t => { burst(T, t, .16, .045, "highpass", 6200); burst(T, t, .12, .035, "bandpass", 8800, 5); }, j: t => burst(T, t, .07, .022, "highpass", 6800),
      B: t => { ping(T, t, 230, 155, .1, .28); burst(T, t, .15, .08, "bandpass", 2600, .9); }, b: t => { ping(T, t, 230, 155, .07, .13); burst(T, t, .08, .04, "bandpass", 2600, .9); },
      N: t => { ping(T, t, 165, 120, .34, .38); burst(T, t, .05, .12, "lowpass", 800); }, n: t => ping(T, t, 180, 135, .22, .2),
      O: t => { ping(T, t, 84, 44, .9, .6); burst(T, t, .14, .24, "lowpass", 280, 0, E.brown); }, o: t => { ping(T, t, 150, 98, .3, .28); burst(T, t, .05, .09, "lowpass", 600); },
      W: t => burst(T, t, .018, .2, "bandpass", 1900, 9),
      M: t => { ping(T, t, 120, 74, .24, .4); burst(T, t, .05, .09, "lowpass", 1000); }, m: t => ping(T, t, 135, 88, .14, .2),
      P: t => { const f = hz(root - 12); ping(T, t, f * 1.03, f, 1.3, .5); burst(T, t, .07, .16, "lowpass", 320, 0, E.brown); },
      Q: t => { ping(T, t, 175, 88, .3, .36); burst(T, t, .06, .1, "lowpass", 1500); }
    };
    function groove(t, ch) {
      const div = R.div || 2, step = beat / div, n = (R.beats || 8) * div, bi = R.bass || F.bass || F.ost, ci = R.chord || F.ost, oi = R.ost || F.ost;
      let lo = ch[0] - 24; if (lo < 33) lo += 12;
      for (let j = 0; j < n; j++) {
        const tt = t + j * step + (j % 2 ? step * (R.swing || 0) : 0);
        for (const lane of R.lanes) {
          const c = lane[j % lane.length];
          if (c === ".") continue;
          if (DR[c]) DR[c](tt);
          else if (c === "a" || c === "f") voice(T, bi, c === "a" ? lo : lo - 5 >= 31 ? lo - 5 : lo + 7, tt, step * 1.8, .15);
          else if (c === "c") ch.forEach((m, i) => voice(T, ci, m, tt + i * .012, step * 1.5, .05));
          else voice(T, oi, c === "4" ? ch[0] : ch[+c - 1] - 12, tt, step * .9, j % div === 0 ? .13 : .1);
        }
      }
    }
    // The orchestral layers of the dark-mystery style, bar by bar. The slow piano or harp figure and the tune are the
    // mystery; the low strings and the voices are the weight; the shiver of high strings into a deep drum is the dread.
    const boom = (t, v) => { ping(T, t, 62, 30, 1.6, v, T.in); burst(T, t, .5, v * .5, "lowpass", 95, 0, E.brown, T.in, .01); };
    // one stroke of the whole orchestra: the drum, the strings struck and left to ring, a dark wash of noise
    const hit = (t, v, c) => { boom(t, v * .8); for (const m of [c[0] - 12, c[0] - 5, c[0], c[1]]) voice(T, "hitstr", m, t, 2, v * .2, T.in); burst(T, t, 1.3, v * .2, "lowpass", 2200, 0, E.white, T.in, .004); };
    function cine(t, ch, k, len, deg) {
      const ten = M.tension, u = len / 12, lo = ch[0] - 12, quiet = !M.pulse;
      voice(T, "lowstr", lo, t, len * 1.02, .085 + (M.drone || 0) * .06); voice(T, "lowstr", lo + 7, t, len * 1.02, .045 + (M.drone || 0) * .035); if (lo - 12 >= 30) voice(T, "lowstr", lo - 12, t, len * 1.02, .018);
      if (quiet && (ten >= .25 || M.padInst) && k % 2 === 0) {
        const v = .05 + ten * .06; voice(T, "choirM", ch[0] - 12, t + u, len * 1.7, v, null, true); voice(T, "choirM", ch[2] - 12, t + u, len * 1.7, v * .8, null, true);
        if (ten >= .45) { voice(T, "choirF", ch[1], t + 2 * u, len * 1.6, v * .7, null, true); voice(T, "choirF", ch[0] + 12 + (ten > .85 ? 1 : 0), t + 2 * u, len * 1.6, v * .55, null, true); }
      }
      if (quiet && ten < .9 && rnd() < .6 - ten * .35) {
        const inst = /^(palace|forest|temple|sea|calm)$/.test(spec.mood) ? "harp" : "grand", tones = [ch[0] - 12, ch[2] - 12, ch[0], ch[1], ch[2], ch[0] + 12];
        const pat = [[0, 1, 2, 3, 4, 3], [0, 2, 3, 4, 5, 4], [0, 1, 3, 2, 4, 3], [0, 2, 1, 3, 2, 4]][Math.floor(rnd() * 4)], n = ten > .6 ? 3 : 6;
        for (let i = 0; i < n; i++) voice(T, inst, tones[pat[i]], t + i * (len / n) * .92 + rnd() * .04, 2, (i === 0 ? .16 : .1) + rnd() * .04);
      }
      if (quiet && ten >= .4 && k % 4 === 3) { const c0 = ch[0] + 12; if (ten >= .6) { voice(T, "hstr", c0 + 1, t + len - 3.3, 3.1, .045 + ten * .03); voice(T, "hstr", c0 + 6, t + len - 3.3, 3.1, .035 + ten * .02); } hit(t + len, .34 + ten * .3, chord(T.prog[(k + 1) % T.prog.length])); }
      if (quiet && ten >= .7 && k % 2 === 1) { voice(T, "brass", lo, t + 3 * u, len * .7, .065, null, true); voice(T, "brass", lo + 6, t + 3 * u, len * .7, .04, null, true); }
      // the harp remembers the tune, far off (it was a celesta, whose high glassy notes were too like the droplets)
      if (quiet && k % 4 === 2 && rnd() < .6) { let tt = t + 6 * u; for (const nt of T.motif.slice(0, 3)) { voice(T, "harp", root + 12 + note(Math.min(9, nt.d + deg)), tt, 1, .055); tt += nt.u * u * .9; } }
    }
    let bar = 0, nextBar = t0 + .6;
    T.mods.push({ next: t0, step(until) {
      while (nextBar < until) {
        const t = nextBar, deg = T.prog[bar % T.prog.length], ch = chord(deg), len = T.barLen;
        // (orchestral style) four bars make a phrase that gathers and lets go; now and then a bar is all but silent
        if (T.mus && !M.pulse) T.mus.gain.linearRampToValueAtTime(Math.min(1.2, [.26, .58, 1.1, .42][bar % 4] * (.85 + rnd() * .3) * (rnd() < .14 ? .4 : 1)), t + len * .5);
        const sw = !!F.cine && !M.pulse;
        if (M.pad && (!M.pulse || bar % 2 === 0)) { const span = M.pulse ? len * 2 : len, v = M.pad * (M.pulse ? .075 : sw ? .15 : .1); for (const n of ch) voice(T, T.padInst, n, t, span * 1.04, v * (.85 + rnd() * .3), null, sw); if (M.tension > .8 && rnd() < .5) voice(T, T.padInst, ch[0] + 1, t, span, v * .45, null, sw); }
        const bassI = F.bass === undefined ? "bass" : F.bass;
        if (bassI && M.pad > .25 && !M.pulse && !F.cine) voice(T, bassI, ch[0] - 24 >= 30 ? ch[0] - 24 : ch[0] - 12, t, len * .8, M.pad * .2);
        if (F.drone && M.drone) for (const [s, lv] of [[-12, 1], [-5, .6]]) voice(T, F.drone, root + s, t, len * 1.04, M.drone * .12 * lv);
        if (T.lead && rnd() < (M.rate || .5)) {
          const v = Math.floor(rnd() * 4); let notes = T.motif.slice(); if (v === 2) notes.reverse(); if (v === 3) notes = notes.slice(0, Math.ceil(notes.length / 2));
          // in the orchestral style the piano states the tune and, two bars on, the cello answers it
          const lead = F.cine && T.lead === "grand" && bar % 4 === 2 ? "cello" : T.lead;
          let tt = t + T.unit * Math.floor(rnd() * 3); const shift = deg + (v === 1 ? 2 : 0), held = !INST[lead].d, down = lead === "cello" && T.lead !== "cello" ? 12 : 0;
          for (const nt of notes) {
            if (tt > t + len * 1.15) break;
            let dd = nt.d + shift; while (dd > 10) dd -= N;
            const m = root + 12 * (1 + (M.reg || 0)) + note(dd) - down, dur = nt.u * T.unit * (held ? 1.02 : .92), vel = (held ? .13 : .19) * (.85 + rnd() * .3);
            // the style's ornaments on the longer notes: a quick note from above (the middle ages, the Arab world), or
            // the note bent up into (Japan: the koto pressed, the shakuhachi's breath)
            const orn = F.orn && nt.u > 1 && rnd() < .3 ? F.orn : "";
            if (orn === "grace") voice(T, lead, m + note(dd + 1) - note(dd), tt - .09, .08, vel * .6);
            voice(T, lead, m, tt, dur, vel, null, false, orn === "bend" ? [-1 - Math.floor(rnd() * 2), .18] : null);
            tt += nt.u * T.unit;
          }
        }
        if (F.cine && !(spec.mix && !M.pad && !M.drone && !T.lead)) cine(t, ch, bar, len, deg);   // (a piece of one's own with no music in it is its sounds alone)
        if (M.pulse) { if (R) groove(t, ch); else pulse(t, ch, bar); }
        bar++; nextBar += len;
      }
    } });
  }
  Theme.prototype.advance = function (until) { if (!this.dead) for (const m of this.mods) m.step(until); };
  Theme.prototype.end = function (t, fade) {
    this.dead = true; const g = this.out.gain;
    if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else if (g.cancelScheduledValues) g.cancelScheduledValues(t);
    g.setTargetAtTime(0, t, fade / 4);
    for (const s of this.stops) { try { s.stop(t + fade * 1.6); } catch (e) {} }
    const T = this; if (typeof setTimeout === "function" && T.ac.state !== undefined && !(T.ac.startRendering && T.ac.length)) setTimeout(() => { try { T.out.disconnect(); T.links.forEach(l => l.disconnect()); } catch (e) {} }, (fade * 1.8 + 16) * 1000);
  };

  /* ---- the engine: one master, one room, one theme at a time (and the last one, fading) */
  function Engine(ac) {
    const E = this; E.ac = ac; E.cur = null;
    const sr = ac.sampleRate, mk = (sec, fn) => { const b = ac.createBuffer(1, Math.floor(sr * sec), sr), d = b.getChannelData(0); fn(d); return b; }, r = mulberry32(99);
    E.white = mk(3, d => { for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; });
    E.brown = mk(4, d => { let last = 0; for (let i = 0; i < d.length; i++) { last = (last + .02 * (r() * 2 - 1)) / 1.02; d[i] = last * 3.5; } });
    E.master = ac.createGain(); E.master.gain.value = .6;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = .01; comp.release.value = .3;
    E.master.connect(comp); comp.connect(ac.destination);
    const ir = ac.createBuffer(2, Math.floor(sr * 3.2), sr); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / d.length, 2.4) * (i < sr * .012 ? i / (sr * .012) : 1); }
    const conv = ac.createConvolver(); conv.buffer = ir; E.revIn = ac.createGain(); E.revIn.gain.value = 1; const rl = ac.createBiquadFilter(); rl.type = "lowpass"; rl.frequency.value = 4800; const rg = ac.createGain(); rg.gain.value = .5;
    E.revIn.connect(conv); conv.connect(rl); rl.connect(rg); rg.connect(E.master);
  }
  Engine.prototype.setTheme = function (spec, t) {
    // (any change to music of one's own is a new theme, crossfaded; its measured level is not: that is set on the theme as it plays)
    const key = spec ? (spec.mix ? "mix|" + JSON.stringify(Object.assign({}, spec.mix, { auto: undefined })) : spec.mood) + "|" + spec.flavour + "|" + spec.seed : "";
    if (this.cur && this.cur.key === key) return;
    if (this.cur) this.cur.end(t, 2.5);
    this.cur = spec ? new Theme(this, spec, t) : null; if (this.cur) this.cur.key = key;
  };
  Engine.prototype.advance = function (until) { if (this.cur) this.cur.advance(until); };

  /* ---- what the chooser shows: what each instrument and rhythm is called, and the songs in groups */
  const NAMES = {
    flute: "flute", reed: "reed pipe", horn: "horn", pluck: "plucked strings", oud: "oud", koto: "koto", piano: "piano", epiano: "electric piano", musicbox: "music box", glass: "glass", blip: "blips", bell: "bells", organ: "organ", strings: "strings", synth: "synth", choir: "choir", stab: "string stabs", bass: "bass", hitstr: "string hits",
    grand: "grand piano", harp: "harp", cello: "cello", lowstr: "low strings", hstr: "high strings", brass: "brass", choirM: "men's voices", choirF: "women's voices",
    lute: "lute", recorder: "recorder", vielle: "vielle", shawm: "shawm", gurdy: "hurdy-gurdy", portative: "portative organ", dulcimer: "hammered dulcimer", cymbala: "little bells", busine: "busine", chant: "plainchant", frhorn: "horn",
    upright: "upright piano", clarinet: "clarinet", violin: "solo violin", quartet: "string quartet", harmonium: "harmonium", barrel: "barrel organ", cornet: "cornet", tuba: "tuba", cbass: "double bass", pizz: "plucked bass", accordion: "accordion",
    felt: "felt piano", rhodes: "Rhodes", eguitar: "electric guitar", warmpad: "analogue pad", vibes: "vibraphone", sub: "sub bass", synbass: "synth bass",
    cs80: "CS-80 synth", synlead: "synth lead", theremin: "theremin", fmbell: "FM bells", fmkeys: "FM piano", arp: "arpeggio",
    ney: "ney", qanun: "qanun", rebab: "rebab", kaman: "string orchestra", shakuhachi: "shakuhachi", shamisen: "shamisen", sho: "shō", shinobue: "shinobue", bowl: "singing bowl", bonsho: "temple bell",
    nylon: "Spanish guitar", mandolin: "mandolin", bouzouki: "bouzouki", fflute: "flute", whistle: "tin whistle", fiddle: "fiddle", lush: "lush strings", celesta: "celesta"
  };
  const BEATS = { estampie: "estampie on the tabor", tabor: "pipe and tabor", nakers: "nakers", bendir: "frame drum", maqsum: "darbuka", baladi: "darbuka and riq", saidi: "tabl", zaffa: "wedding drums", taiko: "taiko", taikoslow: "taiko", matsuri: "festival drums", tarantella: "tarantella", tamburello: "tambourine", banda: "town band", waltz: "waltz", barrel: "oom-pah", band: "brass band", galop: "galop", military: "military drums", tango: "tango", polka: "polka", funeral: "funeral drum", lofi: "drum machine", hybrid: "big drums", electro: "electro beat", seq: "sequencer", gated: "electronic drums", jig: "jig on the bodhrán", bodhran: "bodhrán", war: "war drums", warslow: "war drums" };
  const PULSES = { drum: "drums", chase: "driving rhythm", frame: "hand drum", dance: "dance", march: "march", machine: "machinery", ritual: "ritual drum" };
  const GROUPS = [
    ["Quiet and safe", ["calm", "manor", "library", "palace", "forest", "sea"]], ["People about", ["street", "market", "tavern", "station", "docks", "base"]],
    ["Night and weather", ["night", "moor", "desert", "storm"]], ["Holy and strange", ["church", "temple", "ritual", "laboratory", "hospital", "ship"]],
    ["Shut in, under ground", ["prison", "warehouse", "factory", "cellar", "crypt", "sewer", "cave"]], ["Feelings", ["mystery", "sorrow", "dread", "ruins"]],
    ["Action", ["chase", "battle"]], ["Nothing", ["silence"]]
  ];
  const groups = () => { const seen = new Set(GROUPS.flatMap(g => g[1])), rest = Object.keys(MOODS).filter(m => !seen.has(m)); return GROUPS.map(([g, ms]) => [g, ms.filter(m => MOODS[m])]).concat(rest.length ? [["More", rest]] : []); };
  // what a mood is played on in a style, in a few words ("solo violin, string quartet, double bass drone")
  function describe(mood, fl) {
    const F = FLAVOURS[fl] || FLAVOURS.industrial, M = Object.assign({}, MOODS[mood] || MOODS.mystery, F.moods && F.moods[mood]);
    if (M.off) return "nothing at all";
    const pick = n => (F.swap && F.swap[n]) || n, role = r => pick(INST[r] && !(r === "bell" && !F.cine && F.bell) ? r : F[r] || null), parts = [], lead = M.lead ? role(M.lead) : null;
    if (lead) parts.push(NAMES[lead] || lead);
    if (F.cine) { parts.push("low strings"); if (!M.pulse && (M.tension >= .25 || M.padInst)) parts.push("voices"); if (!M.pulse && M.tension >= .6) parts.push("a deep drum"); }
    else { const pad = M.pad ? pick(M.padInst || F.pad) : null; if (pad && pad !== lead) parts.push(NAMES[pad] || pad); if (F.drone && M.drone) parts.push((NAMES[F.drone] || F.drone) + " drone"); }
    if (M.pulse) { const k = F.kit && F.kit[M.pulse.kind]; parts.push(k && RHYTHMS[k] ? BEATS[k] : PULSES[M.pulse.kind]); }
    return [...new Set(parts.filter(Boolean))].join(", ");
  }

  /* ---- the page's side. A bar (Music, Songs, volume, what is playing), a chooser that opens from Songs, and on each
          place a card with its suggested song and the songs for its moments. Nothing sounds until a button is pressed.
          The user asked for this (14 Oct 2026): "suggest what song to play for each location, like at the top right of
          the location" and "make the general music player easier to choose songs with". By default the music follows
          the places, each playing its suggested song (or the referee's own, below); a song chosen by hand is held,
          whatever place is opened, until the referee goes back to following. */
  const off = () => A.config.music === false;
  const esc = s => (A.esc ? A.esc(s) : String(s));
  const mem = { get(k) { try { return localStorage.getItem((A.config.storageKey || "atlas") + "-mus-" + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem((A.config.storageKey || "atlas") + "-mus-" + k, v); } catch (e) {} } };
  const P = { ac: null, eng: null, timer: 0, on: false, place: null, hold: null, style: "", vol: .6, root: null, open: false, tab: "", bound: false, db: null, audio: null, asrc: "", aerr: "" };

  /* ---- the referee's own song for a place. The user asked for it (14 Oct 2026): "add the option to put your own
          custom song for each location". Three kinds:
          - one of Atlas's songs, in any style;
          - a link: YouTube, Spotify and the like open in a new tab (they cannot play inside the page); a link straight
            to a music file plays inside the page if its website allows;
          - a music file from this computer, played inside the page. It is kept in this browser only: a published page
            cannot store audio, and a referee's own recordings are theirs, not something for everyone the page is
            shared with.
          The first two are saved with the page, in its database ("songs", one document a place), so they are there on
          every computer; where there is no database (the local preview), in this browser. A campaign may also give a
          place a link in its data: music: { mood: "crypt", link: "https://...", title: "..." }. */
  const AUDIO_FILE = /\.(mp3|ogg|oga|opus|m4a|aac|wav|flac|webm)([?#]|$)/i;
  const OWN = {}, FILES = {};      // place id -> the saved choice; place id -> { name, url } of a file in this browser
  const okUrl = u => { try { const x = new URL(String(u || "")); return x.protocol === "https:" || x.protocol === "http:" ? x.href : ""; } catch (e) { return ""; } };
  const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return "a website"; } };
  function ownOf(id) {
    if (!id) return null;
    if (FILES[id]) return { kind: "file", name: FILES[id].name, url: FILES[id].url, temp: FILES[id].temp };
    const o = OWN[id];
    if (o && o.kind === "mood" && MOODS[o.mood] && !MOODS[o.mood].off) return o;
    if (o && o.kind === "mix" && mixOf(o.mix)) return o;
    if (o && o.kind === "link" && okUrl(o.url)) return o;
    const d = (A.meta[id] || {}).music;
    if (d && typeof d === "object" && okUrl(d.link)) return { kind: "link", url: okUrl(d.link), title: d.title || "", fromData: true };
    return null;
  }
  const linkPlays = o => !!o && o.kind === "link" && AUDIO_FILE.test(o.url);
  const opensTab = o => !!o && o.kind === "link" && !linkPlays(o);
  const ownTitle = o => (o.kind === "mood" ? MOODS[o.mood].label : o.kind === "mix" ? (mixOf(o.mix) || {}).name || "Your music" : o.kind === "file" ? o.name.replace(/\.[a-z0-9]{2,5}$/i, "") : o.title || hostOf(o.url));
  function ownNote(o, fl) {
    if (o.kind === "mood") { const f = FLAVOURS[o.flavour] ? o.flavour : fl; return shortStyle(f) + " · " + describe(o.mood, f); }
    if (o.kind === "mix") return "your music · " + describeMix(mixOf(o.mix) || {});
    if (o.kind === "file") return o.temp ? "your file · for this visit only" : "your file · kept in this browser";
    return linkPlays(o) ? "your link · plays here" : "your link · opens " + hostOf(o.url) + " in a new tab";
  }
  // what plays for a place's own song: one of Atlas's songs runs in the synthesiser, a file or a music-file link in a player
  function ownSpec(id, o) {
    if (o.kind === "mood") { const s = spec(id, o.mood); if (FLAVOURS[o.flavour]) s.flavour = o.flavour; s.own = o; return s; }
    if (o.kind === "mix") { const s = mixSpec(mixOf(o.mix), id); s.own = o; return s; }
    return { mood: "own", own: o, place: id, label: ownTitle(o), flavour: flavour(), seed: 0 };
  }
  // the referee's choices ("songs") and their own music ("mixes"): in the page's database, or else in this browser
  async function startStore() {
    try { const raw = mem.get("own"); if (raw) Object.assign(OWN, JSON.parse(raw)); } catch (e) {}
    try { const raw = mem.get("mixes"); if (raw) Object.assign(MIXES, JSON.parse(raw)); } catch (e) {}
    refresh();
    let db = null;
    try { db = window.claude && window.claude.use ? await window.claude.use("db") : null; } catch (e) { db = null; }
    if (!db) return;
    P.db = db; for (const k of Object.keys(OWN)) delete OWN[k]; for (const k of Object.keys(MIXES)) delete MIXES[k];
    const fill = (into, s) => { for (const k of Object.keys(into)) delete into[k]; for (const d of s.docs) into[d.id] = Object.assign({}, d.data(), { id: d.id }); refresh(); };
    db.collection("songs").onSnapshot(s => fill(OWN, s), () => {});
    db.collection("mixes").onSnapshot(s => fill(MIXES, s), () => {});
    refresh();
  }
  async function saveOwn(id, rec) {          // rec null: back to the suggested song
    if (P.db) { const ref = P.db.collection("songs").doc(id); if (rec) await ref.set(rec); else await ref.delete(); return; }
    if (rec) OWN[id] = rec; else delete OWN[id];
    mem.set("own", JSON.stringify(OWN));
  }
  // files are kept in this browser's own database (IndexedDB), under the campaign's name
  const IDB = {
    p: null,
    open() { return this.p || (this.p = new Promise(res => { try { const r = indexedDB.open("atlas-music", 1); r.onupgradeneeded = () => r.result.createObjectStore("files"); r.onsuccess = () => res(r.result); r.onerror = r.onblocked = () => res(null); } catch (e) { res(null); } })); },
    async run(mode, fn) { const d = await this.open(); if (!d) return null; return new Promise(res => { try { const tx = d.transaction("files", mode), r = fn(tx.objectStore("files")); tx.oncomplete = () => res(r && r.result !== undefined ? r.result : true); tx.onerror = tx.onabort = () => res(null); } catch (e) { res(null); } }); }
  };
  const fkey = id => (A.config.storageKey || "atlas") + "|" + id;
  async function loadFiles() {
    const keys = await IDB.run("readonly", st => st.getAllKeys()), pre = fkey("");
    for (const k of keys || []) {
      if (typeof k !== "string" || !k.startsWith(pre)) continue;
      const v = await IDB.run("readonly", st => st.get(k)), id = k.slice(pre.length);
      if (v && v.blob && A.meta[id]) FILES[id] = { name: v.name || "music", url: URL.createObjectURL(v.blob) };
    }
    refresh();
  }
  async function saveFile(id, file) {
    if (FILES[id]) URL.revokeObjectURL(FILES[id].url);
    const kept = await IDB.run("readwrite", st => st.put({ name: file.name, blob: file }, fkey(id)));
    FILES[id] = { name: file.name, url: URL.createObjectURL(file), temp: kept === null };
  }
  async function dropFile(id) {
    if (FILES[id]) { URL.revokeObjectURL(FILES[id].url); delete FILES[id]; }
    await IDB.run("readwrite", st => st.delete(fkey(id)));
  }
  // the player for a file or a music-file link. A recording is mastered far louder than Atlas's own music, so it plays
  // at half the music's volume (set by reasoning, not by ear: adjust AUDIO_LEVEL to the user's word)
  const AUDIO_LEVEL = .5;
  function fadeAudio(a, to, secs, done) {
    clearInterval(a._fade); const from = a.volume, t0 = Date.now();
    a._fade = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / (secs * 1000)); a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k >= 1) { clearInterval(a._fade); if (done) done(); } }, 50);
  }
  function audioTo(src) {
    if (typeof Audio === "undefined" || src === P.asrc) return;
    const old = P.audio; P.asrc = src; P.aerr = "";
    if (old) fadeAudio(old, 0, 1.2, () => { old.pause(); old.removeAttribute("src"); try { old.load(); } catch (e) {} });
    P.audio = null; if (!src) return;
    const a = new Audio(), fail = () => { if (P.audio === a) { P.aerr = "could not be played here"; paint(); } };
    a.loop = true; a.preload = "auto"; a.volume = 0; a.src = src; a.addEventListener("error", fail);
    P.audio = a;
    const p = a.play(); if (p && p.catch) p.catch(fail);
    fadeAudio(a, Math.min(1, P.vol * AUDIO_LEVEL * (P.duck || 1)), 1.5);
  }

  function current() {
    let th = P.hold ? Object.assign({}, P.hold) : null;
    if (!th && P.place) { const o = ownOf(P.place); th = o ? ownSpec(P.place, o) : themeFor(P.place); }
    if (th && !th.own && !th.mix && P.style && FLAVOURS[P.style]) th.flavour = P.style;      // the referee has chosen another style at the table
    return th;
  }
  const styleOf = id => (P.style && FLAVOURS[P.style] ? P.style : spec(id, "calm").flavour);
  const shortStyle = fl => FLAVOURS[fl].label.split(",")[0];
  const placeName = id => (id && A.meta[id] ? A.meta[id].name || id : "");
  // is this song the one playing? mood is a mood, "own" (the place's own song), or "mix:<id>" (music of the referee's own)
  const isOn = (place, mood) => {
    if (!P.on) return false; const c = current(); if (!c || (c.place || null) !== (place || null)) return false;
    return mood === "own" ? !!c.own : mood.startsWith("mix:") ? !c.own && c.mixId === mood.slice(4) : !c.own && !c.mix && c.mood === mood;
  };
  function tick() { if (!P.eng) return; const until = P.ac.currentTime + (typeof document !== "undefined" && document.hidden ? 70 : 2.8); P.eng.advance(until); if (P.bed) P.bed.advance(until); }
  function apply() {
    const th = current(), synth = th && (th.mix || (MOODS[th.mood] && !MOODS[th.mood].off)) ? th : null;
    if (P.on && P.eng) { P.eng.setTheme(synth, P.ac.currentTime + .05); tick(); }
    audioTo(P.on && th && th.own && (th.own.kind === "file" || linkPlays(th.own)) ? th.own.url : "");
    paint();
  }
  const linkA = (o, cls, inner) => `<a class="${cls}" href="${esc(o.url)}" target="_blank" rel="noopener noreferrer" data-mlink="1">${inner}</a>`;
  function nowLine(th) {
    if (!th) return "Silence";
    let s = esc(th.label) + (th.place ? " · " + esc(placeName(th.place)) : "");
    if (th.own && th.own.kind === "link" && (opensTab(th.own) || P.aerr)) s += " · " + linkA(th.own, "mus-follow", "open it ↗");
    else if (th.own && P.aerr) s += " · " + esc(P.aerr);
    if (P.hold) s += ` · held <button type="button" class="mus-follow" data-mfollow="1">follow the places</button>`;
    return s;
  }
  // every play button on the page shows whether its song is the one playing
  function paint() {
    if (typeof document === "undefined") return;
    const th = current();
    if (P.root) {
      const b = P.root.querySelector("#mus-play"), now = P.root.querySelector("#mus-now"), sb = P.root.querySelector("#mus-songs");
      if (b) { b.setAttribute("aria-pressed", String(P.on)); b.title = P.on ? "Stop the music" : "Play the music"; }
      if (now) now.innerHTML = nowLine(th);
      if (sb) sb.setAttribute("aria-expanded", String(P.open));
      if (P.open) renderPanel();
    }
    for (const el of document.querySelectorAll("[data-mplay]")) el.setAttribute("aria-pressed", String(isOn(el.dataset.mplace || null, el.dataset.mmood)));
    paintStudio();
    // a place's card says what its suggested song is played on, which changes with the style
    for (const c of document.querySelectorAll(".songcard[data-mcard]")) {
      const id = c.dataset.mcard, fl = styleOf(id), mood = themeFor(id).mood, s = c.querySelector(".sc-sugs");
      if (s && !MOODS[mood].off) s.textContent = shortStyle(fl) + " · " + describe(mood, fl);
      for (const b of c.querySelectorAll(".sc-m[data-mmood]")) if (MOODS[b.dataset.mmood]) b.title = MOODS[b.dataset.mmood].label + ": " + describe(b.dataset.mmood, fl);
    }
  }
  // the referee's choices changed (here or on another computer): redraw the cards, and play the new song if it is due
  function refresh() {
    if (typeof document === "undefined") return;
    for (const c of document.querySelectorAll(".songcard[data-mcard]")) { const t = document.createElement("div"); t.innerHTML = A.music.card(c.dataset.mcard); if (t.firstElementChild) c.replaceWith(t.firstElementChild); }
    studioRefresh();
    apply();
  }
  function play() {
    if (off()) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    if (!P.ac) { P.ac = new AC(); P.eng = new Engine(P.ac); P.eng.master.gain.value = P.vol; }
    P.ac.resume(); P.on = true; if (!P.timer) P.timer = setInterval(tick, 300);
    if (P.bed) { P.bed.end(P.ac.currentTime + .05, 2); P.bed = null; }      // the music takes over from the narrator's bed
    apply();
  }
  function pause() { P.on = false; if (P.timer && !P.bed) { clearInterval(P.timer); P.timer = 0; } if (P.eng) { P.eng.setTheme(null, P.ac.currentTime + .02); const ac = P.ac; setTimeout(() => { if (!P.on) ac.suspend(); }, 3200); } apply(); }
  // a song chosen: the one playing stops; a place's own song, at that place, goes back to following; any other is held
  function choose(place, mood) {
    if (mood === "own") {
      const o = ownOf(place); if (!o || opensTab(o)) return;
      if (isOn(place, "own")) { pause(); return; }
      P.hold = place === P.place ? null : ownSpec(place, o);
      if (P.on) apply(); else play();
      return;
    }
    if (mood.startsWith("mix:")) {
      const x = mixOf(mood.slice(4)); if (!x) return;
      if (isOn(place, mood)) { pause(); return; }
      P.hold = mixSpec(x, place);
      if (P.on) apply(); else play();
      return;
    }
    if (!MOODS[mood]) return;
    if (isOn(place, mood)) { pause(); return; }
    P.hold = place && place === P.place && !ownOf(place) && mood === themeFor(place).mood ? null : spec(place, mood);
    if (P.on) apply(); else play();
  }
  const songBtn = (place, mood, inner, cls, title) => `<button type="button" class="${cls}" data-mplay="1" data-mplace="${esc(place || "")}" data-mmood="${mood}" aria-pressed="${isOn(place, mood)}"${title ? ` title="${esc(title)}"` : ""}>${inner}</button>`;
  // a place's own song as a button (or, for a music site, a link that opens it in a new tab)
  const ownBtn = (id, o, cls, inner) => (opensTab(o) ? linkA(o, cls, inner) : songBtn(id, "own", inner, cls));
  function renderPanel() {
    const box = P.root && P.root.querySelector("#mus-panel"); if (!box) return;
    const fe = document.activeElement, keyOf = el => ["mstyle", "mtab", "mmood", "mplace", "mclose", "mtoggle", "mfollowbox", "mown"].map(k => (el.dataset || {})[k] || "").join("|");
    const focus = fe && box.contains(fe) ? keyOf(fe) : null, top = box.scrollTop;
    const th = current(), fl = styleOf(P.place), tab = P.tab === "all" ? "all" : "places";
    let body;
    if (tab === "places") body = `<ol class="mp-places">${A.order.map((id, i) => {
      const S = songsOf(id), sf = styleOf(id), o = ownOf(id);
      const own = o ? ownBtn(id, o, "song own", `<span class="sg-t">${esc(ownTitle(o))}</span><span class="sg-s">your song${opensTab(o) ? " · opens ↗" : ""}</span>`) : "";
      return `<li${id === P.place ? ' class="here"' : ""}><div class="mp-pn"><span class="n">${String(i + 1).padStart(2, "0")}</span>${esc(placeName(id))}${id === P.place ? '<span class="mp-here">open now</span>' : ""}</div><div class="mp-row">${own}${songBtn(id, S.main.mood, `<span class="sg-t">${esc(S.main.label)}</span><span class="sg-s">suggested</span>`, "song main", describe(S.main.mood, sf))}${S.also.map(a => songBtn(id, a.mood, `<span class="sg-t">${esc(a.when)}</span><span class="sg-s">${esc(a.label)}</span>`, "song keeper", describe(a.mood, sf))).join("")}<button type="button" class="mp-own keeper" data-mown="${esc(id)}">${o ? "change your song" : "+ your own song"}</button></div></li>`;
    }).join("")}</ol>`;
    else body = (mixList().length ? `<div class="mp-grp"><h4>Your music</h4><div class="mp-grid">${mixList().map(x => songBtn(P.place, "mix:" + x.id, `<span class="sg-t">${esc(x.name || "Your music")}</span><span class="sg-s">${esc(describeMix(x))}</span>`, "song own")).join("")}</div></div>` : "")
      + (P.place ? `<p class="mp-note">Each of Atlas's songs is played with the tune of ${esc(placeName(P.place))}, in the ${esc(shortStyle(fl).toLowerCase())} style.</p>` : "") + groups().map(([g, ms]) => `<div class="mp-grp"><h4>${esc(g)}</h4><div class="mp-grid">${ms.map(m => songBtn(P.place, m, `<span class="sg-t">${esc(MOODS[m].label)}</span><span class="sg-s">${esc(describe(m, fl))}</span>`, "song")).join("")}</div></div>`).join("");
    const sub = th ? [P.on ? "playing" : "ready", th.place ? placeName(th.place) : "", th.own ? ownNote(th.own, th.flavour) : shortStyle(th.flavour) + " · " + describe(th.mood, th.flavour)] : [];
    box.innerHTML = `
      <div class="mp-head"><span class="mp-k">Choose the music</span><button type="button" class="mp-x" data-mclose="1">Close</button></div>
      <div class="mp-now"><button type="button" class="mp-pp" data-mtoggle="1" aria-pressed="${P.on}"><span class="vh">${P.on ? "Stop the music" : "Play the music"}</span></button><div><div class="mp-t">${th ? esc(th.label) : "Silence"}</div><div class="mp-s">${sub.filter(Boolean).map(esc).join(" · ")}</div></div></div>
      <label class="mp-follow"><input type="checkbox" data-mfollowbox="1"${P.hold ? "" : " checked"}><span><strong>Follow the places.</strong> Each place plays its song (yours, if you gave it one, or the suggested one) as you open it. A song you choose is held, whatever place you open, until you tick this again.</span></label>
      <div class="mp-sty"><span class="mp-k">Style</span><div class="mp-chips">${Object.entries(FLAVOURS).map(([k, f]) => `<button type="button" class="chip" data-mstyle="${k}" aria-pressed="${k === fl}">${esc(f.label)}${k === flavour() ? " (this campaign's)" : ""}</button>`).join("")}</div></div>
      <div class="mp-tabs" role="tablist"><button type="button" role="tab" data-mtab="places" aria-selected="${tab === "places"}">The places' songs</button><button type="button" role="tab" data-mtab="all" aria-selected="${tab === "all"}">Every song</button></div>
      <div class="mp-body" role="tabpanel">${body}</div>`;
    box.scrollTop = top;
    if (focus) for (const el of box.querySelectorAll("button, input")) if (keyOf(el) === focus) { el.focus(); break; }
  }
  function openPanel(v) {
    P.open = v; const box = P.root && P.root.querySelector("#mus-panel"); if (!box) return;
    box.hidden = !v; if (v) renderPanel(); paint();
  }

  /* ---- the editor for a place's own song: a dialog with the three kinds as tabs */
  function openEditor(id) {
    if (!P.root || !A.meta[id]) return;
    let d = document.getElementById("songDlg");
    if (!d) {
      d = document.createElement("dialog"); d.id = "songDlg"; d.className = "kedlg"; d.setAttribute("aria-label", "Your own song");
      P.root.appendChild(d); d.addEventListener("submit", onEditorSubmit); d.addEventListener("click", onEditorClick);
    }
    const o = ownOf(id), tab = o ? ({ mood: "atlas", mix: "mix", file: "file" }[o.kind] || "link") : "atlas", fl = (o && o.kind === "mood" && FLAVOURS[o.flavour] && o.flavour) || styleOf(id), mixes = mixList();
    const removable = !!(FILES[id] || OWN[id]), sug = MOODS[themeFor(id).mood].label;
    d.dataset.place = id; d.dataset.tab = tab;
    const tabBtn = (k, l) => `<button type="button" role="tab" data-sdtab="${k}" aria-selected="${tab === k}">${l}</button>`;
    d.innerHTML = `<form method="dialog" class="ke sedit" id="songForm">
      <h3>Your own song</h3>
      <p class="sd-for">For ${esc(placeName(id))}. It plays here in place of the suggested song (${esc(sug)}), and the suggested song stays on the card beneath it.</p>
      <div class="mp-tabs" role="tablist">${tabBtn("atlas", "One of Atlas's songs")}${tabBtn("mix", "Your music")}${tabBtn("file", "A music file")}${tabBtn("link", "A link")}</div>
      <div class="sd-p" data-sdp="mix"${tab === "mix" ? "" : " hidden"}>
        ${mixes.length ? `<label><span>Music you made</span><select name="mix">${mixes.map(x => `<option value="${esc(x.id)}"${o && o.kind === "mix" && o.mix === x.id ? " selected" : ""}>${esc(x.name || "Your music")}</option>`).join("")}</select></label><p class="sd-note">Made in the Music tab. Saved with the page.</p>` : `<p class="sd-note">You have not made any music of your own yet. Open the Music tab at the top of the page to make some: a band, a beat, and sounds like wind, rain, lightning or a heartbeat.</p>`}
      </div>
      <div class="sd-p" data-sdp="atlas"${tab === "atlas" ? "" : " hidden"}>
        <label><span>Song</span><select name="mood">${groups().map(([g, ms]) => `<optgroup label="${esc(g)}">${ms.filter(m => !MOODS[m].off).map(m => `<option value="${m}"${o && o.kind === "mood" ? (o.mood === m ? " selected" : "") : m === themeFor(id).mood ? " selected" : ""}>${esc(MOODS[m].label)}</option>`).join("")}</optgroup>`).join("")}</select></label>
        <label><span>Style</span><select name="flavour">${Object.entries(FLAVOURS).map(([k, f]) => `<option value="${k}"${k === fl ? " selected" : ""}>${esc(f.label)}</option>`).join("")}</select></label>
        <p class="sd-note">Played with this place's own tune. Saved with the page, so it is there on every computer that opens it.</p>
      </div>
      <div class="sd-p" data-sdp="file"${tab === "file" ? "" : " hidden"}>
        <label><span>Music file (MP3, M4A, OGG, WAV, FLAC)</span><input type="file" name="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac,.webm"></label>
        ${o && o.kind === "file" ? `<p class="sd-note">Now playing here: ${esc(o.name)}. Choose another file to replace it.</p>` : ""}
        <p class="sd-note">It plays inside the page, round and round, at the music's volume. The file stays in this browser: it is not uploaded, so it is private to this computer, and another computer needs it added there.</p>
      </div>
      <div class="sd-p" data-sdp="link"${tab === "link" ? "" : " hidden"}>
        <label><span>Web address</span><input type="url" name="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=..." value="${o && o.kind === "link" ? esc(o.url) : ""}"></label>
        <label><span>Name (optional)</span><input name="title" maxlength="80" value="${o && o.kind === "link" ? esc(o.title || "") : ""}" placeholder="What to call it on the card"></label>
        <p class="sd-note">YouTube, Spotify and other music sites open in a new tab when you press play. A link straight to a music file (ending .mp3, .ogg or .m4a) plays inside the page, if its website allows it. Saved with the page.</p>
      </div>
      <p class="sd-err" role="alert"></p>
      <div class="ka">${removable ? `<button type="button" data-sdremove="1" class="sd-rm">Back to the suggested song</button>` : ""}<button type="submit" value="cancel" formnovalidate>Cancel</button><button type="submit" value="save" class="prim">Save</button></div>
    </form>`;
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
  }
  const closeEditor = () => { const d = document.getElementById("songDlg"); if (d) { if (d.close) d.close(); else d.removeAttribute("open"); } };
  const saveError = x => (x && (x.code === "invalid_argument" || x.code === "not_granted") ? "This page cannot save that for you here: you may only be able to view it." : x && x.code === "quota_exceeded" ? "The page's storage is full." : "That could not be saved. Try again in a moment.");
  async function onEditorSubmit(e) {
    e.preventDefault();
    const d = e.currentTarget, f = d.querySelector("form").elements, id = d.dataset.place, err = d.querySelector(".sd-err"), sub = e.submitter;
    if (!sub || sub.value !== "save") { closeEditor(); return; }
    err.textContent = "";
    try {
      if (d.dataset.tab === "atlas") { await dropFile(id); await saveOwn(id, { kind: "mood", mood: f.mood.value, flavour: f.flavour.value }); }
      else if (d.dataset.tab === "mix") { if (!f.mix || !f.mix.value) { err.textContent = "Make some music of your own in the Music tab first."; return; } await dropFile(id); await saveOwn(id, { kind: "mix", mix: f.mix.value }); }
      else if (d.dataset.tab === "file") {
        const file = f.file.files && f.file.files[0];
        if (!file) { if (FILES[id]) { closeEditor(); return; } err.textContent = "Choose a music file first."; return; }
        if (!/^audio\//.test(file.type) && !/^video\/(mp4|webm|ogg)$/.test(file.type) && !AUDIO_FILE.test(file.name)) { err.textContent = "That does not look like a music file."; return; }
        await saveFile(id, file);
      } else {
        const url = okUrl(f.url.value.trim());
        if (!url) { err.textContent = "Paste a web address that starts with https://"; return; }
        await dropFile(id); await saveOwn(id, { kind: "link", url, title: f.title.value.trim().slice(0, 80) });
      }
    } catch (x) { err.textContent = saveError(x); return; }
    closeEditor(); refresh();
  }
  async function onEditorClick(e) {
    const d = e.currentTarget, t = e.target.closest && e.target.closest("[data-sdtab],[data-sdremove]"); if (!t) return;
    if (t.dataset.sdtab) {
      d.dataset.tab = t.dataset.sdtab;
      for (const b of d.querySelectorAll("[data-sdtab]")) b.setAttribute("aria-selected", String(b === t));
      for (const p of d.querySelectorAll("[data-sdp]")) p.hidden = p.dataset.sdp !== t.dataset.sdtab;
      return;
    }
    const id = d.dataset.place;
    try { await dropFile(id); if (OWN[id]) await saveOwn(id, null); } catch (x) { d.querySelector(".sd-err").textContent = saveError(x); return; }
    closeEditor(); refresh();
  }

  /* ---- the Music tab: music of the referee's own. The user asked for it (14 Oct 2026): "create your own music loop,
          like have ambient sounds like lightning, heart beat and stuff like that and instrumental musics ... add a new
          music tab on the main menu". A piece is a mood of the referee's own making: a style and a band (a melody, an
          instrument for the chords, a drone, drums from any time and place), how tense it is, how big the room, and
          sounds, some all the way through (wind, rain, waves...), some now and then (lightning, a heartbeat, a bell...).
          It loops for as long as it plays, its tune grown from its own seed, changes are heard as they are made, and it
          can be given to any place. Pieces are saved with the page (the database's "mixes"), or in this browser where
          there is no database. The droplets and chirps the user disliked are not offered. */
  const TEXS = [["wind", "Wind"], ["rain", "Rain"], ["sea", "Waves on a shore"], ["water", "Running water"], ["fire", "A fire crackling"], ["crowd", "A crowd talking"], ["hum", "Machines humming"]];
  // [key, name, least, most, step, to begin with, what the number is, its section (h: the horror sounds)]
  const EVS = [["lightning", "Lightning and thunder", 10, 120, 5, 35, "s"], ["thunder", "Thunder far off", 10, 120, 5, 45, "s"], ["toll", "A bell tolling", 10, 120, 5, 40, "s"], ["horn", "A ship's horn", 20, 120, 5, 50, "s"], ["tick", "A clock ticking", 1, 1, 1, 1, "on"], ["clank", "Metal clanking", 2, 40, 1, 12, "s"], ["steam", "Steam hissing", 4, 40, 1, 10, "s"],
    ["scream", "Someone screaming", 15, 180, 5, 45, "s", "h"], ["knock", "Knocking at a door", 10, 120, 5, 40, "s", "h"], ["steps", "Footsteps", 10, 120, 5, 30, "s", "h"], ["creak", "A door creaking", 8, 90, 2, 25, "s", "h"], ["breath", "Heavy breathing", 6, 60, 1, 14, "s", "h"], ["heart", "A heartbeat", 40, 140, 2, 62, "bpm", "h"], ["whisper", "Whispers", 4, 60, 1, 12, "s", "h"],
    ["monster", "A monster growling", 10, 120, 5, 35, "s", "h"], ["wolf", "A wolf howling", 15, 180, 5, 50, "s", "h"], ["dog", "A dog barking", 8, 120, 2, 30, "s", "h"], ["cat", "A cat screaming", 15, 180, 5, 60, "s", "h"], ["chains", "Chains rattling", 8, 90, 2, 25, "s", "h"], ["gunshot", "Gunshots", 8, 120, 2, 30, "s", "h"]];
  // "hear it": one sound, now, without music, in the piece's style (for the bell and the horn)
  function hear(k) {
    if (off() || !SFX[k]) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    if (!P.ac) { P.ac = new AC(); P.eng = new Engine(P.ac); P.eng.master.gain.value = P.vol; }
    P.ac.resume();
    const E = P.eng, ac = P.ac, g = ac.createGain(), send = ac.createGain(), fl = S.ed && FLAVOURS[S.ed.flavour] ? S.ed.flavour : flavour();
    g.gain.value = 1.3; send.gain.value = .3; g.connect(E.master); g.connect(send); send.connect(E.revIn);
    SFX[k]({ ac, E, in: g, tex: g, mus: null, rnd: Math.random }, ac.currentTime + .05, { root: FLAVOURS[fl].root, F: FLAVOURS[fl] });
    setTimeout(() => { try { g.disconnect(); send.disconnect(); } catch (e) {} }, 12000);
  }
  const ERA_INST = [
    ["Orchestra", ["grand", "piano", "harp", "celesta", "cello", "strings", "lush", "lowstr", "hstr", "hitstr", "stab", "brass", "frhorn", "fflute", "choirM", "choirF", "choir"]],
    ["The middle ages", ["lute", "recorder", "vielle", "shawm", "gurdy", "portative", "organ", "dulcimer", "cymbala", "busine", "chant", "horn"]],
    ["The 1800s and the wars", ["upright", "clarinet", "violin", "quartet", "harmonium", "barrel", "musicbox", "cornet", "tuba", "cbass", "pizz", "accordion"]],
    ["Today", ["felt", "epiano", "rhodes", "eguitar", "warmpad", "vibes", "sub", "synbass", "bass"]],
    ["Science fiction", ["cs80", "synlead", "synth", "theremin", "fmbell", "fmkeys", "arp", "glass", "blip"]],
    ["The Arab world", ["oud", "ney", "qanun", "rebab", "kaman", "reed"]],
    ["Japan", ["koto", "shakuhachi", "shamisen", "sho", "shinobue", "bowl", "bonsho"]],
    ["Folk and the Mediterranean", ["nylon", "mandolin", "bouzouki", "fiddle", "whistle", "flute", "pluck", "bell"]]
  ];
  const RNAMES = { estampie: "Estampie (a medieval dance)", tabor: "Pipe and tabor (medieval)", nakers: "Nakers (medieval battle)", bendir: "Frame drum, slow", maqsum: "Darbuka: maqsum", baladi: "Darbuka: baladi", saidi: "Tabl: saidi", zaffa: "Wedding drums (zaffa)", taiko: "Taiko", taikoslow: "Taiko, slow", matsuri: "Japanese festival", tarantella: "Tarantella", tamburello: "Tambourine", banda: "Town band", waltz: "Waltz", barrel: "Barrel organ oom-pah", band: "Brass band march", galop: "Galop", military: "Military drums", tango: "Tango", polka: "Polka", funeral: "Funeral drum", lofi: "Drum machine, laid back", hybrid: "Big film drums", electro: "Electro beat", seq: "Synth sequencer", gated: "Electronic drums", jig: "Jig on the bodhrán", bodhran: "Bodhrán", war: "War drums", warslow: "War drums, slow" };
  const KINDS = { drum: "Battle drums", march: "A march", dance: "A dance", chase: "A chase", frame: "A hand drum", ritual: "A ritual drum", machine: "Machinery" };
  const MIXES = {};
  const S = { el: null, ed: null, want: "", status: "", del: 0, live: 0 };
  const mixOf = id => (S.ed && S.ed.id === id ? S.ed : MIXES[id]);
  const mixList = () => { const all = Object.assign({}, MIXES); if (S.ed) all[S.ed.id] = S.ed; return Object.values(all).sort((a, b) => (a.made || 0) - (b.made || 0)); };
  const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
  const newId = () => "m" + Math.random().toString(36).slice(2, 10);
  const newSeed = () => (Math.random() * 4294967295) >>> 0;
  const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  // a piece as the engine plays it: a mood of its own
  function mixM(x) {
    const M = { label: x.name || "Your music", tension: num(x.tension, .3), rev: num(x.rev, .4), pad: num(x.pad, .4), drone: num(x.drone, .3), rate: num(x.rate, .5), reg: num(x.reg, 0), bar: num(x.bar, 10), loud: num(x.loud, 1) };
    if (num(x.auto, 0) > 0) M.auto = x.auto;
    if (INST[x.lead]) M.lead = x.lead;
    if (INST[x.padInst]) M.padInst = x.padInst;
    const tex = {}, ev = {};
    for (const [k] of TEXS) if (num((x.tex || {})[k], 0) > 0) tex[k] = x.tex[k];
    for (const [k] of EVS) if (num((x.ev || {})[k], 0) > 0) ev[k] = x.ev[k];
    if (Object.keys(tex).length) M.tex = tex;
    if (Object.keys(ev).length) M.ev = ev;
    if (RHYTHMS[x.rhythm]) { M.rhythm = x.rhythm; M.pulse = { kind: "drum", bpm: num(x.bpm, 100) }; }
    else if (KINDS[x.rhythm]) M.pulse = { kind: x.rhythm, bpm: num(x.bpm, 100) };
    return M;
  }
  const mixSpec = (x, place) => ({ mood: "mix", mix: mixM(x), mixId: x.id, flavour: FLAVOURS[x.flavour] ? x.flavour : flavour(), seed: x.seed || 1, label: x.name || "Your music", place: place || null });
  function describeMix(x) {
    const parts = [];
    if (INST[x.lead]) parts.push(NAMES[x.lead]);
    if (INST[x.padInst] && num(x.pad, 0) > 0) parts.push(NAMES[x.padInst]);
    if (RHYTHMS[x.rhythm]) parts.push(RNAMES[x.rhythm].toLowerCase()); else if (KINDS[x.rhythm]) parts.push(KINDS[x.rhythm].toLowerCase());
    for (const [k, n] of TEXS) if (num((x.tex || {})[k], 0) > 0) parts.push(n.toLowerCase());
    for (const [k, n] of EVS) if (num((x.ev || {})[k], 0) > 0) parts.push(n.toLowerCase());
    return [...new Set(parts)].slice(0, 6).join(", ") || "silence";
  }
  // a piece starts as one of Atlas's songs, which the referee then changes
  function fromMood(mood, fl) {
    const F = FLAVOURS[fl] || FLAVOURS.industrial, M = Object.assign({}, MOODS[mood] || MOODS.mystery, F.moods && F.moods[mood]);
    const pick = n => (F.swap && F.swap[n]) || n, role = r => pick(INST[r] && !(r === "bell" && !F.cine && F.bell) ? r : F[r] || null);
    const kind = M.pulse && M.pulse.kind, kit = kind && F.kit && F.kit[kind], ev = {};
    for (const [k, v] of Object.entries(M.ev || {})) if (EVS.some(e => e[0] === k)) ev[k] = v;
    return { flavour: FLAVOURS[fl] ? fl : flavour(), tension: num(M.tension, .3), lead: (M.lead && role(M.lead)) || "", rate: num(M.rate, .5), reg: num(M.reg, 0), padInst: pick(M.padInst || F.pad), pad: num(M.pad, 0), drone: num(M.drone, 0), rhythm: kind ? (kit && RHYTHMS[kit] ? kit : kind) : "", bpm: M.pulse ? M.pulse.bpm : 100, bar: num(M.bar, 10), rev: num(M.rev, .4), loud: 1, tex: Object.assign({}, M.tex), ev, evAt: Object.assign({}, ev) };
  }
  // saving: one write at a time, a moment after the last change
  let chain = Promise.resolve(); const later = {};
  function setStatus(s) { S.status = s; const el = S.el && S.el.querySelector(".mx-status"); if (el) el.textContent = s; }
  function storeMix(x) {
    clearTimeout(later[x.id]); setStatus("Saving…");
    later[x.id] = setTimeout(() => {
      const body = JSON.parse(JSON.stringify(x));
      chain = chain.then(async () => { try { if (P.db) await P.db.collection("mixes").doc(x.id).set(body); else { MIXES[x.id] = body; mem.set("mixes", JSON.stringify(MIXES)); } setStatus("Saved"); } catch (e) { setStatus(saveError(e)); } });
    }, 700);
  }
  async function dropMix(id) {
    clearTimeout(later[id]);
    try {
      await chain;
      if (P.db) await P.db.collection("mixes").doc(id).delete(); else { delete MIXES[id]; mem.set("mixes", JSON.stringify(MIXES)); }
      for (const [pl, o] of Object.entries(OWN)) if (o && o.kind === "mix" && o.mix === id) await saveOwn(pl, null);
    } catch (e) { setStatus(saveError(e)); return false; }
    return true;
  }
  // the page of the tab
  function eraGroups() { const seen = new Set(ERA_INST.flatMap(g => g[1])), rest = Object.keys(INST).filter(k => !seen.has(k)); return ERA_INST.map(([g, l]) => [g, l.filter(k => INST[k])]).concat(rest.length ? [["More", rest]] : []); }
  const instSelect = (field, val, none) => `<select data-mx="${field}">${none ? `<option value="">${esc(none)}</option>` : ""}${eraGroups().map(([g, l]) => `<optgroup label="${esc(g)}">${l.map(k => `<option value="${k}"${k === val ? " selected" : ""}>${esc(cap(NAMES[k] || k))}</option>`).join("")}</optgroup>`).join("")}</select>`;
  function drumSelect(x) {
    const F = FLAVOURS[x.flavour] || FLAVOURS.industrial;
    const own = Object.entries(KINDS).map(([k, l]) => { const kit = F.kit && F.kit[k]; return `<option value="${k}"${x.rhythm === k ? " selected" : ""}>${esc(l + (kit && BEATS[kit] ? " (" + BEATS[kit] + ")" : ""))}</option>`; }).join("");
    return `<select data-mx="rhythm"><option value=""${x.rhythm ? "" : " selected"}>No drums</option><optgroup label="This style's own">${own}</optgroup><optgroup label="From any time and place">${Object.keys(RHYTHMS).map(k => `<option value="${k}"${x.rhythm === k ? " selected" : ""}>${esc(RNAMES[k] || k)}</option>`).join("")}</optgroup></select>`;
  }
  const ctl = (label, inner, wide) => `<label class="mx-c${wide ? " wide" : ""}"><span class="mx-l">${label}</span>${inner}</label>`;
  const range = (field, val, min, max, step, left, right) => `<input type="range" data-mx="${field}" min="${min}" max="${max}" step="${step}" value="${val}"><span class="mx-ends"><span>${left}</span><span>${right}</span></span>`;
  const texWord = v => (v <= 0 ? "off" : v < .12 ? "faint" : v < .28 ? "soft" : v < .45 ? "clear" : "loud");
  function evWord(k, on, v) { const e = EVS.find(x => x[0] === k); return !on ? "off" : e[6] === "bpm" ? v + " beats a minute" : e[6] === "on" ? "on" : "about every " + v + " seconds"; }
  const evValue = (x, e) => num((x.evAt || {})[e[0]], num((x.ev || {})[e[0]], e[5]));
  function texTile([k, n]) { const v = num((S.ed.tex || {})[k], 0); return `<label class="mx-t${v > 0 ? " on" : ""}" data-tile="t-${k}"><span class="mx-tn">${esc(n)}</span><input type="range" data-mxtex="${k}" min="0" max=".6" step=".02" value="${v}"><span class="mx-tv" data-mxval="t-${k}">${texWord(v)}</span></label>`; }
  function evTile(e) { const [k, n, lo, hi, st, , unit] = e, on = num((S.ed.ev || {})[k], 0) > 0, v = evValue(S.ed, e); return `<div class="mx-t${on ? " on" : ""}" data-tile="e-${k}"><label class="mx-tn"><input type="checkbox" data-mxevon="${k}"${on ? " checked" : ""}> ${esc(n)}</label>${unit === "on" ? "" : `<input type="range" data-mxev="${k}" min="${lo}" max="${hi}" step="${st}" value="${v}" aria-label="${esc(n)}: how often">`}<span class="mx-tv" data-mxval="e-${k}">${evWord(k, on, v)}</span><button type="button" class="mx-hear" data-mxhear="${k}" aria-label="Hear ${esc(n.toLowerCase())} once">▶ hear it</button></div>`; }
  function renderStudio() {
    if (!S.el) return;
    S.el.innerHTML = `<div class="mx"><aside class="mx-side"><div class="mx-k">Your music</div><ol class="mx-list"></ol><button type="button" class="mx-b mx-new" data-mxnew="1">+ New piece</button></aside><div class="mx-main"></div></div>`;
    renderSide(); renderMain();
  }
  function renderSide() {
    const side = S.el && S.el.querySelector(".mx-list"); if (!side) return;
    const list = mixList();
    side.innerHTML = list.length ? list.map(x => `<li><button type="button" data-mxopen="${esc(x.id)}" aria-current="${!!S.ed && S.ed.id === x.id}"><span class="mx-ln">${esc(x.name || "Your music")}</span><span class="mx-ls">${esc(shortStyle(FLAVOURS[x.flavour] ? x.flavour : flavour()))}</span></button></li>`).join("") : `<li class="mx-empty">Nothing yet.</li>`;
  }
  function renderMain() {
    const main = S.el && S.el.querySelector(".mx-main"); if (!main) return;
    const x = S.ed;
    if (!x) { main.innerHTML = `<div class="mx-intro"><h3>Make music of your own</h3><p>Choose a band, a beat and the sounds of the place (wind, rain, lightning, a heartbeat, a bell far off), and Atlas plays it round and round for as long as you like. Change anything while it plays and you hear the change at once. Give it to any place and it plays there.</p><button type="button" class="prim mx-new" data-mxnew="1">+ Make a new piece</button></div>`; return; }
    main.innerHTML = `
      <div class="mx-head"><button type="button" class="mp-pp mx-play" data-mxplay="1" aria-pressed="${isOn(null, "mix:" + x.id)}"><span class="vh">Play or stop this music</span></button><input class="mx-name" data-mx="name" value="${esc(x.name || "")}" maxlength="60" aria-label="Name of this music"><span class="mx-status" aria-live="polite">${esc(S.status)}</span></div>
      <p class="mx-sum">${esc(describeMix(x))}</p>
      <div class="mx-bar"><label class="mx-from"><span class="mx-l">Start again from one of Atlas's songs</span><select data-mxfrom="1"><option value="">Choose a song…</option>${groups().map(([g, ms]) => `<optgroup label="${esc(g)}">${ms.filter(m => !MOODS[m].off).map(m => `<option value="${m}">${esc(MOODS[m].label)}</option>`).join("")}</optgroup>`).join("")}</select></label><button type="button" class="mx-b" data-mxtune="1">Another tune</button><button type="button" class="mx-b mx-del" data-mxdel="1">Delete</button></div>
      <fieldset class="mx-sec"><legend>The music</legend><div class="mx-grid">
        ${ctl("Style", `<select data-mx="flavour">${Object.entries(FLAVOURS).map(([k, f]) => `<option value="${k}"${k === x.flavour ? " selected" : ""}>${esc(f.label)}</option>`).join("")}</select>`)}
        ${ctl("Feel", range("tension", num(x.tension, .3), 0, 1, .05, "calm", "unbearable"))}
        ${ctl("Melody", instSelect("lead", x.lead, "No melody"))}
        ${ctl("How often the melody plays", range("rate", num(x.rate, .5), .1, 1, .05, "rarely", "all the time"))}
        ${ctl("Melody pitch", `<select data-mx="reg">${[[-1, "Low"], [0, "Middle"], [1, "High"]].map(([v, l]) => `<option value="${v}"${num(x.reg, 0) === v ? " selected" : ""}>${l}</option>`).join("")}</select>`)}
        ${ctl("Chords", instSelect("padInst", x.padInst, ""))}
        ${ctl("How loud the chords are", range("pad", num(x.pad, .4), 0, .8, .02, "none", "full"))}
        ${ctl("Drone, one low note held under it all", range("drone", num(x.drone, .3), 0, 1, .02, "none", "heavy"))}
        ${ctl("Drums", drumSelect(x))}
        ${ctl("Speed of the drums", range("bpm", num(x.bpm, 100), 50, 170, 2, "slow", "fast"))}
        ${ctl("How long each chord lasts (without drums)", range("bar", num(x.bar, 10), 5, 16, .5, "short", "long"))}
        ${ctl("The room", range("rev", num(x.rev, .4), 0, 1, .05, "small, close", "vast, echoing"))}
        ${ctl("Volume of this piece", range("loud", num(x.loud, 1), .3, 2, .05, "quieter", "louder"))}
      </div></fieldset>
      <fieldset class="mx-sec"><legend>Sounds all the way through</legend><div class="mx-tiles">${TEXS.map(texTile).join("")}</div></fieldset>
      <fieldset class="mx-sec"><legend>Sounds now and then</legend><div class="mx-tiles">${EVS.filter(e => !e[7]).map(evTile).join("")}</div></fieldset>
      <fieldset class="mx-sec"><legend>Horror sounds</legend><div class="mx-tiles">${EVS.filter(e => e[7] === "h").map(evTile).join("")}</div></fieldset>
      ${A.order.length ? `<fieldset class="mx-sec"><legend>Play it at a place</legend><div class="mx-use"></div></fieldset>` : ""}`;
    renderUse();
  }
  function renderUse() {
    const box = S.el && S.el.querySelector(".mx-use"), x = S.ed; if (!box || !x) return;
    const at = A.order.filter(id => { const o = OWN[id]; return o && o.kind === "mix" && o.mix === x.id && !FILES[id]; });
    box.innerHTML = `<p class="mx-note">Given to a place, it plays there in place of the suggested song. It is also in the music bar's Songs list, under Your music.</p>
      <div class="mx-userow"><select data-mxplace="1" aria-label="Place">${A.order.map(id => `<option value="${esc(id)}"${id === P.place ? " selected" : ""}>${esc(placeName(id))}</option>`).join("")}</select><button type="button" class="mx-b" data-mxassign="1">Make it this place's song</button></div>
      ${at.length ? `<div class="mx-at"><span class="mx-l">Plays at</span>${at.map(id => `<span class="chip">${esc(placeName(id))} <button type="button" class="mx-x" data-mxunassign="${esc(id)}" aria-label="Stop playing it at ${esc(placeName(id))}">×</button></span>`).join("")}</div>` : ""}`;
  }
  function paintValues() {
    const x = S.ed; if (!x || !S.el) return;
    for (const [k] of TEXS) { const v = num((x.tex || {})[k], 0), el = S.el.querySelector(`[data-mxval="t-${k}"]`), tile = S.el.querySelector(`[data-tile="t-${k}"]`); if (el) el.textContent = texWord(v); if (tile) tile.classList.toggle("on", v > 0); }
    for (const e of EVS) { const k = e[0], on = num((x.ev || {})[k], 0) > 0, el = S.el.querySelector(`[data-mxval="e-${k}"]`), tile = S.el.querySelector(`[data-tile="e-${k}"]`); if (el) el.textContent = evWord(k, on, evValue(x, e)); if (tile) tile.classList.toggle("on", on); }
    const sum = S.el.querySelector(".mx-sum"); if (sum) sum.textContent = describeMix(x);
  }
  function paintStudio() { const b = S.el && S.ed && S.el.querySelector("[data-mxplay]"); if (b) b.setAttribute("aria-pressed", String(isOn(null, "mix:" + S.ed.id))); }
  function studioRefresh() {
    if (!S.el || !S.el.firstChild) return;
    if (!S.ed && S.want && MIXES[S.want]) { openMix(S.want); return; }
    renderSide(); renderUse();
  }
  function openMix(id) {
    const x = mixOf(id); if (!x) return;
    S.ed = JSON.parse(JSON.stringify(x)); S.ed.id = id; S.want = id; mem.set("mix", id); S.status = ""; S.del = 0;
    if (!num(S.ed.auto, 0)) autoLevel(S.ed);
    renderSide(); renderMain();
  }
  function newMix() {
    const o = ownOf(P.place), base = o && o.kind === "mood" ? o.mood : P.place ? themeFor(P.place).mood : "mystery", mood = MOODS[base] && !MOODS[base].off ? base : "mystery";
    const x = Object.assign(fromMood(mood, styleOf(P.place)), { id: newId(), name: "My music " + (mixList().length + 1), seed: newSeed(), made: Date.now() });
    S.ed = x; S.want = x.id; mem.set("mix", x.id); S.del = 0; storeMix(x); autoLevel(x); renderSide(); renderMain();
    const n = S.el.querySelector(".mx-name"); if (n) { n.focus(); n.select(); }
  }
  // a change: saved a moment later, and heard at once if this piece is playing
  function changed(redo, from) {
    const x = S.ed; storeMix(x); renderSide();
    if (redo) { const k = from && from.dataset.mx; renderMain(); const f = k && S.el.querySelector(`[data-mx="${k}"]`); if (f) f.focus(); }
    clearTimeout(S.live);
    S.live = setTimeout(() => { const c = current(); if (P.on && c && c.mixId === x.id) { if (P.hold && P.hold.mixId === x.id) P.hold = mixSpec(x, P.hold.place); apply(); } }, 250);
    autoLevel(x);
  }
  // A piece's loudness depends on what is in it (rain, lightning and drums add up), so once the changes stop Atlas plays
  // it silently for twelve seconds, measures it, and sets its level to match Atlas's own songs (an RMS of 0.066, as in
  // LEVELS). The Volume slider is the referee's own adjustment on top. A playing piece takes the new level at once.
  function autoLevel(x) {
    clearTimeout(S.lvl);
    S.lvl = setTimeout(async () => {
      if (typeof window === "undefined" || !(window.OfflineAudioContext || window.webkitOfflineAudioContext)) return;
      try {
        const spec = Object.assign(mixSpec(x, null), { raw: true }); delete spec.mix.auto;
        const r = await A.music.measure(spec, 12); if (!(r.rms > 0)) return;
        const auto = Math.max(.3, Math.min(5, +(.066 / r.rms).toFixed(2)));
        if (Math.abs(num(x.auto, 0) - auto) < .02) return;
        x.auto = auto; if (S.ed === x) storeMix(x);
        const cur = P.eng && P.eng.cur;
        if (cur && !cur.dead && cur.spec.mixId === x.id) cur.out.gain.setTargetAtTime(auto * num(x.loud, 1), P.ac.currentTime, .6);
      } catch (e) {}
    }, 1500);
  }
  function onStudioInput(e) {
    const t = e.target, x = S.ed, d = t.dataset || {}; if (!x || d.mxfrom !== undefined || d.mxplace !== undefined) return;
    if (d.mx) { const k = d.mx; if (t.tagName === "SELECT" && e.type === "input") return; x[k] = k === "name" || t.tagName === "SELECT" && k !== "reg" ? t.value : +t.value; if (k === "name") x.name = t.value.slice(0, 60); paintValues(); return changed(k === "flavour", t); }
    if (d.mxtex) { x.tex = Object.assign({}, x.tex, { [d.mxtex]: +t.value }); }
    else if (d.mxev) { x.evAt = Object.assign({}, x.evAt, { [d.mxev]: +t.value }); if (num((x.ev || {})[d.mxev], 0) > 0) x.ev = Object.assign({}, x.ev, { [d.mxev]: +t.value }); }
    else if (d.mxevon) { if (e.type === "input") return; const ev = EVS.find(v => v[0] === d.mxevon); x.ev = Object.assign({}, x.ev); if (t.checked) x.ev[ev[0]] = ev[6] === "on" ? 1 : evValue(x, ev); else delete x.ev[ev[0]]; }
    else return;
    paintValues(); changed();
  }
  function onStudioChange(e) {
    const t = e.target, x = S.ed;
    if (x && t.dataset && t.dataset.mxfrom !== undefined) { if (!t.value) return; const keep = { id: x.id, name: x.name, seed: x.seed, made: x.made }; for (const k of Object.keys(x)) delete x[k]; Object.assign(x, fromMood(t.value, keep.flavour || flavour()), keep); return changed(true); }
    onStudioInput(e);
  }
  async function onStudioClick(e) {
    const t = e.target.closest && e.target.closest("[data-mxplay],[data-mxnew],[data-mxopen],[data-mxtune],[data-mxdel],[data-mxassign],[data-mxunassign],[data-mxhear]"); if (!t) return;
    const d = t.dataset, x = S.ed;
    if (d.mxhear) return hear(d.mxhear);
    if (d.mxnew) return newMix();
    if (d.mxopen) return openMix(d.mxopen);
    if (!x) return;
    if (d.mxplay) choose(null, "mix:" + x.id);
    else if (d.mxtune) { x.seed = newSeed(); changed(); }
    else if (d.mxdel) {
      if (Date.now() - S.del > 4000) { S.del = Date.now(); t.textContent = "Click again to delete"; setTimeout(() => { if (t.isConnected) t.textContent = "Delete"; }, 4000); return; }
      S.del = 0; if (P.hold && P.hold.mixId === x.id) P.hold = null;
      if (await dropMix(x.id)) { S.ed = null; S.want = ""; mem.set("mix", ""); renderSide(); renderMain(); refresh(); }
    }
    else if (d.mxassign) { const pl = S.el.querySelector("[data-mxplace]").value; try { await dropFile(pl); await saveOwn(pl, { kind: "mix", mix: x.id }); setStatus("Plays at " + placeName(pl)); } catch (er) { setStatus(saveError(er)); } refresh(); }
    else if (d.mxunassign) { try { await saveOwn(d.mxunassign, null); } catch (er) { setStatus(saveError(er)); } refresh(); }
  }

  function onClick(e) {
    const t = e.target.closest && e.target.closest("[data-mplay],[data-mfollow],[data-mstyle],[data-mtab],[data-mclose],[data-mtoggle],[data-mown],[data-mlink]");
    if (!t) { if (P.open && !(e.target.closest && e.target.closest("#mus-panel, #mus-songs, #songDlg"))) openPanel(false); return; }
    const d = t.dataset;
    if (d.mplay) choose(d.mplace || null, d.mmood);
    else if (d.mlink) { const c = current(); if (P.on && !(c && opensTab(c.own))) pause(); }      // a music site opens in its own tab: Atlas's music makes way
    else if (d.mown) openEditor(d.mown);
    else if (d.mfollow) { P.hold = null; apply(); }
    else if (d.mstyle) { P.style = d.mstyle === flavour() ? "" : d.mstyle; apply(); }
    else if (d.mtab) { P.tab = d.mtab; mem.set("tab", P.tab); renderPanel(); }
    else if (d.mclose) { openPanel(false); const sb = P.root.querySelector("#mus-songs"); if (sb) sb.focus(); }
    else if (d.mtoggle) (P.on ? pause() : play());
  }
  A.music = {
    MOODS, FLAVOURS, guess, flavour, themeFor, songsOf, describe, moment: momentMood,
    html() {
      if (off()) return "";
      return `<div class="music" role="group" aria-label="Music"><button type="button" id="mus-play" aria-pressed="false" title="Play the music"><span aria-hidden="true">♪</span> Music</button><button type="button" id="mus-songs" aria-expanded="false" aria-controls="mus-panel">Songs <span aria-hidden="true">▾</span></button><label><span class="vh">Volume</span><input type="range" id="mus-vol" min="0" max="100" step="1"></label><span id="mus-now" class="musnow" aria-live="polite"></span></div><div id="mus-panel" class="mus-panel" role="dialog" aria-label="Choose the music" hidden></div>`;
    },
    // the card at the top right of a place: the referee's own song if they gave it one, its suggested song, a way to
    // choose one's own, and (for the referee) a song for each moment there
    card(id) {
      if (off() || !A.meta[id]) return "";
      const S = songsOf(id), fl = styleOf(id), m = S.main, silent = MOODS[m.mood].off, o = ownOf(id);
      const sug = big => `<span class="sc-ic" aria-hidden="true"></span><span class="sc-tx"><span class="${big ? "sc-t" : "sc-w"}">${esc(m.label)}</span><span class="sc-s sc-sugs">${esc(silent ? "this place plays nothing" : shortStyle(fl) + " · " + describe(m.mood, fl))}</span></span>`;
      const edit = label => `<button type="button" class="sc-edit keeper" data-mown="${esc(id)}">${label}</button>`;
      const head = o
        ? `<div class="sc-k">Your song ${edit("change")}</div>${ownBtn(id, o, "sc-main", `<span class="sc-ic${opensTab(o) ? " sc-ext" : ""}" aria-hidden="true"></span><span class="sc-tx"><span class="sc-t">${esc(ownTitle(o))}</span><span class="sc-s">${esc(ownNote(o, fl))}</span></span>`)}<div class="sc-k sc-k2">Suggested</div>${songBtn(id, m.mood, sug(false), "sc-m sc-sug")}`
        : `<div class="sc-k">Suggested song</div>${songBtn(id, m.mood, sug(true), "sc-main")}<div class="sc-own keeper">${edit("+ Use your own song")}</div>`;
      const also = S.also.map(a => songBtn(id, a.mood, `<span class="sc-ic" aria-hidden="true"></span><span class="sc-tx"><span class="sc-w">${esc(a.when)}</span><span class="sc-s">${esc(a.label)}</span></span>`, "sc-m", a.label + ": " + describe(a.mood, fl))).join("");
      return `<aside class="songcard" data-mcard="${esc(id)}" aria-label="Music for this place">${head}${also ? `<div class="sc-also keeper"><div class="sc-k">For a moment here</div>${also}</div>` : ""}</aside>`;
    },
    // the Music tab, drawn into the page's section for it the first time it is opened
    studio(el) {
      if (off() || !el || S.el === el) return;
      S.el = el; el.addEventListener("input", onStudioInput); el.addEventListener("change", onStudioChange); el.addEventListener("click", onStudioClick);
      S.want = mem.get("mix") || ""; renderStudio(); if (S.want && mixOf(S.want)) openMix(S.want);
    },
    enabled: () => !off(),
    bind(root) {
      if (off()) return; P.root = root;
      P.tab = mem.get("tab") || "";
      const v = parseFloat(mem.get("vol")); if (v >= 0 && v <= 1) P.vol = v; else if (A.config.music && A.config.music.volume >= 0) P.vol = Math.min(1, A.config.music.volume);
      const vol = root.querySelector("#mus-vol"); if (vol) { vol.value = Math.round(P.vol * 100); vol.addEventListener("input", () => { P.vol = vol.value / 100; mem.set("vol", String(P.vol)); if (P.eng) P.eng.master.gain.setTargetAtTime(P.vol * (P.duck || 1), P.ac.currentTime, .05); if (P.audio) { clearInterval(P.audio._fade); P.audio.volume = Math.min(1, P.vol * AUDIO_LEVEL * (P.duck || 1)); } }); }
      const b = root.querySelector("#mus-play"); if (b) b.addEventListener("click", () => (P.on ? pause() : play()));
      const sb = root.querySelector("#mus-songs"); if (sb) sb.addEventListener("click", () => openPanel(!P.open));
      if (!P.bound) {
        P.bound = true;
        document.addEventListener("click", onClick);
        document.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.mfollowbox) { if (e.target.checked) P.hold = null; else { const c = current(); P.hold = c ? (c.own ? c : spec(c.place, c.mood)) : null; } apply(); } });
        document.addEventListener("keydown", e => { if (e.key === "Escape" && P.open && !(document.getElementById("songDlg") || {}).open) { openPanel(false); const s = P.root.querySelector("#mus-songs"); if (s) s.focus(); } });
        startStore(); loadFiles();
      }
      apply();
    },
    place(id) { P.place = id; apply(); },
    choose, own: ownOf,
    // the narrator is speaking: the music steps back to a third of its volume, and comes up again after
    duck(on) {
      P.duck = on ? .3 : 1;
      if (P.eng) P.eng.master.gain.setTargetAtTime(P.vol * P.duck, P.ac.currentTime, on ? .25 : .9);
      if (P.audio) fadeAudio(P.audio, Math.min(1, P.vol * AUDIO_LEVEL * P.duck), on ? .5 : 1.5);
    },
    // A bed of sound under the narrator when no music is playing (the user: "add ambient noise to the narrator so it's
    // not so dull"): the place's own air and weather (its mood's textures: wind, rain, water, fire...), a low drone and
    // faint held chords in the campaign's style, no tune and no sudden sounds, so nothing competes with the voice. It
    // fades in as he starts and out when he stops. level: 0 to 1 (the narrator's setting); 0 is no bed. A place that
    // plays silence stays silent. With the music playing, the music is the bed, and steps back for him (duck).
    bed(on, level) {
      if (!on || !(level > 0)) { if (P.bed && P.ac) { const b = P.bed; P.bed = null; b.end(P.ac.currentTime + .3, 3); setTimeout(() => { if (!P.on && !P.bed) { if (P.timer) { clearInterval(P.timer); P.timer = 0; } P.ac.suspend(); } }, 4500); } return; }
      if (off() || P.on || typeof window === "undefined") return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const th = P.place ? themeFor(P.place) : null, mood = th ? th.mood : "mystery";
      if (MOODS[mood].off) return;
      if (!P.ac) { P.ac = new AC(); P.eng = new Engine(P.ac); }
      P.eng.master.gain.value = P.vol; P.ac.resume();
      const M0 = MOODS[mood], tex = Object.assign({}, M0.tex || { wind: .08 });
      const mix = { label: "narration", tension: M0.tension || .3, rev: Math.max(.5, M0.rev || .4), pad: .14, drone: Math.max(.25, M0.drone || 0), rate: .5, reg: 0, bar: 12, loud: 2 * Math.min(1, level), tex };   // (measured: at the default .5, half the loudness of the music; at 1, as loud as the music)
      if (P.bed) P.bed.end(P.ac.currentTime + .05, 1);
      P.bed = new Theme(P.eng, { mood: "mix", mix, flavour: th ? th.flavour : flavour(), seed: hashStr("bed|" + (P.place || "")) }, P.ac.currentTime + .05);
      P.bed.advance(P.ac.currentTime + 3);
      if (!P.timer) P.timer = setInterval(tick, 300);
    },
    playing: () => P.on,
    state: () => ({ on: P.on, audio: P.ac ? P.ac.state : "none", time: P.ac ? P.ac.currentTime : 0, theme: P.eng && P.eng.cur ? P.eng.cur.key : "", file: P.asrc, fileError: P.aerr, bed: !!P.bed }),
    // for testing a theme without speakers: render() resolves to the sound itself, measure() to { rms, peak }
    render(spec, seconds) {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, sr = 22050, ac = new OAC(2, Math.floor(sr * seconds), sr), eng = new Engine(ac);
      eng.setTheme(spec, 0); eng.advance(seconds);
      return ac.startRendering();
    },
    measure(spec, seconds) {
      const sr = 22050;
      return A.music.render(spec, seconds).then(buf => { let peak = 0, sum = 0, n = 0, bad = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = Math.floor(sr * 3); i < d.length; i++) { const x = d[i]; if (x !== x) { bad++; continue; } const a = x < 0 ? -x : x; if (a > peak) peak = a; sum += x * x; n++; } } return { rms: Math.sqrt(sum / Math.max(1, n)), peak, bad }; });
    }
  };
})(ATLAS);
