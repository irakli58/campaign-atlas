/* A building's inside from a description (the user, 11 and 17 Nov 2026: docs/requests/2026-11-17-optional-systems-and-
   quick-interiors.md, "describe it in one sentence and have Atlas generate a complete, furnished, editable interior",
   above all when the players walk into a building nobody prepared). No AI: the description is read for its kind of
   building, its floors, a cellar, its size and state, and the rooms it names ("a study, a library, three bedrooms"); the
   inside is then made by the place maker that is already there (atlas-locations.js `interior`, each room with its
   furniture preset, furnished in the campaign's age when its map opens) and kept as a place of the game master's own,
   on its building when it has one (so the same inside is there when the players come back). Nothing else is added:
   no clue, no secret, no person, no plot (the user: "If I ask for an ordinary house, Atlas should generate an ordinary
   house"). Quick asks only for the sentence; Detailed lets the floors, size, cellar, rooms and furniture be set.
   Its switch: Make it up, part "Inside a building from a description" (atlas-modules.js `makeup.describe`). */
(function (A) {
  "use strict";
  if (typeof document === "undefined") return;
  const esc = A.esc || (s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]));
  const NUM = { a: 1, an: 1, one: 1, single: 1, two: 2, pair: 2, couple: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, several: 3, many: 4, few: 2 };
  const numOf = w => NUM[w] != null ? NUM[w] : /^\d+$/.test(w) ? Math.min(20, +w) : null;

  // the kind of building, the first that matches (more particular words first); only kinds the place maker has
  const KINDS = [
    [/\b(speakeasy|jazz club|night ?club|cabaret|dance hall)\b/, "club"], [/\b(tavern|inn|pub|alehouse|saloon|taproom)\b/, "tavern"],
    [/\b(hospital|clinic|infirmary|asylum|sanatorium|surgery|medical (?:centre|center|bay))\b/, "clinic"],
    [/\b(research (?:station|outpost|base|facility)|research lab\w*)\b.*\b(planet|moon|station|space|colony|orbit)\b|\b(planet|moon|colony)\b.*\bresearch\b/, "research"],
    [/\b(lab|labs|laboratory|laboratories)\b/, "laboratory"], [/\b(mining (?:facility|station|camp|outpost))\b/, "miningfac"],
    [/\b(police|precinct|constabulary|sheriff)\b/, "police"], [/\b(bank|vault of the|counting ?house)\b/, "bank"], [/\b(hotel|guest ?house|boarding ?house|hostel|lodge)\b/, "hotel"],
    [/\b(prison|jail|gaol|penitentiary|lock-?up)\b/, "prison"], [/\b(school|university|college|academy|schoolhouse)\b/, "school"],
    [/\b(warehouse|depot|storehouse|granary)\b/, "warehouse"], [/\b(factory|works|foundry|mill|plant)\b/, "factory"], [/\b(offices?|bureau|agency|firm)\b/, "office"],
    [/\b(temple|church|chapel|cathedral|monastery|abbey|priory)\b/, "temple"], [/\bshrine\b/, "shrine"], [/\b(castle|keep|fortress|citadel|stronghold)\b/, "castle"],
    [/\b(tower|lighthouse|spire)\b/, "tower"], [/\b(bunker|underground (?:base|facility|complex))\b/, "bunker"], [/\b(mine|mineshaft)\b/, "mine"],
    [/\b(spaceport|starport|landing (?:field|port))\b/, "spaceport"], [/\b(dome|colony)\b/, "colony"], [/\b(outpost|relay station)\b/, "outpost"], [/\b(military base|barracks|garrison|fort)\b/, "milbase"],
    [/\b(habitat|hab module)\b/, "habitat"], [/\b(derelict (?:ship|vessel|freighter))\b/, "derelictship"], [/\b(shuttle|small craft)\b/, "shuttle"], [/\b(freighter|cargo ship|starship|spaceship|vessel)\b/, "freighter"],
    [/\b(train station|railway station|station)\b/, "station"], [/\b(hideout|den|lair|safehouse|safe house)\b/, "hideout"], [/\b(farm|farmhouse|homestead|ranch)\b/, "farm"],
    [/\b(ruin|ruins|ruined)\b/, "ruin"], [/\b(dungeon|catacombs?|crypt)\b/, "dungeon"], [/\b(cave|cavern|grotto)\b/, "cave"],
    [/\b(mansion|manor|estate|villa|townhouse|town house|hall\b(?! of))\b/, "mansion"], [/\b(apartments?|flats?|tenement|block of flats)\b/, "apartment"],
    [/\b(shop|store|market|grocer\w*|bakery|butcher|apothecary|pharmacy|blacksmith|smithy|forge|workshop|tailor|bookshop|pawn ?shop|general store|convenience)\b/, "shop"],
    [/\b(house|home|cottage|cabin|hut|hovel|shack|bungalow|residence|dwelling)\b/, "house"]
  ];
  // the rooms a description may name: [words, the room's name, its floor, its furniture preset, where (g ground, u above,
  // c below; "" wherever there is room)]
  const ROOMS = [
    [/\b(living quarters|quarters|lodgings?)\b/, "Living quarters", "boards", "bedroom", "u"],
    [/\b(bed ?rooms?|bed ?chambers?)\b/, "Bedroom", "boards", "bedroom", "u"], [/\b(guest rooms?)\b/, "Guest room", "boards", "bedroom", "u"],
    [/\b(nursery|child'?s room|children'?s rooms?)\b/, "Nursery", "boards", "nursery", "u"],
    [/\b(bath ?rooms?|washrooms?|lavatory|lavatories|toilets?|restrooms?|water closets?)\b/, "Bathroom", "tile", "wash", ""],
    [/\b(kitchens?|galley)\b/, "Kitchen", "flag", "kitchen", "g"], [/\b(scullery)\b/, "Scullery", "flag", "scullery", "g"], [/\b(pantry|larder)\b/, "Pantry", "flag", "pantry", "g"],
    [/\b(dining (?:room|hall)|mess hall|refectory)\b/, "Dining room", "boards", "dining", "g"],
    [/\b(parlou?r|living room|sitting room|drawing room|lounge|front room|common room)\b/, "Parlour", "carpet-r", "parlour", "g"],
    [/\b(study|studies)\b/, "Study", "carpet-g", "office", ""], [/\b(library|libraries)\b/, "Library", "carpet-g", "library", ""],
    [/\b(employee office|back office|manager'?s office)\b/, "Office", "boards", "office", "g"], [/\b(offices?)\b/, "Office", "boards", "office", ""],
    [/\b(reception|waiting room|lobby|foyer|entrance hall)\b/, "Reception", "lino", "waiting", "g"],
    [/\b(examination rooms?|exam rooms?|consulting rooms?|surgery|operating (?:room|theatre|theater))\b/, "Examination room", "tile", "surgery", "g"],
    [/\b(wards?|infirmary)\b/, "Ward", "lino", "ward", ""], [/\b(labs?|laborator(?:y|ies))\b/, "Laboratory", "tile", "lab", ""],
    [/\b(containment (?:chambers?|cells?|units?)|holding cells?|cells?)\b/, "Containment", "metal", "cell", ""],
    [/\b(forge|smithy)\b/, "Forge", "earth", "workshop", "g"], [/\b(workshops?|workrooms?|engineering)\b/, "Workshop", "boards", "workshop", ""],
    [/\b(storage (?:area|rooms?)|store ?rooms?|stores|storage)\b/, "Storeroom", "boards", "store", ""],
    [/\b(shop floor|showroom|counter|sales floor|shop)\b/, "Shop", "boards", "shop", "g"], [/\b(bar|taproom|tap room)\b/, "Taproom", "boards", "taproom", "g"],
    [/\b(classrooms?|lecture (?:rooms?|halls?))\b/, "Classroom", "boards", "classroom", ""], [/\b(chapel|oratory)\b/, "Chapel", "flag", "chapel", ""],
    [/\b(stables?)\b/, "Stable", "straw", "stable", "g"], [/\b(court ?yard|yard)\b/, "Yard", "yard", "yard", "g"],
    [/\b(vault|strong ?room|safe room|armou?ry)\b/, "Strongroom", "stone", "strong", ""], [/\b(attic|loft|garret)\b/, "Attic", "boards", "attic", "u"],
    [/\b(emergency power|generator|boiler (?:room)?|power room|reactor room|engine room)\b/, "Generator room", "metal", "boiler", "c"],
    [/\b(dormitor(?:y|ies)|barracks|bunk ?rooms?)\b/, "Dormitory", "boards", "dorm", ""], [/\b(vestry|sacristy)\b/, "Vestry", "flag", "vestry", ""]
  ];
  const BELOW = /\b(cellar|basement|crypt|undercroft|sub-?level|lower deck|underground)\b/;

  /* ---- reading a description: what it is, how big, how many floors, which rooms (and what was not understood) */
  function read(text, o) {
    const t = " " + String(text || "").toLowerCase().replace(/[’']/g, "'") + " ", heard = [];
    // (what it is: from the first phrase if it says ("a convenience store with an employee office" is a shop), else from
    // anywhere in it)
    const head = " " + t.split(/,| with | where | which | that /)[0] + " ";
    let kind = null; for (const [re, k] of KINDS) if (re.test(head)) { kind = k; break; }
    if (!kind) for (const [re, k] of KINDS) if (re.test(t)) { kind = k; break; }
    const era = /\b(19[0-4]\d|twenties|thirties|victorian|edwardian|prohibition|arkham)\b/.test(t) ? "historical" : /\b(medieval|fantasy|castle|mage|wizard|blacksmith|smithy)\b/.test(t) ? "medieval" : /\b(sci-?fi|space|planet|colony|station|starship|futur\w*|cyber\w*|android)\b/.test(t) ? "future" : /\b(modern|today|convenience|supermarket|apartment|garage)\b/.test(t) ? "modern" : "";
    if (kind === "house" && era === "modern" && A.locations && A.locations.KINDS.some(k => k[0] === "home")) kind = "home";
    if (/\b(wealthy|rich|grand|lavish|stately|noble'?s?)\b/.test(t) && kind === "house") kind = "mansion";
    let floors = /\b(single[- ]stor(?:e)?y|one[- ]stor(?:e)?y|bungalow|ground floor only)\b/.test(t) ? 1 : null;
    const fm = /\b(one|two|three|four|five|six|\d+)[- ](?:stor(?:e)?y|stor(?:e)?ies|floors?|levels?|decks?)\b/.exec(t); if (fm) floors = numOf(fm[1]);
    if (!floors && /\b(upstairs|upper floor|first floor|second floor|above the|on top)\b/.test(t)) floors = 2;
    const cellar = BELOW.test(t);
    let size = /\b(tiny|cramped|little|small|modest|narrow)\b/.test(t) ? "small" : /\b(huge|enormous|vast|sprawling|massive)\b/.test(t) ? "huge" : /\b(large|big|grand|wealthy|spacious|great)\b/.test(t) ? "large" : null;
    const cond = /\b(ruined|burn(?:ed|t)[- ]out|collapsed|gutted)\b/.test(t) ? "ruined" : /\b(abandoned|derelict|disused|deserted|boarded)\b/.test(t) ? "abandoned" : /\b(old|run-?down|shabby|damaged|decrepit|weathered|dilapidated)\b/.test(t) ? "worn" : "";
    // (the rooms: each named one, with how many when a number stands before it; a room said to be upstairs goes up)
    const rooms = [], words = t.split(/\s+/);
    for (const [re, name, mat, fx, where] of ROOMS) {
      const g = new RegExp(re.source, "g"); let m;
      while ((m = g.exec(t))) {
        const before = t.slice(0, m.index).trim().split(/\s+/).slice(-2), n = numOf(before[before.length - 1]) || numOf(before[0]) || (/s\b/.test(m[0]) && !/(ss|quarters|stores|barracks|lodgings|toilets|works)\b/.test(m[0]) ? 2 : 1);
        const after = t.slice(m.index + m[0].length, m.index + m[0].length + 24), up = /^\s*(upstairs|above|on the (?:upper|first|second) floor)/.test(after), down = /^\s*(below|downstairs|in the (?:cellar|basement))/.test(after);
        rooms.push({ name, mat, fx, where: up ? "u" : down ? "c" : where, n: Math.min(8, n) });
      }
    }
    // (a word matched twice by two rooms, as "offices" and "employee office": the more particular kept)
    const seen = new Set(), list = rooms.filter(r => { const k = r.name; if (seen.has(k)) return false; seen.add(k); return true; });
    if (list.some(r => r.where === "u") && !floors) floors = 2;
    const total = list.reduce((s, r) => s + r.n, 0);
    if (!size) size = total > 12 ? "huge" : total > 7 ? "large" : total && total <= 3 ? "small" : null;
    const roomCount = (/\b(\w+) rooms?\b/.exec(t) || [])[1], rc = roomCount ? numOf(roomCount) : null;
    if (kind) heard.push(kindName(kind)); if (floors) heard.push(floors + (floors > 1 ? " floors" : " floor")); if (cellar) heard.push("a cellar"); if (size) heard.push(size); if (cond) heard.push(cond); if (era) heard.push({ historical: "the 1920s or thereabouts", medieval: "medieval", future: "the future", modern: "today" }[era]);
    for (const r of list) heard.push((r.n > 1 ? r.n + " × " : "") + r.name.toLowerCase());
    return { kind: kind || "other", known: !!kind, floors, cellar, size, cond, rooms: list, rc, era, heard, text: String(text || "").trim() };
  }
  const kindName = k => { const K = A.locations && A.locations.KINDS.find(x => x[0] === k); return K ? K[1].toLowerCase() : k; };

  /* ---- the rooms by floor, from what was asked and the kind's own (what was asked first; the kind's filling the rest
          so a floor is never bare); a room count asked for ("six rooms") made up to */
  function plan(R, over) {
    const K = (A.locations.KINDS.find(k => k[0] === R.kind) || A.locations.KINDS.find(k => k[0] === "other"))[2], o = over || {};
    const floors = Math.max(1, Math.min(6, +o.floors || R.floors || (R.rooms.length ? 1 : (K.ext && K.ext.floors) || 1))), cellar = o.cellar != null ? !!o.cellar : R.cellar || R.rooms.some(r => r.where === "c");
    const g = [], u = [], c = [], put = (r, where) => { const L = where === "u" && floors > 1 ? u : where === "c" && cellar ? c : g; L.push([r.name, r.mat, r.fx]); };
    // (the kind's own first room (a shop's floor, an inn's taproom) always, unless the description names it)
    const main = (K.g || [])[0]; if (main && R.known && !R.rooms.some(r => r.fx && r.fx === main[2])) g.push(main.slice());
    for (const r of R.rooms) for (let i = 0; i < r.n; i++) put(r, r.where || (g.length > (floors > 1 ? 3 : 6) && floors > 1 ? "u" : "g"));
    const fill = (L, from, want) => { for (const x of from || []) { if (L.length >= want) break; if (!L.some(y => y[0] === x[0])) L.push(x.slice()); } };
    const want = R.rc ? Math.ceil(R.rc / Math.max(1, floors)) : 3;
    fill(g, K.g, R.rooms.length ? Math.min(want, 2) : want); if (floors > 1) fill(u, K.u || K.g, R.rooms.length ? Math.min(want, 2) : want); if (cellar) fill(c, K.c || [["Cellar", "flag", "cellar"]], 1);
    if (!g.length) g.push(["Room", "boards", ""]);
    return { rooms: { g, u: u.length ? u : null, c: c.length ? c : null }, floors, cellar };
  }

  /* ---- making it: a place of the game master's own, kept like any other (its own page, its map to edit, the gazetteer) */
  function make(R, o) {
    const L = A.locations, K = (L.KINDS.find(k => k[0] === R.kind) || L.KINDS.find(k => k[0] === "other")), P = plan(R, o);
    const size = o.size || R.size || (K[2].ext && K[2].ext.size) || "medium";
    const ext = Object.assign({ size, floors: P.floors, roof: "pitched" }, K[2].ext || {}, { size, floors: P.floors }, R.cond ? { cond: R.cond } : {}, o.ext || {});
    if (o.building) { if (o.building.w) ext.w = Math.round(o.building.w * 10) / 10; if (o.building.d) ext.d = Math.round(o.building.d * 10) / 10; }
    const map = L.interior(R.kind, ext, { rooms: P.rooms, cellar: P.cellar, bare: o.furnish === false });
    const name = o.name || nameOf(R);
    const def = { name, type: R.kind, typeName: K[1], pd: "", kp: "", district: "", notes: "Made from a description: " + R.text, locked: false, ext, map, described: R.text };
    if (o.building) Object.assign(def, { at: [o.building.x, o.building.y], ang: +o.building.a || 0, city: o.city || undefined });
    const id = "c-" + String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) + "-" + Math.random().toString(36).slice(2, 6);
    return { id, def };
  }
  // a name from the description: its first phrase, without the article, the size or the age ("The blacksmith's workshop")
  function nameOf(R) {
    let s = R.text.split(/[,.;:]| with | in | on | that | where | which /i)[0].trim().replace(/^(a|an|the)\s+/i, "");
    s = s.replace(/\b(small|little|tiny|large|big|huge|old|wealthy|modest|abandoned|ruined|derelict|medieval|modern|1920s|futuristic|sci-?fi|two[- ]stor(e)?y|three[- ]stor(e)?y)\s+/gi, "").trim();
    if (!s) s = kindName(R.kind); s = s.slice(0, 48);
    return "The " + s.charAt(0).toLowerCase() + s.slice(1);
  }

  /* ---- the dialog: the sentence; Quick (the default) or Detailed; what Atlas understood; Make it */
  let dlg = null, ctxOf = null;
  function open(ctx) {
    if (!(A.locations && A.locations.interior && A.locations.save)) return;
    ctxOf = ctx || {};
    if (!dlg) { dlg = document.createElement("dialog"); dlg.className = "loc-dlg qp-dlg"; document.body.appendChild(dlg); dlg.addEventListener("click", onClick); dlg.addEventListener("input", onInput); dlg.addEventListener("change", onInput); }
    const b = ctxOf.building, fl = b ? Math.max(1, Math.round((b._H || 1.9) / .95)) : null;
    dlg.innerHTML = `<form method="dialog" class="qp-form" onsubmit="return false">
      <h3>${b ? "What is inside this building?" : "A building's inside, from a description"}</h3>
      <p class="t-small">Describe it in a sentence: what it is, its rooms, its floors. Atlas lays out the rooms and furnishes them for the campaign's age. Nothing else is added: no clue, no secret, no one in it.</p>
      <textarea name="d" rows="3" class="t-in" placeholder="e.g. A wealthy doctor's two-story house with a study, a library, bedrooms, a kitchen and a basement"></textarea>
      <div class="qp-heard kn"></div>
      <div class="t-row"><label><input type="radio" name="mode" value="quick" checked> Quick</label><label><input type="radio" name="mode" value="detail"> Detailed</label><label><input type="checkbox" name="furnish" checked> Furnish the rooms</label></div>
      <fieldset class="qp-detail" hidden><legend>Detailed</legend>
        <label>Floors <input type="number" name="floors" min="1" max="6" value="${fl || ""}" placeholder="as described"></label>
        <label>Size <select name="size"><option value="">As described</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="huge">Huge</option></select></label>
        <label><input type="checkbox" name="cellar"> A cellar or lower level</label>
        <label>Rooms it must have <input type="text" name="more" class="t-in" placeholder="e.g. a laboratory, two cells, a vault"></label>
        <label>Name <input type="text" name="name" class="t-in" placeholder="as described"></label>
      </fieldset>
      <div class="t-row"><button type="button" class="t-btn prim" data-qp="make">Make it</button><button type="button" class="t-btn" data-qp="x">Cancel</button></div></form>`;
    dlg.showModal(); dlg.querySelector("textarea").focus();
  }
  const val = n => { const e = dlg.querySelector(`[name="${n}"]`); return e ? (e.type === "checkbox" ? e.checked : e.type === "radio" ? (dlg.querySelector(`[name="${n}"]:checked`) || {}).value : e.value) : null; };
  function reading() {
    const det = val("mode") === "detail", txt = val("d") + (det && val("more") ? ", with " + val("more") : "");
    return read(txt);
  }
  function onInput(e) {
    if (e.target.name === "mode") dlg.querySelector(".qp-detail").hidden = val("mode") !== "detail";
    const R = reading(), h = dlg.querySelector(".qp-heard");
    h.innerHTML = R.text ? (R.heard.length ? "Understood: " + esc(R.heard.join(", ")) + (R.known ? "" : ". The kind of building was not clear: a plain building is made; say what it is (a shop, an inn, a laboratory…).") : "Say what kind of building it is and which rooms it has.") : "";
  }
  async function onClick(e) {
    const b = e.target.closest("[data-qp]"); if (!b) return;
    if (b.dataset.qp === "x") { dlg.close(); return; }
    const R = reading(); if (!R.text) { dlg.querySelector("textarea").focus(); return; }
    const det = val("mode") === "detail", o = { furnish: !!val("furnish"), building: ctxOf.building || null, city: ctxOf.city || null };
    if (det) { if (+val("floors")) o.floors = +val("floors"); if (val("size")) o.size = val("size"); if (val("cellar")) o.cellar = true; if (val("name").trim()) o.name = val("name").trim(); }
    else if (ctxOf.building) { const fl = Math.max(1, Math.round((ctxOf.building._H || 1.9) / .95)); if (!R.floors) o.floors = fl; }
    const { id, def } = make(R, o);
    dlg.close();
    await A.locations.save(id, def);
  }

  A.quickPlace = { read, plan, make, open, nameOf };
})(typeof ATLAS !== "undefined" ? ATLAS : window.ATLAS);
