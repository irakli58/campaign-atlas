/* Places of the game master's own in a city: made, put down, built inside, revisited. The user asked (21 Oct 2026) to
   add locations to a city after it was made: "+ Add location", a name, a kind, what it is, its outside; put where they
   choose in the city, with a preview that says where it may not stand; then "Build the interior" with the map editor
   (in 2D or 3D, floor by floor, furnished from the libraries, with clues and people), and back to the city.
   A place made here is a place of the campaign like any other (A.customPlace, atlas-table.js): its page, its maps, its
   clues, its people, its place in the index and the search, the players' screen when they know of it. Its building is
   set into the city after the city is built (atlas-city.js, setCustom), so making, moving or rebuilding it never
   changes the rest of the city. Kept in the page's database (collection "customplaces") and, in the Atlas app, in
   the campaign's files (edits/0-places.js); its interior is a map edit like any other. */
(function (A) {
  "use strict";
  if (!A.table || typeof document === "undefined") return;
  const T = A.table, esc = A.esc, L = A.locations = {};
  let S = null;
  const $ = s => document.querySelector(s);
  const copy = o => JSON.parse(JSON.stringify(o));
  const future = () => (T.era ? T.era() : "") === "future";

  /* ---- the kinds of place: what a starting plan gives each (rooms on the ground floor, on each floor above, below
          ground: [name, floor, furniture preset]) and the outside it starts with. Every room of a starting plan is
          the game master's to move, resize or take away. */
  const KINDS = [
    ["tavern", "Tavern or inn", { g: [["Taproom", "boards", "taproom"], ["Kitchen", "flag", "kitchen"], ["Store", "boards", "store"], ["Snug", "carpet-r", "parlour"]], u: [["Guest room", "boards", "bedroom"], ["Guest room", "boards", "bedroom"], ["Guest room", "boards", "bedroom"], ["Landlord's room", "carpet-r", "bedroom"]], c: [["Cellar", "flag", "cellar"], ["Store", "flag", "store"]], ext: { size: "medium", floors: 2, roof: "pitched", chimney: true, sign: true } }],
    ["shop", "Shop", { g: [["Shop", "boards", "shop"], ["Workshop", "boards", "workshop"], ["Store", "boards", "store"]], u: [["Parlour", "carpet-g", "parlour"], ["Bedroom", "boards", "bedroom"], ["Kitchen", "flag", "kitchen"]], c: [["Cellar", "flag", "cellar"]], ext: { size: "small", floors: 2, roof: "pitched", sign: true } }],
    ["house", "House", { g: [["Parlour", "carpet-r", "parlour"], ["Dining room", "boards", "dining"], ["Kitchen", "flag", "kitchen"], ["Scullery", "flag", "scullery"]], u: [["Bedroom", "carpet-b", "bedroom"], ["Bedroom", "boards", "bedroom"], ["Nursery", "boards", "nursery"], ["Washroom", "tile", "wash"]], c: [["Cellar", "flag", "cellar"]], ext: { size: "medium", floors: 2, roof: "pitched", chimney: true } }],
    ["mansion", "Mansion", { g: [["Drawing room", "carpet-r", "parlour"], ["Dining room", "boards", "dining"], ["Library", "carpet-g", "library"], ["Study", "carpet-b", "office"], ["Kitchen", "flag", "kitchen"], ["Pantry", "flag", "pantry"]], u: [["Master bedroom", "carpet-r", "bedroom"], ["Bedroom", "carpet-b", "bedroom"], ["Guest room", "boards", "bedroom"], ["Nursery", "boards", "nursery"], ["Bathroom", "tile", "wash"], ["Dressing room", "carpet-g", "bedroom"]], c: [["Wine cellar", "flag", "cellar"], ["Servants' hall", "flag", "dining"], ["Store", "flag", "store"]], ext: { size: "large", floors: 3, roof: "hip", chimney: true } }],
    ["apartment", "Apartments", { g: [["Living room", "carpet-g", "parlour"], ["Kitchen", "lino", "kitchen"], ["Bedroom", "boards", "bedroom"], ["Bathroom", "tile", "wash"]], u: [["Living room", "carpet-b", "parlour"], ["Kitchen", "lino", "kitchen"], ["Bedroom", "boards", "bedroom"], ["Bathroom", "tile", "wash"]], c: [["Storage", "concrete", "store"], ["Boiler room", "concrete", "boiler"]], ext: { size: "medium", floors: 4, roof: "flat" } }],
    ["clinic", "Hospital or clinic", { g: [["Waiting room", "lino", "waiting"], ["Surgery", "tile", "surgery"], ["Ward", "lino", "ward"], ["Office", "boards", "office"], ["Store", "lino", "store"]], u: [["Ward", "lino", "ward"], ["Ward", "lino", "ward"], ["Operating room", "tile", "surgery"], ["Laboratory", "tile", "lab"]], c: [["Mortuary", "tile", "surgery"], ["Store", "concrete", "store"]], ext: { size: "large", floors: 2, roof: "flat", sign: true } }],
    ["warehouse", "Warehouse", { g: [["Warehouse floor", "concrete", "store"], ["Office", "boards", "office"], ["Loading bay", "concrete", "store"]], u: [["Storage loft", "boards", "store"]], c: [["Cellar", "concrete", "store"]], ext: { size: "large", floors: 1, roof: "pitched" } }],
    ["factory", "Factory or works", { g: [["Works floor", "concrete", "workshop"], ["Boiler room", "brick", "boiler"], ["Office", "boards", "office"], ["Store", "concrete", "store"]], u: [["Offices", "boards", "office"], ["Store", "boards", "store"]], c: [["Boiler cellar", "brick", "boiler"]], ext: { size: "large", floors: 2, roof: "pitched", chimney: true } }],
    ["laboratory", "Laboratory", { g: [["Laboratory", "tile", "lab"], ["Office", "lino", "office"], ["Store", "lino", "store"], ["Washroom", "tile", "wash"]], u: [["Laboratory", "tile", "lab"], ["Library", "boards", "library"]], c: [["Cold store", "tile", "ice"], ["Hidden laboratory", "tile", "lab"]], ext: { size: "medium", floors: 2, roof: "flat" } }],
    ["office", "Offices", { g: [["Reception", "carpet-g", "waiting"], ["Office", "carpet-b", "office"], ["Office", "boards", "office"], ["Records", "boards", "library"]], u: [["Office", "carpet-b", "office"], ["Office", "boards", "office"], ["Boardroom", "carpet-r", "dining"]], c: [["Archive", "concrete", "store"]], ext: { size: "medium", floors: 3, roof: "flat", sign: true } }],
    ["police", "Police station", { g: [["Front desk", "lino", "waiting"], ["Office", "boards", "office"], ["Cells", "concrete", "cell"], ["Interview room", "lino", "office"], ["Evidence room", "concrete", "strong"]], u: [["Detectives' room", "boards", "office"], ["Chief's office", "carpet-b", "office"]], c: [["Holding cells", "concrete", "cell"]], ext: { size: "medium", floors: 2, roof: "pitched", sign: true } }],
    ["temple", "Temple or church", { g: [["Nave", "flag", "chapel"], ["Vestry", "boards", "vestry"], ["Chapel", "flag", "chapel"]], c: [["Crypt", "stone", "cellar"]], ext: { size: "large", floors: 1, roof: "spire" } }],
    ["shrine", "Shrine", { g: [["Shrine", "flag", "chapel"], ["Vestry", "boards", "vestry"]], ext: { size: "small", floors: 1, roof: "dome" } }],
    ["club", "Nightclub or bar", { g: [["Bar", "boards", "bar"], ["Dance floor", "boards", ""], ["Back room", "carpet-r", "parlour"], ["Store", "concrete", "store"]], c: [["Cellar", "concrete", "cellar"]], ext: { size: "medium", floors: 2, roof: "flat", sign: true } }],
    ["hideout", "Hideout", { g: [["Common room", "boards", "parlour"], ["Bunk room", "boards", "dorm"], ["Kitchen", "flag", "kitchen"], ["Strong room", "stone", "strong"]], c: [["Escape tunnel", "earth", ""]], ext: { size: "small", floors: 1, roof: "pitched", cond: "worn" } }],
    ["castle", "Castle or keep", { g: [["Great hall", "flag", "dining"], ["Kitchen", "flag", "kitchen"], ["Armoury", "flag", "store"], ["Chapel", "flag", "chapel"], ["Guardroom", "flag", "dorm"]], u: [["Lord's chamber", "carpet-r", "bedroom"], ["Solar", "carpet-g", "parlour"], ["Chamber", "boards", "bedroom"]], c: [["Dungeon", "stone", "cell"], ["Store", "stone", "store"]], ext: { size: "huge", floors: 3, roof: "tower" } }],
    ["tower", "Tower", { g: [["Entrance hall", "flag", "hall"], ["Store", "flag", "store"]], u: [["Study", "boards", "library"], ["Bedchamber", "carpet-b", "bedroom"], ["Observatory", "boards", "lab"]], ext: { size: "small", floors: 4, roof: "tower" } }],
    ["bunker", "Underground facility", { g: [["Entrance", "concrete", "waiting"], ["Guard post", "concrete", "office"], ["Store", "concrete", "store"]], c: [["Laboratory", "tile", "lab"], ["Barracks", "concrete", "dorm"], ["Generator room", "concrete", "boiler"], ["Command room", "concrete", "office"]], ext: { size: "small", floors: 1, roof: "flat" } }],
    ["mine", "Mine", { g: [["Pithead", "boards", "office"], ["Store", "earth", "store"]], c: [["Gallery", "earth", ""], ["Gallery", "earth", ""], ["Ore store", "earth", "store"]], ext: { size: "small", floors: 1, roof: "pitched" } }],
    ["school", "School", { g: [["Classroom", "boards", "classroom"], ["Classroom", "boards", "classroom"], ["Hall", "boards", "dining"], ["Office", "boards", "office"]], u: [["Classroom", "boards", "classroom"], ["Library", "boards", "library"]], ext: { size: "large", floors: 2, roof: "pitched", sign: true } }],
    ["bank", "Bank", { g: [["Banking hall", "marble", "waiting"], ["Manager's office", "carpet-r", "office"], ["Strong room", "stone", "strong"]], c: [["Vault", "stone", "strong"]], ext: { size: "medium", floors: 2, roof: "flat", sign: true } }],
    ["hotel", "Hotel", { g: [["Lobby", "carpet-r", "waiting"], ["Dining room", "boards", "dining"], ["Kitchen", "flag", "kitchen"], ["Office", "boards", "office"]], u: [["Room", "carpet-b", "bedroom"], ["Room", "carpet-g", "bedroom"], ["Room", "carpet-b", "bedroom"], ["Room", "carpet-r", "bedroom"]], ext: { size: "large", floors: 4, roof: "pitched", sign: true } }],
    ["prison", "Prison", { g: [["Gatehouse", "flag", "office"], ["Cells", "stone", "cell"], ["Cells", "stone", "cell"], ["Guardroom", "flag", "dorm"]], u: [["Cells", "stone", "cell"], ["Cells", "stone", "cell"], ["Governor's office", "boards", "office"]], ext: { size: "large", floors: 2, roof: "flat" } }],
    ["station", "Station or base module", { g: [["Airlock", "metal", ""], ["Control room", "metal", "office"], ["Mess", "metal", "dining"], ["Laboratory", "metal", "lab"]], u: [["Quarters", "metal", "dorm"], ["Quarters", "metal", "dorm"]], c: [["Engineering", "grating", "boiler"]], ext: { size: "medium", floors: 1, roof: "dome" } }],
    // a cave (atlas-cave.js): its inside is a generated cave, or solid rock to carve; outside, a mound of rock
    ["cave", "Cave or mine", { g: [], u: [], c: [], ext: { size: "medium", floors: 1, roof: "dome", cond: "ruined", wall: "#6b6258", roofc: "#5a5248" } }],
    ["other", "Something else", { g: [["Room", "boards", ""], ["Room", "boards", ""], ["Room", "boards", ""]], u: [["Room", "boards", ""], ["Room", "boards", ""]], c: [["Cellar", "flag", "cellar"]], ext: { size: "medium", floors: 1, roof: "pitched" } }]
  ];
  const KIND = Object.fromEntries(KINDS.map(k => [k[0], k]));
  L.KINDS = KINDS;
  const GRID = { small: [12, 10], medium: [16, 12], large: [22, 16], huge: [30, 22] };
  const ROOFS = [["pitched", "Pitched"], ["hip", "Hipped"], ["flat", "Flat"], ["dome", "Dome"], ["spire", "With a spire"], ["tower", "With a tower"]];
  const CONDS = [["", "Kept"], ["worn", "Weathered"], ["abandoned", "Abandoned, boarded"], ["ruined", "Ruined"]];

  // a cave's inside: generated to suit its size (the seed its own), or rock all through, for the Carve tool
  function caveInside(def, blank) {
    const size = { small: "small", medium: "medium", large: "large", huge: "enormous" }[def.ext.size] || "medium";
    if (!A.cave) return interior("other", def.ext, { blank });
    if (blank) { const [W, H] = A.cave.SIZES[size]; return { floors: [{ n: "THE CAVE", w: W, h: H, cave: 1, geo: "limestone", R: [], D: [], ST: [], M: [], I: [], P: [] }] }; }
    try { return A.cave.generate(Object.assign(A.cave.randomSettings(A.cave.newSeed()), { size, levels: 0, vertical: "elevations" })).map; } catch (e) { console.warn(e); return interior("other", def.ext, {}); }
  }

  /* ---- a starting interior: each floor a hall with its rooms on both sides, each with a door onto the hall, the
          floors joined by stairs at the hall's end, the cellar by stairs at its start. Nothing in it is fixed. */
  function interior(kind, ext, o) {
    const K = (KIND[kind] || KIND.other)[2], [W, H] = GRID[ext.size] || GRID.medium, nUp = Math.max(0, (+ext.floors || 1) - 1), fut = future();
    const kindFor = k => fut && ["boards", "flag", "carpet-r", "carpet-g", "carpet-b", "stone", "brick"].includes(k) ? (k === "flag" || k === "stone" || k === "brick" ? "metal" : "lino") : k;
    let rid = 0, sid = 0;
    const floorOf = (n, rooms, hallName) => {
      const hy = Math.floor(H / 2) - 1, hh = 2, R = [], D = [];
      R.push(["R" + (++rid), 0, hy, W, hh, hallName, kindFor(rooms[0] ? rooms[0][1] : "boards")]);
      const top = rooms.slice(0, Math.ceil(rooms.length / 2)), bot = rooms.slice(top.length);
      const row = (list, y, h, doorY) => { const step = W / Math.max(1, list.length); list.forEach(([nm, k, fx], i) => { const x0 = Math.round(i * step), x1 = Math.round((i + 1) * step), r = ["R" + (++rid), x0, y, x1 - x0, h, nm, kindFor(k)]; if (fx) r.push({ fx }); R.push(r); D.push([x0 + Math.floor((x1 - x0) / 2), doorY, "h", "d", 1]); }); };
      row(top, 0, hy, hy); row(bot, hy + hh, H - hy - hh, hy + hh);
      return { n, w: W, h: H, R, D, ST: [], M: [], I: [] };
    };
    if (o && o.blank) {
      // an empty shell: the building's outer walls and one open room on each floor, nothing in it
      const empty = n => { rid++; return { n, w: W, h: H, R: [["R" + rid, 0, 0, W, H, "Inside", kindFor("boards")]], D: [[0, Math.floor(H / 2), "v", "dd", 2]], ST: [], M: [], I: [] }; };
      const floors = [empty("Ground floor")]; for (let i = 0; i < nUp; i++) floors.push(empty(["First", "Second", "Third", "Fourth", "Fifth", "Sixth"][i] ? ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"][i] + " floor" : "Floor " + (i + 2))); if (o.cellar) floors.push(empty("Cellar"));
      link(floors, W, H, o.cellar); return { floors, entry: [floors[0].R[0][0]] };
    }
    const floors = [floorOf("Ground floor", K.g, fut ? "Corridor" : "Hall")];
    floors[0].D.push([0, Math.floor(H / 2) - 1, "v", "dd", 2]);          // the way in, from the street
    for (let i = 0; i < nUp; i++) floors.push(floorOf(["First", "Second", "Third", "Fourth", "Fifth", "Sixth"][i] ? ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"][i] + " floor" : "Floor " + (i + 2), K.u || K.g, fut ? "Corridor" : "Landing"));
    if (o && o.cellar) floors.push(floorOf(fut ? "Lower deck" : "Cellar", K.c || [["Cellar", "flag", "cellar"]], fut ? "Corridor" : "Passage"));
    link(floors, W, H, o && o.cellar);
    // the way in: the hall the front door opens into
    return { floors, entry: [floors[0].R[0][0]] };
    // stairs: up from each floor to the next at the hall's east end; down to the cellar at its west end
    function link(fl, w, h, cellar) {
      const hy = Math.floor(h / 2) - 1, ups = cellar ? fl.length - 1 : fl.length;
      for (let i = 0; i + 1 < ups; i++) { const id = "ST" + (++sid); fl[i].ST.push([id, w - 3, hy, 2, 2, "up", fl[i + 1].n, "e"]); fl[i + 1].ST.push([id, w - 3, hy, 2, 2, "down", fl[i].n, "e"]); }
      if (cellar) { const c = fl[fl.length - 1], id = "ST" + (++sid); fl[0].ST.push([id, 2, hy, 2, 2, "down", c.n, "w"]); c.ST.push([id, 2, hy, 2, 2, "up", fl[0].n, "w"]); }
    }
  }
  L.interior = interior;

  /* ---- keeping them: the page's database, and in the Atlas app the campaign's own files */
  const slug = s => String(s || "place").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 28) || "place";
  const newId = name => { let id; do id = "c-" + slug(name) + "-" + Math.random().toString(36).slice(2, 6); while (A.meta[id]); return id; };
  const tell = t => { const n = document.getElementById("tDockNote"); if (n) { n.textContent = t; clearTimeout(tell.t); tell.t = setTimeout(() => { n.textContent = ""; }, 8000); } };
  async function keep(id, def, opts) {
    def = Object.assign({}, def, { t: Date.now() }); if (!def.created) def.created = def.t;
    A.customPlace(id, def);
    if (S) S.set("customplaces", id, def);
    let where = "Saved in this campaign's page.";
    if (window.ATLAS_APP && window.ATLAS_APP.savePlaces) { try { await window.ATLAS_APP.savePlaces(Object.assign({}, A.customs)); where = "Saved into the campaign: it stays when the campaign is rebuilt."; } catch (e) { where = "Saved in the page, but not into the campaign's files: " + (e.message || e); } }
    document.dispatchEvent(new CustomEvent("atlas-places", { detail: { go: opts && opts.go === false ? null : id } }));
    tell(where); return id;
  }
  async function forget(id, withInterior) {
    if (!A.customs[id]) return;
    // (kept in the record, unless the interior goes too: the place can be brought back as it was)
    if (S) { S.set("customplaces", id, withInterior ? { off: true, t: Date.now() } : { off: true, t: Date.now(), was: Object.assign({}, A.customs[id], { map: A.mapEdits[id] ? { floors: A.mapEdits[id].floors } : A.customs[id].map }) }); if (withInterior) S.set("mapedits", id, { off: true, t: Date.now() }); }
    A.customPlace(id, null);
    if (window.ATLAS_APP) { try { if (window.ATLAS_APP.savePlaces) await window.ATLAS_APP.savePlaces(Object.assign({}, A.customs)); if (withInterior && window.ATLAS_APP.saveMap) await window.ATLAS_APP.saveMap(id, null); } catch (e) {} }
    document.dispatchEvent(new CustomEvent("atlas-places"));
  }

  /* ---- the dialog: what the place is, what it looks like outside, what it starts with inside, notes for the table */
  let dlg = null, draft = null, cityCtl = null;
  const opts = (list, cur) => list.map(([k, n]) => `<option value="${esc(k)}"${k === cur ? " selected" : ""}>${esc(n)}</option>`).join("");
  function districtsOf(ctl) { const D = (ctl && ctl.D) || {}; return Object.keys(D.districts || {}); }
  function form(def, isNew) {
    const x = def.ext || {}, ds = districtsOf(cityCtl), kinds = KINDS.map(k => [k[0], k[1]]);
    return `<form class="loc-form" method="dialog">
      <div class="loc-head"><h3>${isNew ? "A place of your own" : "Name, outside and notes"}</h3><button type="button" class="t-btn" data-locd="x" aria-label="Close">Close</button></div>
      <div class="loc-g2"><label>Name<input class="t-in" name="name" value="${esc(def.name || "")}" maxlength="80" required placeholder="The Rusty Anchor"></label>
        <label>What kind of place<select class="t-in" name="type">${opts(kinds, def.type || "tavern")}</select></label></div>
      ${isNew ? `<p class="t-small">That is all it needs: the rest can be left for later, and changed whenever you like.</p>` : ""}
      <details class="loc-more"${isNew ? "" : " open"}><summary>What it is</summary>
        <label>What the players see when they arrive (read aloud)<textarea class="t-in" name="pd" rows="3" maxlength="3000">${esc(def.pd || "")}</textarea></label>
        <label>What it really is, for you only: its history, its purpose, its secrets<textarea class="t-in" name="kp" rows="3" maxlength="4000">${esc(def.kp || "")}</textarea></label>
        <label>District<select class="t-in" name="district"><option value="">None</option>${opts(ds.map(d => [d, d]), def.district || "")}${def.district && !ds.includes(def.district) ? `<option selected>${esc(def.district)}</option>` : ""}</select></label>
      </details>
      <details class="loc-more"${isNew ? "" : " open"}><summary>Its outside</summary>
        <div class="loc-g3"><label>Size<select class="t-in" name="size">${opts([["small", "Small"], ["medium", "Medium"], ["large", "Large"], ["huge", "Huge"]], x.size || "medium")}</select></label>
          <label>Storeys<input class="t-in" type="number" name="floors" min="1" max="40" value="${+x.floors || 2}"></label>
          <label>Roof<select class="t-in" name="roof">${opts(ROOFS, x.roof || "pitched")}</select></label>
          <label>Walls<input class="t-in" type="color" name="wall" value="${esc(x.wall || "#cfc3a8")}"></label>
          <label>Roof colour<input class="t-in" type="color" name="roofc" value="${esc(x.roofc || "#6a4a3a")}"></label>
          <label>State<select class="t-in" name="cond">${opts(CONDS, x.cond || "")}</select></label></div>
        <label>A sign over the door<input class="t-in" name="sign" value="${esc(x.sign != null ? x.sign : "")}" maxlength="40" placeholder="The words painted on it, or nothing"></label>
        <div class="loc-row"><label class="loc-ck"><input type="checkbox" name="chimney"${x.chimney ? " checked" : ""}> A chimney</label><label class="loc-ck"><input type="checkbox" name="lights"${x.lights === false ? "" : " checked"}> Lights in the windows</label></div>
      </details>
      ${isNew ? `<details class="loc-more"><summary>Its inside</summary>
        <div class="loc-g2"><label>To start with<select class="t-in" name="start"><option value="plan">A plan for this kind of place: rooms, doors, stairs, furniture</option><option value="blank">An empty shell, to build myself</option></select></label>
          <label class="loc-ck"><input type="checkbox" name="cellar"> And a floor below ground</label></div>
        <p class="t-small">Either way it opens in the map editor, in 2D or in 3D, to change as you like: rooms, doors, stairs, floors, furniture from the libraries, clues and people.</p></details>` : ""}
      <details class="loc-more"><summary>For the campaign</summary>
        <label>Your notes: quests, people, factions, events here<textarea class="t-in" name="notes" rows="3" maxlength="4000">${esc(def.notes || "")}</textarea></label>
        <label class="loc-ck"><input type="checkbox" name="locked"${def.locked ? " checked" : ""}> Locked: the way in has to be found</label>
      </details>
      <div class="loc-ai"><span class="kl">Optional help</span><button type="button" class="t-btn" data-locd="aitext">Suggest what it is</button><button type="button" class="t-btn" data-locd="aiext">Suggest its outside</button><span class="loc-aimsg t-small" aria-live="polite"></span></div>
      <div class="loc-go">${isNew ? `<button type="button" class="t-btn prim" data-locd="place">Put it in the city →</button>` : `<button type="button" class="t-btn prim" data-locd="save">Save</button>`}<button type="button" class="t-btn" data-locd="x">Cancel</button></div>
    </form>`;
  }
  function read() {
    const f = dlg.querySelector("form"), v = n => (f.elements[n] ? f.elements[n].value : ""), ck = n => !!(f.elements[n] && f.elements[n].checked);
    const type = v("type") || "tavern", K = KIND[type] || KIND.other;
    const ext = Object.assign({}, (draft.def && draft.def.ext) || {}, { size: v("size") || "medium", floors: Math.max(1, Math.min(40, +v("floors") || 1)), roof: v("roof") || "pitched", wall: v("wall"), roofc: v("roofc"), cond: v("cond"), sign: v("sign").trim(), chimney: ck("chimney"), lights: ck("lights") });
    return { def: Object.assign({}, draft.def || {}, { name: v("name").trim() || "A new place", type, typeName: K[1], pd: v("pd").trim(), kp: v("kp").trim(), district: v("district"), notes: v("notes").trim(), locked: ck("locked"), ext }), start: v("start") || "plan", cellar: ck("cellar") };
  }
  function openDialog(def, isNew) {
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.id = "locDlg"; dlg.className = "loc-dlg"; document.body.appendChild(dlg);
      dlg.addEventListener("click", onDialogClick);
      // a new kind of place brings its usual outside (until the game master has set it themselves)
      dlg.addEventListener("change", e => {
        if (e.target.name !== "type" || !draft || !draft.isNew || draft.touched) return;
        const K = KIND[e.target.value] || KIND.other, x = K[2].ext || {}, f = dlg.querySelector("form");
        f.elements.size.value = x.size || "medium"; f.elements.floors.value = x.floors || 1; f.elements.roof.value = x.roof || "pitched"; f.elements.chimney.checked = !!x.chimney; f.elements.cond.value = x.cond || "";
        if (x.sign && !f.elements.sign.value) f.elements.sign.value = f.elements.name.value;
      });
      dlg.addEventListener("input", e => { if (draft && ["size", "floors", "roof", "chimney", "cond"].includes(e.target.name)) draft.touched = true; });
    }
    draft = { def: copy(def), isNew };
    dlg.innerHTML = form(def, isNew);
    if (!dlg.open) dlg.showModal();
    setTimeout(() => { const n = dlg.querySelector('[name="name"]'); if (n) { n.focus(); n.select(); } }, 30);
  }
  async function onDialogClick(e) {
    const b = e.target.closest("[data-locd]"); if (!b) return;
    const a = b.dataset.locd;
    if (a === "x") { dlg.close(); draft = null; return; }
    if (a === "aitext" || a === "aiext") return suggest(a, b);
    const r = read(); if (!r.def.name) return;
    if (a === "save") { const id = draft.id; dlg.close(); await keep(id, r.def); return; }
    if (a === "place") {
      // a new place: its inside is drawn now, from its kind (or an empty shell), and kept with it
      const id = newId(r.def.name), def = Object.assign(r.def, { city: (cityCtl && cityCtl.city) || undefined });
      if (def.ext.sign === "" && (KIND[def.type] || KIND.other)[2].ext.sign) def.ext.sign = def.name;
      def.map = def.type === "cave" ? caveInside(def, r.start === "blank") : interior(def.type, def.ext, { blank: r.start === "blank", cellar: r.cellar });
      if (def.type === "cave" && def.map.ov && !def.kp) def.kp = def.map.ov;
      dlg.close(); draft = null;
      startPlacing(id, def, true);
    }
  }
  // Claude's suggestions fill the form and nothing else: nothing is kept until the game master saves
  async function suggest(kind, btn) {
    const msg = dlg.querySelector(".loc-aimsg"), r = read(), ask = A.tableUI && A.tableUI.api && A.tableUI.api.askRaw;
    if (!ask) { msg.textContent = "Suggestions need Claude: on claude.ai, or in the Atlas app."; return; }
    const cfg = A.config || {}, cityName = (cityCtl && cityCtl.D && cityCtl.D.title) || cfg.setting || "";
    const base = `A tabletop roleplaying campaign: "${cfg.title || ""}" (${[cfg.system, cfg.setting].filter(Boolean).join(", ")}). In ${cityName}${r.def.district ? ", in the district of " + r.def.district : ""}, the game master is making a place of their own: "${r.def.name}", ${r.def.typeName.toLowerCase()}.${r.def.notes ? " Their notes: " + r.def.notes : ""}${r.def.kp ? " What they have written of it: " + r.def.kp : ""}`;
    const prompt = kind === "aitext"
      ? base + `\nWrite two short things for it, in the voice of the campaign. Answer with JSON only: {"pd": "what the players see and hear as they arrive, read aloud, three or four sentences, no secrets", "kp": "for the game master only: its history, its purpose, one secret and one thing that could happen here, five or six sentences"}. Invent nothing about the campaign's own people or events; anything new you suggest is new, and should read as a suggestion.`
      : base + `\nSuggest how it looks from the street. Answer with JSON only: {"size": "small|medium|large|huge", "floors": 1-12, "roof": "pitched|hip|flat|dome|spire|tower", "wall": "#rrggbb", "roofc": "#rrggbb", "cond": "|worn|abandoned|ruined", "sign": "words on its sign, or empty", "chimney": true|false, "lights": true|false}.`;
    btn.disabled = true; msg.textContent = "Asking Claude…";
    let v = null; try { const raw = await ask(prompt); const m = String(raw || "").match(/\{[\s\S]*\}/); v = m ? JSON.parse(m[0]) : null; } catch (e) { v = null; }
    btn.disabled = false;
    if (!v) { msg.textContent = "Claude could not answer just now. Write it yourself, or try again."; return; }
    const f = dlg.querySelector("form");
    if (kind === "aitext") { if (v.pd) f.elements.pd.value = String(v.pd).slice(0, 3000); if (v.kp) f.elements.kp.value = String(v.kp).slice(0, 4000); f.querySelectorAll(".loc-more")[0].open = true; }
    else { for (const k of ["size", "roof", "cond"]) if (v[k] != null && f.elements[k].querySelector(`option[value="${CSS.escape(String(v[k]))}"]`)) f.elements[k].value = v[k]; if (+v.floors) f.elements.floors.value = Math.max(1, Math.min(40, +v.floors)); for (const k of ["wall", "roofc"]) if (/^#[0-9a-f]{6}$/i.test(v[k] || "")) f.elements[k].value = v[k]; if (typeof v.sign === "string") f.elements.sign.value = v.sign.slice(0, 40); f.elements.chimney.checked = !!v.chimney; f.elements.lights.checked = v.lights !== false; f.querySelectorAll(".loc-more")[1].open = true; draft.touched = true; }
    msg.textContent = "Suggested: change anything, then save. Nothing is kept until you do.";
  }

  /* ---- putting it in the city: its ghost follows the pointer, green where it may stand, amber where it may with a
          warning, red where it may not (in the water, on the street, on another place, off the map); a click puts it
          there to look at, and only "Put it here" keeps it */
  let P0 = null;
  function startPlacing(id, def, isNew) {
    const ctl = cityCtl; if (!ctl) return;
    stopPlacing();
    const box = ctl.map ? ctl.map.dbg.renderer.domElement : document.querySelector("#citybox .cityflat"), bar = document.querySelector("#citybox .placebar");
    const [fw, fd] = A.customSize(def.ext);
    P0 = { id, def, isNew, ctl, bar, g: { id, x: (def.at || [0, 0])[0], y: (def.at || [0, 0])[1], ang: +def.ang || 0, ext: def.ext, lr: Math.hypot(fw, fd) / 2 }, held: !!def.here, v: null, turned: !!def.here };
    ctl.placing = true;
    const show = () => {
      const v = P0.v, g = P0.g;
      bar.hidden = false;
      const state = !v ? "Move the pointer over the city." : !v.ok ? `<b class="pb-no">It cannot stand here:</b> ${esc(v.why)}` : `<b class="pb-ok">It can stand here.</b>${v.houses ? ` ${v.houses} house${v.houses > 1 ? "s" : ""} will make way for it.` : ""}${v.warn ? " " + esc(v.warn) : ""}`;
      bar.innerHTML = `<span class="pb-t">${P0.held ? "Here?" : `Click where <b>${esc(def.name)}</b> stands.`} ${state}</span><span class="pb-b">${P0.held ? `<button type="button" class="t-btn prim" data-pb="ok"${v && v.ok ? "" : " disabled"}>Put it here</button><button type="button" class="t-btn" data-pb="again">Choose again</button>` : ""}<button type="button" class="t-btn" data-pb="turn" title="Turn it (R)">⟳ Turn</button><button type="button" class="t-btn" data-pb="x">Cancel</button></span>`;
    };
    // its front turns to the nearest street, as the city's own buildings do, until the game master turns it themselves
    const face = () => {
      const C = ctl.city3, g = P0.g; if (P0.turned || !C || !C.nearestRoad) return;
      const nr = C.nearestRoad(g.x, g.y, 40); if (!nr) return;
      const s = nr.s, a = Math.atan2(s.by - s.ay, s.bx - s.ax), fx = nr.qx - g.x, fy = nr.qy - g.y, nx = -Math.sin(a), ny = Math.cos(a), sg = fx * nx + fy * ny >= 0 ? 1 : -1;
      g.ang = Math.atan2(nx * sg, ny * sg);
    };
    const update = () => { face(); P0.v = ctl.judge ? ctl.judge(P0.g) : { ok: true }; if (ctl.map) ctl.map.ghost(P0.g, P0.v); show(); };
    const planOf = ev => { if (ctl.map) return ctl.map.planAt(ev.clientX, ev.clientY); const svg = document.querySelector("#citybox .cityflat"); if (!svg) return null; const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; };
    let down = null;
    const onMove = ev => { if (P0.held || ev.buttons) return; const p = planOf(ev); if (!p) return; P0.g.x = p[0]; P0.g.y = p[1]; update(); };
    const onDown = ev => { down = { x: ev.clientX, y: ev.clientY }; };
    const onUp = ev => { if (!down || ev.button !== 0) { down = null; return; } const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y); down = null; if (moved > 6) return; const p = planOf(ev); if (!p) return; P0.g.x = p[0]; P0.g.y = p[1]; P0.held = true; update(); };
    const onKey = ev => { if (ev.key === "Escape") { ev.preventDefault(); stopPlacing(); } else if ((ev.key === "r" || ev.key === "R") && !/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) { P0.turned = true; P0.g.ang += (ev.shiftKey ? -1 : 1) * Math.PI / 12; update(); } };
    const onBar = async ev => {
      const b = ev.target.closest("[data-pb]"); if (!b) return;
      if (b.dataset.pb === "x") return stopPlacing();
      if (b.dataset.pb === "turn") { P0.turned = true; P0.g.ang += Math.PI / 12; update(); return; }
      if (b.dataset.pb === "again") { P0.held = false; update(); return; }
      if (b.dataset.pb === "ok" && P0.v && P0.v.ok) { const d = Object.assign({}, P0.def, { here: undefined, at: [Math.round(P0.g.x * 100) / 100, Math.round(P0.g.y * 100) / 100], ang: Math.round(P0.g.ang * 1000) / 1000, city: P0.def.city || ctl.city }); const pid = P0.id; stopPlacing(); await keep(pid, d); }
    };
    box.addEventListener("pointermove", onMove); box.addEventListener("pointerdown", onDown); box.addEventListener("pointerup", onUp); window.addEventListener("keydown", onKey); bar.addEventListener("click", onBar);
    P0.off = () => { box.removeEventListener("pointermove", onMove); box.removeEventListener("pointerdown", onDown); box.removeEventListener("pointerup", onUp); window.removeEventListener("keydown", onKey); bar.removeEventListener("click", onBar); };
    if (def.at) update(); else show();
    const at = document.querySelector(".atlas"); if (at) at.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function stopPlacing() {
    if (!P0) return; const p = P0; P0 = null; p.off(); p.ctl.placing = false; if (p.ctl.map) p.ctl.map.ghost(null); if (p.bar) { p.bar.hidden = true; p.bar.innerHTML = ""; }
  }

  /* ---- on a place's page: what it is, and what can be done with it */
  const ICON = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9l8-5 8 5v11z"/><path d="M10 20v-6h4v6"/><path d="M19 3v4M17 5h4"/></svg>`;
  const RELS = [["involves", "is often here"], ["belongs to", "owns it"], ["knows about", "knows of it"], ["concerns", "concerns it"], ["leads to", "leads here"]];
  L.panel = p => {
    const def = A.customs[p.id] || {}, St = A.story, x = def.ext || {}, cond = (CONDS.find(c => c[0] === (x.cond || "")) || CONDS[0])[1];
    const links = St && St.linksOf ? St.linksOf("place:" + p.id).filter(l => l.src !== "written") : [];
    const people = St && St.people ? St.people() : [], items = (St && St.items ? Object.entries(St.items()).map(([id, it]) => ["item:" + id, it.n || id]) : []).concat(Object.entries(A.factionsData || {}).map(([id, f]) => ["faction:" + id, (f.n || id) + " (a faction)"]));
    const made = def.created ? new Date(def.created).toLocaleDateString() : "";
    return `<section class="sec keeper loc-panel"><h3>${ICON} A place of your own</h3>
      <p class="loc-sum">${esc(def.typeName || "A place")}${def.district ? " · " + esc(def.district) : ""} · ${esc(cond)}${def.locked ? " · locked" : ""}${made ? ` · made ${esc(made)}` : ""}${def.t && def.t !== def.created ? ` · changed ${esc(new Date(def.t).toLocaleDateString())}` : ""}</p>
      <div class="loc-acts"><button type="button" class="t-btn prim" data-loc="build" data-id="${esc(p.id)}">Build the interior</button><button type="button" class="t-btn" data-loc="edit" data-id="${esc(p.id)}">Name, outside and notes</button><button type="button" class="t-btn" data-loc="move" data-id="${esc(p.id)}">Move it</button><button type="button" class="t-btn" data-loc="dup" data-id="${esc(p.id)}">Duplicate</button>${A.askChange ? `<button type="button" class="t-btn" data-loc="ask" data-id="${esc(p.id)}" title="Say what should change; see what it replaces before anything does">Ask for a change…</button>` : ""}${def.prevMap ? `<button type="button" class="t-btn" data-loc="prevmap" data-id="${esc(p.id)}" title="Put back the inside it had before it was drawn again (the one it has now is kept in its place)">Bring back the inside it had</button>` : ""}<button type="button" class="t-btn loc-del" data-loc="del" data-id="${esc(p.id)}">Delete…</button></div>
      ${def.notes ? `<p class="loc-notes"><span class="kl">Your notes</span>${esc(def.notes)}</p>` : ""}
      <div class="loc-links"><span class="kl">Who and what belongs here</span>${links.length ? `<ul>${links.map(l => `<li>${esc(St.name(l.other))} <span class="t-small">(${esc(l.rel)})</span></li>`).join("")}</ul>` : `<p class="t-small">Nobody yet. People and things joined here are joined in the investigation too, and the clues you put on its maps are its clues.</p>`}
        ${St && St.link ? `<form class="loc-link" data-locform="link" data-id="${esc(p.id)}"><select class="t-in" name="who" aria-label="Who or what"><option value="">Someone or something…</option>${people.map(q => `<option value="${esc(q.ref)}">${esc(q.name)}</option>`).join("")}${items.map(([r, n]) => `<option value="${esc(r)}">${esc(n)}</option>`).join("")}</select><select class="t-in" name="rel" aria-label="How">${opts(RELS, "involves")}</select><button class="t-btn">Join</button></form>` : ""}</div>
    </section>`;
  };
  // deleting asks first, and says what goes with it
  function askDelete(id) {
    const def = A.customs[id]; if (!def) return;
    const d = document.createElement("dialog"); d.className = "loc-dlg"; document.body.appendChild(d);
    const St = A.story, links = St && St.linksOf ? St.linksOf("place:" + id).filter(l => l.src !== "written").length : 0;
    d.innerHTML = `<form class="loc-form" method="dialog"><h3>Delete ${esc(def.name)}?</h3>
      <p>It is taken out of the city and out of the list of places. Nothing else is deleted unless you say so: ${links ? `its ${links} connection${links > 1 ? "s" : ""} in the investigation stay, and will show as pointing to a place that is gone; ` : ""}the people and clues of the campaign are untouched.</p>
      <label class="loc-ck"><input type="checkbox" name="inside"> Also delete the interior I built (otherwise it is kept in the campaign's records, and the place can be brought back as it was)</label>
      <div class="loc-go"><button type="button" class="t-btn loc-del" data-d="yes">Delete it</button><button type="button" class="t-btn prim" data-d="no">Keep it</button></div></form>`;
    d.addEventListener("click", async e => { const b = e.target.closest("[data-d]"); if (!b) return; const inside = d.querySelector('[name="inside"]').checked; d.close(); d.remove(); if (b.dataset.d === "yes") { await forget(id, inside); tell(`${def.name} is deleted${inside ? ", with its interior" : "; its interior is kept"}.`); } });
    d.addEventListener("close", () => d.remove());
    d.showModal();
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-loc]"); if (!b) return;
    const id = b.dataset.id, def = A.customs[id]; if (!def) return;
    const a = b.dataset.loc;
    if (a === "build") { if (A.mapEditor) A.mapEditor.open(id); return; }
    if (a === "edit") { draft = { id }; openDialog(def, false); draft.id = id; return; }
    if (a === "move") { withCity(def.city, () => startPlacing(id, def, false)); return; }
    if (a === "dup") {
      // the copy has the same inside as it stands now (redrawn or not), and is put down beside it
      const src = A.mapEdits[id] ? { floors: copy(A.mapEdits[id].floors) } : def.map ? copy(def.map) : null;
      const nd = Object.assign(copy(def), { name: def.name + " (copy)", map: src, created: 0, at: def.at ? [def.at[0] + 6, def.at[1] + 6] : def.at });
      withCity(def.city, () => startPlacing(newId(nd.name), nd, true)); return;
    }
    if (a === "del") askDelete(id);
    if (a === "ask" && A.askChange) { A.askChange(askTarget(id)); return; }
    // (the inside it had and the inside it has change places, so this can be undone the same way)
    if (a === "prevmap" && def.prevMap) { const now = A.mapEdits[id] ? { floors: cp(A.mapEdits[id].floors) } : def.map ? cp(def.map) : null; setInside(id, Object.assign({}, def, { prevMap: now }), cp(def.prevMap)); return; }
  });
  document.addEventListener("submit", e => {
    const f = e.target.closest && e.target.closest('[data-locform="link"]'); if (!f) return; e.preventDefault();
    const who = f.elements.who.value, rel = f.elements.rel.value, id = f.dataset.id; if (!who || !A.story || !A.story.link) return;
    A.story.link(who, "place:" + id, rel, { why: "joined on the place's page" }, { src: "dm" });
    document.dispatchEvent(new CustomEvent("atlas-places"));
  });
  // the city a place stands in, on the map, before anything is done there
  function withCity(cid, then) { const sh = L.__shell; if (sh && sh.mountCity) sh.mountCity(cid, c => { cityCtl = c; then(); }); else if (cityCtl) then(); }

  /* ---- the public part */
  L.create = ctl => { cityCtl = ctl; const K = KIND.tavern; openDialog({ type: "tavern", ext: Object.assign({}, K[2].ext) }, true); };
  // a building of the city made into a place of the game master's own (the city editor's "Make it a place"): the
  // dialog opens with the building's kind, its footprint (a little inside it, so a terrace's neighbours sharing its walls
  // stand), floors, roof and colours, and the place is held where the
  // building stands, so one "Put it here" sets it in (the house makes way for it, as for any place set in)
  const FROM = { terrace: "house", shop: "shop", pub: "tavern", church: "temple", chapel: "shrine", school: "school", ware: "warehouse" };

  /* ---- "Ask for a change" on a place of your own (atlas-ask.js): its name; its kind and its outside; its words (read
          aloud, and the game master's notes); or its inside drawn again from its kind, the inside it had kept with it
          ("Bring back the inside it had" puts it back). Its people and clues stay in the campaign whatever changes */
  const cp = o => JSON.parse(JSON.stringify(o));
  // (a place's inside set anew: the game master's changes to the old one dropped at once, so they cannot come back over it)
  async function setInside(id, nd, map) {
    if (A.mapEdits[id]) A.mapUnedit(id);
    if (S) S.set("mapedits", id, { off: true, t: Date.now() });
    if (window.ATLAS_APP && window.ATLAS_APP.saveMap) { try { await window.ATLAS_APP.saveMap(id, null); } catch (e) {} }
    nd.map = map; A.maps[id] = Object.assign(cp(map), { t: nd.name, ext: nd.pd || "", ov: nd.kp || "" }); A.state.cache = {};
    return keep(id, nd);
  }
  function askTarget(id) {
    const def = A.customs[id], x = def.ext || {}, K = KIND[def.type] || KIND.other, AC = A.askChange, M = (A.maps[id] && A.get(id, 99)) || {};
    const floors = (M.floors || []).length, rooms = Math.max(Object.keys(M.rooms || {}).length, (M.floors || []).reduce((n, F) => n + ((F.R || []).length), 0)), clues = Object.keys(M.clues || {}).length, npcs = Object.keys(M.npcs || {}).length, edited = !!A.mapEdits[id];
    const kinds = KINDS.map(k => k[0]), CH = { size: ["small", "medium", "large", "huge"], roof: ["pitched", "hip", "flat", "dome", "spire", "tower"], cond: ["", "worn", "abandoned", "ruined"] };
    const WORD = { size: "size", floors: "floors", roof: "roof", cond: "state", sign: "sign", wall: "wall colour", roofc: "roof colour" }, cut = (s, n) => s.length > n ? s.slice(0, n) + "…" : s;
    const fl = n => `${n} floor${n === 1 ? "" : "s"}`;
    return {
      what: "a place of your own", name: def.name, example: "Make it a ruined watchtower with a cellar, and give it a darker history.",
      now: `${K[1]}${def.district ? ", in " + def.district : ""}. Outside: ${x.size || "medium"}, ${fl(x.floors || 1)}, a ${x.roof || "pitched"} roof${x.cond ? ", " + x.cond : ""}${x.sign ? ", its sign: " + x.sign : ""}. Inside: ${fl(floors)}, ${rooms} rooms${edited ? ", changed by the game master" : ""}. Read aloud on arrival: ${def.pd || "(nothing yet)"}. The game master's notes: ${def.kp || "(nothing yet)"}.`,
      ops: {
        rename: { label: "Rename it", values: '{"name": "the new name"}',
          read: v => { const n = AC.str(v.name, 80); return n && n !== def.name ? { name: n } : null; },
          plan: v => ({ change: `Rename ${def.name} to ${v.name}`, replaces: [`its name, ${def.name}`], keeps: ["everything else: its outside, its inside, its people and clues"] }),
          apply: v => keep(id, Object.assign({}, def, { name: v.name })) },
        outside: { label: "Change what kind of place it is, or how it looks outside", values: `only those that change: {"type": one of ${kinds.join("|")}, "size": "small|medium|large|huge", "floors": 1 to 12, "roof": "pitched|hip|flat|dome|spire|tower", "cond": "" or "worn|abandoned|ruined", "sign": "words on its sign, or empty", "wall": "#rrggbb", "roofc": "#rrggbb"}`,
          read: v => { const o = {}; if (AC.one(v.type, kinds) && v.type !== def.type) o.type = v.type; for (const k of ["size", "roof", "cond"]) if (v[k] != null && AC.one(v[k], CH[k]) != null && v[k] !== (x[k] || "")) o[k] = v[k]; const f = AC.num(v.floors, 1, 12); if (f && f !== (x.floors || 1)) o.floors = f; if (typeof v.sign === "string" && v.sign !== (x.sign || "")) o.sign = v.sign.slice(0, 40); for (const k of ["wall", "roofc"]) if (/^#[0-9a-f]{6}$/i.test(v[k] || "")) o[k] = v[k]; return Object.keys(o).length ? o : null; },
          plan: v => ({ change: `Change ${def.name}'s ${v.type ? "kind and " : ""}outside`, replaces: [...(v.type ? [`what kind of place it is: ${K[1].toLowerCase()} → ${(KIND[v.type] || K)[1].toLowerCase()}`] : []), ...Object.entries(v).filter(([k]) => k !== "type").map(([k, val]) => `its ${WORD[k]}: ${x[k] != null && x[k] !== "" ? x[k] : "none"} → ${val === "" ? "none" : val}`)], keeps: ["its name and where it stands", `its inside as it is (${fl(floors)}): draw it again separately if it should match`, "its people and clues"] }),
          apply: v => { const nd = Object.assign({}, def, { ext: Object.assign({}, x) }); if (v.type) { nd.type = v.type; nd.typeName = (KIND[v.type] || K)[1]; } for (const [k, val] of Object.entries(v)) if (k !== "type") nd.ext[k] = val; return keep(id, nd); } },
        words: { label: "Write what the players see on arriving, or the game master's notes on it", values: '{"pd": "what the players see and hear as they arrive, read aloud, three or four sentences, no secrets" (or omitted), "kp": "for the game master only: its history, its purpose, a secret and something that could happen here, five or six sentences" (or omitted)}',
          read: v => { const o = {}, pd = AC.str(v.pd, 3000), kp = AC.str(v.kp, 4000); if (pd) o.pd = pd; if (kp) o.kp = kp; return Object.keys(o).length ? o : null; },
          plan: v => ({ change: `Write ${def.name}'s ${[v.pd && "words read aloud", v.kp && "notes for you"].filter(Boolean).join(" and ")}`, replaces: [v.pd && def.pd ? `what was read aloud: "${cut(def.pd, 90)}"` : "", v.kp && def.kp ? `your notes on it: "${cut(def.kp, 90)}"` : ""].filter(Boolean), keeps: ["its name, outside and inside", "its people and clues"], detail: [v.pd && "Read aloud: " + v.pd, v.kp && "For you: " + v.kp] }),
          apply: v => keep(id, Object.assign({}, def, v)) },
        inside: { label: "Draw its inside again, from its kind (or as an empty shell to draw by hand)", values: `{"type": one of ${kinds.join("|")} (its own kind, or a new one), "blank": true for an empty shell, "cellar": true for a cellar}`,
          read: v => ({ type: AC.one(v.type, kinds) || def.type, blank: v.blank === true, cellar: v.cellar === true }),
          plan: v => ({ change: `Draw ${def.name}'s inside again${v.blank ? ", as an empty shell" : `, as ${((KIND[v.type] || K)[1]).toLowerCase()}`}${v.cellar ? ", with a cellar" : ""}`,
            replaces: [`its inside as it is: ${fl(floors)}, ${rooms} rooms${edited ? ", with your changes to it" : ""}`, ...(clues ? [`where its ${clues} clue${clues === 1 ? " lies" : "s lie"} on the floors (the clue${clues === 1 ? " stays" : "s stay"} in the investigation: put ${clues === 1 ? "it" : "them"} on the new floors)`] : []), ...(npcs ? [`where ${npcs} ${npcs === 1 ? "person stands" : "people stand"} on its floors (they stay in the campaign)`] : []), ...(v.type !== def.type ? [`what kind of place it is: ${K[1].toLowerCase()} → ${(KIND[v.type] || K)[1].toLowerCase()}`] : [])],
            keeps: ["its name, its outside and where it stands", "its people and clues in the investigation", "the inside it had, kept with it: \"Bring back the inside it had\" on its page undoes this"] }),
          apply: v => { const old = A.mapEdits[id] ? { floors: cp(A.mapEdits[id].floors) } : def.map ? cp(def.map) : null; const nd = Object.assign({}, def, { type: v.type, typeName: (KIND[v.type] || K)[1], prevMap: old }); return setInside(id, nd, v.type === "cave" ? caveInside(nd, v.blank) : interior(v.type, nd.ext || {}, { blank: v.blank, cellar: v.cellar })); } }
      }
    };
  }
  L.askTarget = askTarget;
  L.fromBuilding = (ctl, b) => {
    cityCtl = ctl; const type = FROM[b.type] || (KIND[b.type] ? b.type : "other"), K = KIND[type] || KIND.other, area = b.w * b.d;
    const size = area < 11 ? "small" : area < 21 ? "medium" : area < 45 ? "large" : "huge", hx = v => /^#[0-9a-f]{6}$/i.test(v || "") ? v : undefined;
    const ext = Object.assign({}, K[2].ext, { size, w: Math.round(b.w * 92) / 100, d: Math.round(b.d * 92) / 100, floors: Math.max(1, Math.round((b._H || 1.9) / .95)), roof: b._pitch ? "pitched" : "flat", wall: hx(b._wall), roofc: hx(b._roof) });
    openDialog({ type, ext, at: [Math.round(b.x * 100) / 100, Math.round(b.y * 100) / 100], ang: Math.round((b.a || 0) * 1000) / 1000, here: true }, true);
  };
  L.setCity = ctl => { cityCtl = ctl; };
  L.save = keep; L.forget = forget; L.place = (id, def) => startPlacing(id, def, !A.customs[id]);
  L.init = (store) => {
    S = store;
    // what the database holds: newer than what the page has, it is taken in; the interiors drawn for them follow
    S.watch("customplaces", d => {
      let changed = false;
      for (const [id, def] of Object.entries(d || {})) {
        const cur = A.customs[id];
        if (def && def.off) { if (cur && (cur.t || 0) <= def.t) { A.customPlace(id, null); changed = true; } continue; }
        if (def && (!cur || (cur.t || 0) < (def.t || 0))) { A.customPlace(id, def); changed = true; }
      }
      if (changed) { T.applyMapEdits(S.get("mapedits") || {}); document.dispatchEvent(new CustomEvent("atlas-places")); }
    });
  };
})(ATLAS);
