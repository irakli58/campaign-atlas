/* At the table: what the referee needs while the game is played, and what the players see.
   The council's table material is registered here (clocks, the session plan, the players' characters, random tables,
   handouts, rescues); this file also holds what both the referee's page and the players' screen use: the shared store
   (the page's database, or this browser, kept in step between open windows at once), handouts drawn in the style of
   the story's age, the conspiracy board, fog of war on the floor plans, dice, and people made on the spot. The players'
   screen is the same page opened with #players: it shows only what the referee puts on it.
   The user asked for all of it on 20 Oct 2026 (the players' screen, handouts, ask the campaign, the villain's clocks,
   the characters woven in, the session sheet, recaps, the session plan, "they're stuck", random tables, a person on
   demand, combat and sanity, rules for the game, the conspiracy board, the players' journal, online-table export, a
   printed book, a table-side view, safety tools, places made on the fly). */
(function (A) {
  "use strict";
  const esc = A.esc || (s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));

  /* ---- the council's table material (references/data-format.md, section 7) */
  A.clocks = list => { A.clocksData = (A.clocksData || []).concat(list || []); return A; };
  A.sessions = list => { A.sessionsData = (list || []).slice(); return A; };
  A.pcs = obj => { A.pcsData = Object.assign(A.pcsData || {}, obj || {}); return A; };
  A.tables = obj => { A.tablesData = Object.assign(A.tablesData || {}, obj || {}); return A; };
  A.handouts = list => { A.handoutsData = (A.handoutsData || []).concat(list || []); return A; };
  A.rescues = list => { A.rescuesData = (A.rescuesData || []).concat(list || []); return A; };

  /* ---- a map as the referee redrew it (the map editor, atlas-mapedit.js; the user asked, 21 Oct 2026, to get a place's
          map exactly as they want it). An edit replaces the place's floors (rooms, doors, stairs, markers, hand-placed
          items; furniture is laid out again from each room's fx) at the size it was edited at, which becomes the place's
          only size; its rooms' new words are laid over the guide. It comes from the campaign's edits/<id>.js, or, on the
          page, from the database (collection "mapedits"), and A.mapUnedit puts the drawn map back. */
  A.mapEdits = {}; A.mapOrig = {};
  A.mapEdit = (id, ed) => {
    if (!A.maps[id] && !(ed && ed.off)) { (A.__badEdits = A.__badEdits || []).push(id); return A; }
    if (!A.maps[id] || !ed || !Array.isArray(ed.floors) || !ed.floors.length) return A;
    const copy = o => JSON.parse(JSON.stringify(o));
    if (!A.mapOrig[id]) A.mapOrig[id] = { map: A.maps[id], exp: A.exp[id] };
    A.maps[id] = A.mapOrig[id].map; if (A.mapOrig[id].exp) A.exp[id] = A.mapOrig[id].exp; A.state.cache = {};
    const src = A.get(id, ed.level == null ? 99 : ed.level);
    const floors = ed.floors.map(F0 => { const F = Object.assign({ D: [], I: [], ST: [], M: [] }, copy(F0)); F.R = F.R || []; F.I = (F.I || []).slice(); return A.finishFloor ? A.finishFloor(F, F.R) : F; });
    const M = Object.assign({}, src, { floors, edited: ed.t || 1 }); delete M.order; if (ed.order) M.order = ed.order;
    M.rooms = Object.assign({}, src.rooms || {}); for (const [rid, r] of Object.entries(ed.rooms || {})) M.rooms[rid] = Object.assign({}, M.rooms[rid] || {}, r);
    A.maps[id] = M; delete A.exp[id]; A.mapEdits[id] = ed; A.state.cache = {};
    return A;
  };
  A.mapUnedit = id => { const o = A.mapOrig[id]; if (!o) return A; A.maps[id] = o.map; if (o.exp) A.exp[id] = o.exp; else delete A.exp[id]; delete A.mapEdits[id]; delete A.mapOrig[id]; A.state.cache = {}; return A; };
  // the edits kept in the page's database, laid over the places: a newer edit replaces the older; { off: true } puts a
  // place back as it was drawn (even one edited in the campaign's files); an edit gone from the database is undone,
  // unless it came with the campaign's files. Says whether anything changed.
  function applyMapEdits(d) {
    d = d || {};
    if (!A.__srcEdits) A.__srcEdits = new Set(Object.keys(A.mapEdits));
    let changed = false;
    for (const [id, ed] of Object.entries(d)) {
      if (!A.maps[id] || !ed) continue;
      if (ed.off) { if (A.mapEdits[id]) { A.mapUnedit(id); changed = true; } continue; }
      if (!A.mapEdits[id] || A.mapEdits[id].t !== ed.t) { A.mapEdit(id, ed); changed = true; }
    }
    for (const id of Object.keys(A.mapEdits)) if (!(id in d) && !A.__srcEdits.has(id)) { A.mapUnedit(id); changed = true; }
    return changed;
  }

  /* ---- the age the story is set in: it dresses the handouts and names the people */
  function era() {
    const c = A.config || {}; if (c.era) return c.era;
    const look = A.cityData ? (typeof A.cityData.look === "string" ? A.cityData.look : (A.cityData.look || {}).base || "") : "";
    const said = [c.setting, c.subtitle, c.strap, c.title].filter(x => typeof x === "string").join(" ");
    const ym = said.match(/\b(1[0-9]\d\d|2[0-9]\d\d)\b/), y = +c.year || (ym ? +ym[1] : 0);
    if (look === "scifi" || look === "future" || y >= 2100) return "future";
    if (look === "fantasy" || /\b(d&d|dungeons|pathfinder|fantasy|elves|dragons?)\b/i.test(said + " " + (c.system || ""))) return "fantasy";
    if (look === "medieval" || (y && y < 1650)) return "medieval";
    if (look === "modern" || y >= 1960) return "modern";
    if (y >= 1910 || /cthulhu/i.test(c.system || "")) return "1920s";
    return "victorian";
  }
  const ERA_KIND = { victorian: "letter", "1920s": "letter", medieval: "scroll", fantasy: "scroll", modern: "email", future: "datapad" };

  /* ---- every handout in the campaign: the council's own list, and each clue that is a thing to hold */
  function allHandouts() {
    const out = [];
    (A.handoutsData || []).forEach((h, i) => out.push(Object.assign({ id: h.id || "h" + (i + 1) }, h)));
    for (const id of A.order || []) {
      if (!A.maps[id]) continue;
      const M = A.get(id, 99);
      for (const [k, c] of Object.entries(M.clues || {})) if (c.handout) out.push(Object.assign({ id: id + "." + k, place: id, clue: k, title: c.t }, typeof c.handout === "string" ? { text: c.handout } : c.handout));
    }
    return out;
  }
  const paras = t => String(t || "").split(/\n\s*\n/).map(p => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("");
  // a newspaper's name from the city, when the handout gives none
  function paperName(h) { if (h.paper) return h.paper; const city = (A.cityData && A.cityData.title) || (A.config && A.config.setting) || ""; const town = String(city).replace(/^(a true map of|the)\s+/i, "").split(/[,·(]/)[0].trim() || "Evening"; return `The ${town} ${["Gazette", "Herald", "Chronicle", "Courier"][town.length % 4]}`; }
  // a handout, drawn as the thing it is, in the look of its age
  function handoutHTML(h) {
    const e = h.era || era(), kind = h.kind || ERA_KIND[e] || "letter", body = paras(h.text);
    const head = h.title && !["letter", "note", "diary", "telegram"].includes(kind) ? `<h4 class="ho-title">${esc(h.title)}</h4>` : "";
    switch (kind) {
      case "telegram": {
        const words = String(h.text || "").toUpperCase().replace(/\s*[.!?]+\s*/g, " STOP ").replace(/\s+/g, " ").trim();
        return `<article class="ho ho-telegram era-${e}"><header><b>Telegram</b><span>${esc(h.date || "")}</span></header><dl><div><dt>To</dt><dd>${esc(h.to || "")}</dd></div><div><dt>From</dt><dd>${esc(h.from || "")}</dd></div></dl><div class="ho-tg">${esc(words)}</div></article>`;
      }
      case "newspaper":
        return `<article class="ho ho-newspaper era-${e}"><header><div class="ho-mast">${esc(paperName(h))}</div><div class="ho-dateline">${esc(h.date || "")}${h.price ? " · " + esc(h.price) : ""}</div></header><h4 class="ho-headline">${esc(h.headline || h.title || "")}</h4>${h.sub ? `<div class="ho-sub">${esc(h.sub)}</div>` : ""}<div class="ho-cols">${body}</div></article>`;
      case "diary":
        return `<article class="ho ho-diary era-${e}">${h.date ? `<div class="ho-date">${esc(h.date)}</div>` : ""}<div class="ho-body">${body}</div></article>`;
      case "note":
        return `<article class="ho ho-note era-${e}"><div class="ho-body">${body}</div>${h.from ? `<div class="ho-sign">${esc(h.from)}</div>` : ""}</article>`;
      case "ledger": {
        const rows = String(h.text || "").split(/\n/).filter(l => l.trim()).map(l => `<tr>${l.split("|").map(c => `<td>${esc(c.trim())}</td>`).join("")}</tr>`).join("");
        return `<article class="ho ho-ledger era-${e}">${head}<table>${rows}</table></article>`;
      }
      case "notice": case "poster":
        return `<article class="ho ho-notice era-${e}">${head}<div class="ho-body">${body}</div>${h.from ? `<div class="ho-sign">${esc(h.from)}</div>` : ""}</article>`;
      case "photo":
        return `<figure class="ho ho-photo era-${e}"><div class="ho-ph"><span>${esc(h.scene || h.text || "")}</span></div><figcaption>${esc(h.caption || h.title || "")}</figcaption></figure>`;
      case "email":
        return `<article class="ho ho-email era-${e}"><header><div><b>From</b> ${esc(h.from || "")}</div><div><b>To</b> ${esc(h.to || "")}</div><div><b>Subject</b> ${esc(h.title || "")}</div><div class="ho-date">${esc(h.date || "")}</div></header><div class="ho-body">${body}</div></article>`;
      case "message":
        return `<article class="ho ho-message era-${e}">${head}${String(h.text || "").split(/\n/).filter(l => l.trim()).map(l => { const m = /^([^:]{1,30}):\s*(.*)$/.exec(l); return `<div class="ho-msg${m && h.from && m[1].trim() === h.from ? " me" : ""}">${m ? `<b>${esc(m[1])}</b>${esc(m[2])}` : esc(l)}</div>`; }).join("")}</article>`;
      case "datapad":
        return `<article class="ho ho-datapad era-${e}"><header><span>${esc(h.title || "Record")}</span><span>${esc(h.date || "")}</span></header><div class="ho-body">${body}</div>${h.from ? `<footer>${esc(h.from)}</footer>` : ""}</article>`;
      case "scroll":
        return `<article class="ho ho-scroll era-${e}"><div class="ho-roll"></div>${head}<div class="ho-body">${body}</div>${h.from ? `<div class="ho-sign">${esc(h.from)}</div>` : ""}<div class="ho-wax"></div><div class="ho-roll"></div></article>`;
      default:
        return `<article class="ho ho-letter era-${e}">${h.date ? `<div class="ho-date">${esc(h.date)}</div>` : ""}${h.to ? `<div class="ho-to">${esc(h.to)}</div>` : ""}<div class="ho-body">${body}</div>${h.from ? `<div class="ho-sign">${esc(h.from)}</div>` : ""}</article>`;
    }
  }

  /* ---- a database kept in this browser, for a page opened where there is none (a file on this computer, or claude.ai
          signed out). It answers the same calls as the page's database; windows of the same browser hear each other at once */
  A.localDb = function (key) {
    const data = {}, subs = [], lk = c => key + "-t-" + c, copy = o => o === undefined ? undefined : JSON.parse(JSON.stringify(o));
    const bc = typeof BroadcastChannel === "function" ? new BroadcastChannel("atlas-" + key) : null;
    const load = c => { if (!(c in data)) { try { data[c] = JSON.parse(localStorage.getItem(lk(c)) || "{}") || {}; } catch (e) { data[c] = {}; } } return data[c]; };
    const save = c => { try { localStorage.setItem(lk(c), JSON.stringify(data[c] || {})); } catch (e) {} };
    const fire = c => subs.forEach(s => { if (s.c === c) try { s.f(); } catch (e) { console.warn("atlas", e); } });
    function write(kind, c, id, body) {
      const col = load(c);
      if (kind === "set") col[id] = copy(body) || {}; else if (kind === "update") col[id] = Object.assign({}, col[id] || {}, copy(body) || {}); else delete col[id];
      save(c); fire(c);
      if (bc) bc.postMessage({ coll: c, id, data: col[id] === undefined ? null : col[id] });
      return Promise.resolve();
    }
    // a whole collection from a window that holds the real database (or that opened this one)
    const replace = (c, all) => { data[c] = copy(all) || {}; save(c); fire(c); };
    if (bc) bc.onmessage = e => { const m = e.data || {}; if (!m.coll) return; if (m.all) replace(m.coll, m.all); else { const col = load(m.coll); if (m.data == null) delete col[m.id]; else col[m.id] = m.data; save(m.coll); fire(m.coll); } };
    const docRef = (c, id) => {
      const snap = () => { const x = load(c)[id]; return { id, exists: x !== undefined, data: () => copy(x) }; };
      return { id, set: b => write("set", c, id, b), update: b => write("update", c, id, b), delete: () => write("delete", c, id), get: () => Promise.resolve(snap()), onSnapshot(cb) { const s = { c, f: () => cb(snap()) }; subs.push(s); setTimeout(s.f, 0); return () => subs.splice(subs.indexOf(s), 1); } };
    };
    const collRef = c => {
      const snap = () => { const col = load(c); return { docs: Object.keys(col).map(id => ({ id, exists: true, data: () => copy(col[id]) })) }; };
      return { doc: id => docRef(c, id), get: () => Promise.resolve(snap()), onSnapshot(cb) { const s = { c, f: () => cb(snap()) }; subs.push(s); setTimeout(s.f, 0); return () => subs.splice(subs.indexOf(s), 1); } };
    };
    return { local: true, collection: collRef, doc: p => { const s = String(p).split("/"); return docRef(s[0], s[1]); }, replace };
  };

  /* ---- the table's store: what the referee changes reaches every open window of the page, the players' screen too.
          It is the page's database (claude.ai, or the Atlas app), else the one kept in this browser. A players' screen
          opened from this page as a new window may not reach either (a browser keeps a framed page's storage apart),
          so this window also tells the windows it opened, and passes on what they write. */
  function makeStore(dbp, key) {
    const cache = {}, subs = {}, peers = new Set(), open = new Set(); let db = null;
    const W = typeof window !== "undefined" ? window : null;
    const bc = typeof BroadcastChannel === "function" ? new BroadcastChannel("atlas-" + key) : null;
    const emit = coll => (subs[coll] || []).forEach(f => { try { f(cache[coll] || {}); } catch (e) { console.warn("atlas", e); } });
    const tell = (w, msg) => { try { if (w.closed) { peers.delete(w); return; } w.postMessage(Object.assign({ atlasT: key }, msg), "*"); } catch (e) { peers.delete(w); } };
    const share = coll => {
      const all = cache[coll] || {};
      if (db && !db.local) { try { localStorage.setItem(key + "-t-" + coll, JSON.stringify(all)); } catch (e) {} if (bc) bc.postMessage({ coll, all }); }
      peers.forEach(w => tell(w, { coll, all }));
    };
    const write = (coll, id, data) => { if (!db) return Promise.resolve(); const ref = db.collection(coll).doc(id); return Promise.resolve(data == null ? ref.delete() : ref.set(data)).catch(e => console.warn("atlas: not saved", e)); };
    // a window that holds the real database passes on what a window without one writes
    if (bc) bc.addEventListener("message", e => { const m = e.data || {}; if (m.coll && !m.all && db && !db.local) write(m.coll, m.id, m.data); });
    if (W) W.addEventListener("message", e => {
      const m = e.data; if (!m || m.atlasT !== key) return;
      if (peers.has(e.source)) {                                   // from a window this one opened: its "hello", or a note it wrote
        if (m.hello) Object.keys(cache).forEach(c => tell(e.source, { coll: c, all: cache[c] }));
        else if (m.coll && !m.all) store.set(m.coll, m.id, m.data);
      } else if (W.opener && e.source === W.opener && m.coll && m.all) {   // from the window that opened this one
        if (db && db.local) db.replace(m.coll, m.all); else if (!db) { cache[m.coll] = m.all; emit(m.coll); }
      }
    });
    const ready = Promise.resolve(dbp).then(d => { db = d || null; return db; }).catch(() => null);
    if (W && W.opener) ready.then(() => { try { W.opener.postMessage({ atlasT: key, hello: 1 }, "*"); } catch (e) {} });
    const store = {
      ready,
      local: () => !db || !!db.local,
      addPeer(w) { if (w) { peers.add(w); } },
      watch(coll, fn) {
        (subs[coll] = subs[coll] || []).push(fn);
        if (open.has(coll)) { fn(cache[coll] || {}); return; }
        open.add(coll); cache[coll] = cache[coll] || {};
        ready.then(d => {
          if (!d) { emit(coll); return; }
          try { d.collection(coll).onSnapshot(s => { cache[coll] = Object.fromEntries(s.docs.map(x => [x.id, x.data() || {}])); emit(coll); share(coll); }, e => console.warn("atlas", coll, e)); } catch (e) { console.warn("atlas", e); }
        });
      },
      get: (coll, id) => id == null ? (cache[coll] || {}) : (cache[coll] || {})[id],
      set(coll, id, data) {
        cache[coll] = Object.assign({}, cache[coll] || {});
        if (data == null) delete cache[coll][id]; else cache[coll][id] = data;
        emit(coll);
        if (W && W.opener && (!db || db.local)) { try { W.opener.postMessage({ atlasT: key, coll, id, data: data == null ? null : data }, "*"); } catch (e) {} }
        return ready.then(() => write(coll, id, data));
      }
    };
    return store;
  }

  /* ---- fog of war: a place's players' map with only the rooms the referee has opened. For the players' screen the
          fog is solid; for the referee's own view it is a veil, and each room can be clicked open or shut */
  function fogSVG(id, fi, open, forPlayers) {
    const M = A.get(id), F = M.floors[fi]; if (!F) return "";
    let s = A.svg(id, fi, "player", "f" + (A.state.n++));
    const C = A.C, side = 10, top = 40, bot = 30, W = F.w * C, H = F.h * C, pad = C * .45, set = new Set(open || []), mid = "fog" + (A.state.n++);
    let holes = `<rect x="${-side}" y="${-top}" width="${W + side * 2}" height="${top - 2}" fill="#000"/>`, hits = "";
    const seen = new Set();
    for (const r of F.R) {
      const [rid, x, y, w, h, name, kind, o = {}] = r;
      if (o.h || A.isSolid(kind)) continue;
      if (set.has(rid)) holes += `<rect x="${x * C - pad}" y="${y * C - pad}" width="${w * C + pad * 2}" height="${h * C + pad * 2}" fill="#000"/>`;
      if (!forPlayers) hits += `<rect class="fog-hit${set.has(rid) ? " on" : ""}" data-fogroom="${esc(rid)}" x="${x * C}" y="${y * C}" width="${w * C}" height="${h * C}"><title>${esc((name || rid) + (set.has(rid) ? ": shown to the players (click to hide)" : ": hidden from the players (click to show)"))}</title></rect>`;
      seen.add(rid);
    }
    const fog = `<defs><mask id="${mid}"><rect x="${-side}" y="${-top}" width="${W + side * 2}" height="${H + top + bot}" fill="#fff"/>${holes}</mask></defs><rect x="${-side}" y="${-top}" width="${W + side * 2}" height="${H + top + bot}" fill="${forPlayers ? "#0b0c0d" : "#1d1f24"}" opacity="${forPlayers ? 1 : .55}" mask="url(#${mid})" pointer-events="none"/>`;
    return s.replace(/<\/svg>$/, fog + hits + "</svg>");
  }

  /* ---- dice */
  function roll(expr) {
    const m = /^\s*(\d*)\s*d\s*(\d+|%)\s*(?:([+-])\s*(\d+))?\s*$/i.exec(String(expr || "")); if (!m) return null;
    const n = Math.min(50, +m[1] || 1), sides = m[2] === "%" ? 100 : +m[2], add = m[3] ? (m[3] === "-" ? -1 : 1) * +m[4] : 0;
    const dice = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sides));
    return { expr: `${n}d${sides}${add ? (add > 0 ? "+" : "") + add : ""}`, dice, total: dice.reduce((a, b) => a + b, 0) + add };
  }
  // a roll against a skill, as Call of Cthulhu reads it: extreme, hard, regular, a failure or a fumble
  function skillRoll(skill) {
    const r = 1 + Math.floor(Math.random() * 100), s = Math.max(1, Math.min(99, +skill || 50));
    const how = r === 1 ? "Critical!" : (r === 100 || (s < 50 && r >= 96)) ? "Fumble" : r <= Math.floor(s / 5) ? "Extreme success" : r <= Math.floor(s / 2) ? "Hard success" : r <= s ? "Regular success" : "Failure";
    return { roll: r, skill: s, how };
  }
  function rollTable(list) { const items = (list || []).filter(Boolean); return items.length ? items[Math.floor(Math.random() * items.length)] : ""; }

  /* ---- a person on demand: a name of the story's people and age, a look, a manner, a want, a secret */
  const NAMES = {
    english: ["Albert Arthur Charles Edmund Frederick George Harold Henry Jack James John Joseph Matthew Oliver Percy Robert Samuel Thomas Walter William", "Ada Agnes Alice Annie Beatrice Clara Edith Eliza Ellen Emily Florence Grace Harriet Ivy Lilian Mabel Martha Mary Rose Violet", "Abbott Archer Ashdown Barker Blackwood Brewer Carter Cole Crane Dawson Ellis Fletcher Gale Harding Hale Hollis Kemp Lowe Marsh Mercer Moss Pike Reeve Rook Sexton Shaw Slater Thorne Wren"],
    american: ["Abe Billy Calvin Earl Eddie Elmer Frank Harlan Hank Jesse Lou Mack Otis Ray Roy Sam Silas Walt Wes Woody", "Betty Bonnie Dolores Edna Ethel Flo Gloria Hazel Irene June Lottie Mae Mildred Myrtle Opal Pearl Ruth Sadie Thelma Vera", "Barlow Boone Calhoun Carver Dalton Doyle Fenton Garrett Hollister Kincaid Loomis Maddox Mercer Pruitt Quaid Ritter Sawyer Stokes Tanner Whitaker"],
    french: ["Alain André Antoine Claude Émile Étienne Gaston Henri Jacques Jules Laurent Louis Marcel Maurice Olivier Paul Pierre René Victor Yves", "Adèle Amélie Camille Céleste Claire Colette Élise Hélène Isabelle Jeanne Juliette Louise Madeleine Marguerite Marie Odette Simone Sophie Suzanne Yvonne", "Arnaud Bernard Blanchard Bonnet Chevalier Dubois Dufour Durand Fournier Gauthier Girard Lambert Leclerc Lefèvre Marchand Mercier Moreau Perrin Renard Rousseau"],
    german: ["Anton Bruno Dieter Ernst Franz Friedrich Georg Hans Heinrich Karl Klaus Konrad Kurt Ludwig Max Otto Paul Rudolf Werner Wilhelm", "Anna Berta Clara Elsa Emma Erika Frieda Gerda Greta Hanna Helga Hilde Ilse Klara Lotte Margarete Marta Paula Rosa Ursula", "Bauer Becker Braun Fischer Frank Hartmann Hoffmann Keller Klein Koch Krause Lang Meyer Neumann Richter Schmidt Schneider Schulz Vogel Wagner"],
    polish: ["Adam Andrzej Bolesław Czesław Feliks Henryk Jan Józef Kazimierz Marek Mieczysław Paweł Piotr Stanisław Stefan Tadeusz Tomasz Władysław Wojciech Zygmunt", "Agnieszka Anna Barbara Bronisława Danuta Elżbieta Halina Helena Irena Jadwiga Janina Krystyna Maria Stanisława Teresa Wanda Zofia Zuzanna Genowefa Leokadia", "Dąbrowski Grabowski Jankowski Kamiński Kowalczyk Kowalski Kozłowski Lewandowski Mazur Nowak Nowicki Pawlak Sikora Szymański Wiśniewski Wójcik Wróbel Zając Zieliński Krawczyk"],
    italian: ["Alberto Antonio Carlo Enrico Ettore Francesco Giacomo Giovanni Giuseppe Luca Luigi Marco Matteo Paolo Piero Renzo Roberto Salvatore Tommaso Vittorio", "Agnese Angela Bianca Carla Caterina Chiara Elena Franca Giulia Isabella Lucia Maria Marta Paola Rosa Sofia Teresa Vittoria Anna Lina", "Bianchi Bruno Colombo Conti Costa De Luca Esposito Ferrari Fontana Gallo Greco Lombardi Marino Moretti Ricci Rinaldi Romano Rossi Russo Villa"],
    spanish: ["Alejandro Andrés Carlos Diego Emilio Enrique Felipe Fernando Ignacio Javier Joaquín Jorge José Juan Luis Manuel Miguel Pablo Rafael Tomás", "Ana Beatriz Carmen Catalina Consuelo Dolores Elena Inés Isabel Lucía Luisa Manuela Mercedes Pilar Rosa Rosario Sofía Teresa Victoria Ángela", "Alonso Álvarez Castro Delgado Díaz Fernández García Gómez González Herrera Jiménez López Martín Morales Navarro Ortega Ramos Romero Ruiz Torres"],
    russian: ["Aleksei Andrei Boris Dmitri Fyodor Grigori Igor Ivan Konstantin Leonid Mikhail Nikolai Oleg Pavel Pyotr Sergei Vasili Viktor Vladimir Yuri", "Anastasia Anna Daria Ekaterina Elena Galina Irina Ksenia Larisa Lidia Lyudmila Maria Natalia Nina Olga Svetlana Tatiana Vera Yelena Zoya", "Belov Bogdanov Volkov Vorobyov Golubev Zaitsev Ivanov Kozlov Kuznetsov Lebedev Morozov Novikov Orlov Pavlov Petrov Popov Smirnov Sokolov Fedorov Egorov"],
    arabic: ["Ahmad Ali Amir Bilal Faisal Farid Hamza Hassan Ibrahim Idris Jamal Karim Khalid Mahmoud Mustafa Nasser Omar Rashid Salim Tariq", "Aisha Amira Dalia Fatima Hala Hana Jamila Layla Leila Lina Mariam Maryam Nadia Noor Rania Salma Samira Yasmin Zainab Zahra", "al-Amin al-Farsi al-Hashimi al-Jabiri al-Khatib al-Masri al-Najjar al-Qadi al-Rashid al-Sayed Haddad Karam Mansour Nassar Saleh Sabbagh Tamimi Yousef Zaid Halabi"],
    japanese: ["Akira Daichi Haruto Hiroshi Isamu Jiro Kaito Kenji Kenta Makoto Masato Noboru Osamu Ren Ryo Satoshi Shin Takeshi Taro Yuto", "Aiko Akane Emi Fumiko Hana Haruka Hina Keiko Kumiko Mai Mariko Michiko Nanami Rin Sakura Sayuri Setsuko Tomoko Yui Yuki", "Abe Fujita Hayashi Inoue Ishikawa Ito Kato Kimura Kobayashi Matsumoto Mori Nakamura Ogawa Saito Sasaki Suzuki Takahashi Tanaka Watanabe Yamamoto"],
    georgian: ["Davit Giorgi Irakli Levan Luka Nika Nikoloz Revaz Shota Sandro Tornike Vakhtang Zurab Gela Mamuka Archil Teimuraz Lasha Otar Beka", "Ana Eka Elene Keti Khatia Lika Maia Mariam Natia Nino Salome Sopo Tamar Tamuna Tea Nana Lela Manana Ketevan Ia", "Beridze Chkheidze Gelashvili Japaridze Kapanadze Khutsishvili Lomidze Maisuradze Mamaladze Nozadze Shengelia Tsiklauri Gogoladze Bolkvadze Abashidze Kvaratskhelia Tsereteli Dadiani Orbeliani Kiknadze"]
  };
  const FANTASY = [["Ael", "Bran", "Cor", "Dra", "El", "Fen", "Gal", "Hal", "Is", "Kel", "Lor", "Mor", "Nyl", "Or", "Ryn", "Syl", "Thal", "Ul", "Vae", "Wyn"], ["a", "e", "i", "o", "ar", "en", "or", "is", "an", "el", "ith", "un"], ["dor", "wyn", "mir", "ric", "las", "thas", "wen", "dil", "mar", "rin", "na", "ra"]];
  const FUTURE = ["Ada Okafor", "Bram Tellis", "Ines Varga", "Joss Hale", "Kai Moreau", "Lena Sato", "Mira Halvorsen", "Nika Abara", "Oren Vasquez", "Pell Ndiaye", "Quinn Ashby", "Ravi Kade", "Suki Lindqvist", "Tomas Erdem", "Uma Castellanos", "Vex Oduya", "Wren Takahashi", "Yara Petrov", "Zeke Mbeki", "Ilse Novak"];
  const TRAITS = {
    look: ["a scar through one eyebrow", "ink-stained fingers", "a coat a size too large", "very clean boots and nothing else clean", "a missing front tooth", "grey at the temples, young everywhere else", "a nervous habit of touching a ring", "spectacles mended with thread", "a voice far too deep for their size", "a limp they hide well", "burn marks on both hands", "a mourning band on the sleeve", "perfectly still hands", "a smell of tobacco and rain", "a bright scarf at odds with everything else", "eyes that never settle", "a soldier's posture", "freckles and a sunburnt nose", "a tremor in the left hand", "a gold tooth they show off", "hair cut very short, recently", "a child's drawing pinned inside the coat", "rings on every finger", "the pallor of someone who works at night"],
    manner: ["answers questions with questions", "laughs at the wrong moments", "overly polite, then suddenly rude", "talks to their animal more than to people", "can't stop eating", "whispers everything, even the weather", "corrects everyone's grammar", "agrees with everything, means none of it", "tells the same joke twice", "watches the door the whole time", "names everyone 'friend'", "never says a name aloud", "hums when nervous", "keeps checking a watch", "insists on paying for everything", "pretends not to hear", "quotes scripture or poetry", "boasts about a relative", "very slow, very careful", "can't sit still"],
    want: ["to be left alone", "money, today", "news of a missing brother", "to leave town before Friday", "revenge on a former employer", "someone to believe them", "a drink and a listener", "to sell something they shouldn't have", "a place in a better household", "to protect a secret lover", "to impress their superior", "the name of whoever robbed them", "to get the party out of here quickly", "a favour they can call in later", "to find a lost letter", "to pay off a debt quietly"],
    secret: ["owes money to dangerous people", "saw something last night and is lying about it", "is not who they say they are", "has a key they should not have", "is informing for someone", "is sleeping with their employer's spouse", "stole from the last place they worked", "was there when it happened", "is related to the victim", "is terrified of the cellar, and knows why", "has read the book everyone is looking for", "is ill and hiding it", "writes letters to someone who is dead", "is planning to run tonight"],
    trade: {
      victorian: ["cabman", "maid of all work", "pawnbroker", "constable", "costermonger", "clerk", "governess", "publican", "dock labourer", "lamplighter", "curate", "seamstress", "chemist", "rag-and-bone man", "telegraph boy"],
      "1920s": ["bootlegger", "nurse", "reporter", "porter", "jazz pianist", "shopgirl", "patrolman", "professor's assistant", "garage mechanic", "switchboard operator", "librarian", "hotel clerk", "private detective", "farmhand", "radio repairman"],
      medieval: ["ostler", "miller", "pilgrim", "reeve", "alewife", "monk", "fletcher", "tanner", "watchman", "midwife", "scribe", "herdsman", "pedlar", "smith", "serving girl"],
      fantasy: ["innkeeper", "hedge wizard", "guard", "acolyte", "fence", "bard", "ranger", "alchemist's apprentice", "stablehand", "tax collector", "fortune teller", "dwarven smith", "rat catcher", "cartographer", "retired adventurer"],
      modern: ["barista", "security guard", "nurse", "taxi driver", "IT contractor", "teacher", "estate agent", "line cook", "journalist", "police officer", "student", "night manager", "paramedic", "delivery rider", "pharmacist"],
      future: ["cargo loader", "hydroponics tech", "station medic", "comms officer", "drone pilot", "life-support engineer", "quartermaster", "security contractor", "xenobotanist", "navigator", "bartender", "mining foreman", "ship's cook", "data broker", "chaplain"]
    }
  };
  function culture() {
    const c = A.config || {}; if (c.people && NAMES[c.people]) return c.people; if (c.people === "fantasy" || c.people === "future") return c.people;
    const e = era(); if (e === "fantasy") return "fantasy"; if (e === "future") return "future";
    const rg = A.cityData && A.cityData.region, said = [c.setting, c.title, c.subtitle].join(" ").toLowerCase();
    for (const [k, words] of [["polish", /poland|polish|krak|warsaw|auschwitz|oświęcim/], ["german", /german|berlin|munich|bavaria|vienna|austria/], ["french", /france|french|paris|lyon|marseille/], ["italian", /ital|florence|rome|venice|milan|naples/], ["spanish", /spain|spanish|madrid|seville|barcelona|mexico/], ["russian", /russia|moscow|petersburg|siberia/], ["arabic", /arab|egypt|cairo|baghdad|dubai|damascus|morocco/], ["japanese", /japan|tokyo|kyoto|osaka/], ["georgian", /georgia|tbilisi|batumi|kutaisi/], ["american", /america|new york|boston|arkham|chicago|texas|california|usa/]]) if (words.test(said)) return k;
    if (rg === "mediterranean") return "italian"; if (rg === "desert") return "arabic"; if (rg === "eastasia") return "japanese";
    return "english";
  }
  function personNow() {
    const cu = culture(), pick = a => a[Math.floor(Math.random() * a.length)], e = era();
    let name;
    if (cu === "fantasy") name = (pick(FANTASY[0]) + pick(FANTASY[1]) + pick(FANTASY[2])) + " " + pick(["of the Vale", "Ironhand", "Ashby", "Thornwood", "the Younger", "Greycloak", "Marsh", "Brightwater", "", ""]);
    else if (cu === "future") name = pick(FUTURE).split(" ")[0] + " " + pick(FUTURE).split(" ")[1];
    else { const [m, f, s] = NAMES[cu].map(x => x.split(" ")); name = (Math.random() < .5 ? pick(m) : pick(f)) + " " + pick(s); }
    return { name: name.trim(), trade: pick(TRAITS.trade[e] || TRAITS.trade.victorian), look: pick(TRAITS.look), manner: pick(TRAITS.manner), want: pick(TRAITS.want), secret: pick(TRAITS.secret) };
  }

  /* ---- the conspiracy board: people, places and clues pinned to cork, with string between them. The referee sees all
          of it; the players' board holds only what the party has found (or the referee pins up for them) */
  function boardModel() {
    const nodes = [], edges = [], byId = {}, add = n => { if (!byId[n.id]) { byId[n.id] = n; nodes.push(n); } return byId[n.id]; };
    const cast = A.castData || {}, name = c => (c && c.n) || "";
    for (const [cid, c] of Object.entries(cast)) add({ id: "p:" + cid, kind: "person", title: name(c), sub: c.role || "" });
    for (const id of A.order || []) {
      const m = A.meta[id] || {}; if ((m.tier || 3) > 2 && !(A.maps[id])) continue;
      add({ id: "l:" + id, kind: "place", title: m.name || id, sub: m.region || "", place: id });
      if (!A.maps[id]) continue;
      const M = A.get(id, 99);
      for (const [k, c] of Object.entries(M.clues || {})) {
        const to = [].concat(c.to || []).filter(t => A.meta[t] && t !== id); if (!to.length) continue;
        const n = add({ id: "c:" + id + "." + k, kind: "clue", title: c.t || k, sub: "", place: id, clue: k });
        edges.push({ a: n.id, b: "l:" + id, kind: "at" });
        for (const t of to) { add({ id: "l:" + t, kind: "place", title: (A.meta[t] || {}).name || t, sub: (A.meta[t] || {}).region || "", place: t }); edges.push({ a: n.id, b: "l:" + t, kind: "lead" }); }
      }
      for (const n of Object.values(M.npcs || {})) if (n.who && cast[n.who]) edges.push({ a: "p:" + n.who, b: "l:" + id, kind: "at", place: id });
    }
    for (const [cid, c] of Object.entries(cast)) if (c.ties && typeof c.ties === "object") for (const to of Object.keys(c.ties)) { const t = cast[to] ? to : Object.keys(cast).find(k => name(cast[k]).toLowerCase() === to.toLowerCase()); if (t && t !== cid && !edges.some(e => (e.a === "p:" + t && e.b === "p:" + cid))) edges.push({ a: "p:" + cid, b: "p:" + t, kind: "tie", text: c.ties[to] }); }
    return { nodes, edges: edges.filter(e => byId[e.a] && byId[e.b]), byId };
  }
  // how big the board is: room for its cards, wider than tall
  const boardSize = n => { const W = Math.max(1000, Math.min(2400, 250 * Math.ceil(Math.sqrt(n * 1.7)))); return [W, Math.round(W * .62)]; };
  // where each card starts: spring and push (Fruchterman and Reingold), then cards that still overlap are pushed apart.
  // The same every time, so the board does not jump between visits.
  function boardLayout(model, W, H) {
    const pos = {}, N = model.nodes, n = N.length || 1, k = Math.min(260, Math.sqrt((W * H) / n) * .8), CW = 150, CH = 86;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const band = { person: .18, place: .5, clue: .8 }, rows = {};
    for (const nd of N) (rows[nd.kind] = rows[nd.kind] || []).push(nd);
    for (const [kind, list] of Object.entries(rows)) list.forEach((nd, i) => { pos[nd.id] = [W * (i + .5) / list.length + (rnd() - .5) * 40, H * (band[kind] || .5) + (rnd() - .5) * H * .12]; });
    const idx = Object.fromEntries(N.map((nd, i) => [nd.id, i])), clampX = x => Math.max(CW / 2 + 10, Math.min(W - CW / 2 - 10, x)), clampY = y => Math.max(CH / 2 + 10, Math.min(H - CH / 2 - 10, y));
    const g = .45 * Math.sqrt(Math.max(1, n / 10));   // a bigger board pulls harder to its middle, or the cards with no string end up on its edges
    for (let it = 0, t = W / 8; it < 260; it++, t *= .985) {
      const f = N.map(() => [0, 0]);
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
        const a = pos[N[i].id], b = pos[N[j].id]; let dx = a[0] - b[0], dy = a[1] - b[1]; const d = Math.max(1, Math.hypot(dx, dy)), r = k * k / d;
        dx /= d; dy /= d; f[i][0] += dx * r; f[i][1] += dy * r; f[j][0] -= dx * r; f[j][1] -= dy * r;
      }
      for (const e of model.edges) {
        const i = idx[e.a], j = idx[e.b], a = pos[e.a], b = pos[e.b], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.max(1, Math.hypot(dx, dy)), w = e.kind === "at" ? .5 : 1, r = w * d * d / k;
        f[i][0] += dx / d * r; f[i][1] += dy / d * r; f[j][0] -= dx / d * r; f[j][1] -= dy / d * r;
      }
      N.forEach((nd, i) => { const p = pos[nd.id]; f[i][0] += (W / 2 - p[0]) * g; f[i][1] += (H / 2 - p[1]) * g * 1.5; });   // a pull to the middle, so a card with no string stays near the rest
      N.forEach((nd, i) => { const p = pos[nd.id], m = Math.hypot(f[i][0], f[i][1]) || 1, s = Math.min(m, t) / m; p[0] = clampX(p[0] + f[i][0] * s); p[1] = clampY(p[1] + f[i][1] * s); });
    }
    for (let it = 0; it < 200; it++) {           // no card on top of another (pushed apart the shorter way, then either way)
      let moved = false;
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
        const a = pos[N[i].id], b = pos[N[j].id], ox = CW - Math.abs(a[0] - b[0]), oy = CH - Math.abs(a[1] - b[1]);
        if (ox <= 0 || oy <= 0) continue; moved = true;
        if (ox < oy && it < 60) { const s = (a[0] < b[0] ? -1 : 1) * ox / 2; a[0] = clampX(a[0] + s); b[0] = clampX(b[0] - s); } else if (it >= 60 && it % 2) { const s = (a[0] < b[0] || (a[0] === b[0] && i < j) ? -1 : 1) * (ox / 2 + 1); a[0] = clampX(a[0] + s); b[0] = clampX(b[0] - s); } else { const s = (a[1] < b[1] ? -1 : 1) * oy / 2; a[1] = clampY(a[1] + s); b[1] = clampY(b[1] - s); }
      }
      if (!moved) break;
    }
    // the cards as a whole in the middle of the board
    const xs = N.map(nd => pos[nd.id][0]), ys = N.map(nd => pos[nd.id][1]), dx = W / 2 - (Math.min(...xs) + Math.max(...xs)) / 2, dy = H / 2 - (Math.min(...ys) + Math.max(...ys)) / 2;
    if (N.length) for (const nd of N) { pos[nd.id][0] = clampX(pos[nd.id][0] + dx); pos[nd.id][1] = clampY(pos[nd.id][1] + dy); }
    return pos;
  }
  // what the players may see of a person's role: its plain part (what follows a semicolon, a dash or a bracket is often the secret)
  const plainRole = r => String(r || "").split(/\s*[;—(]\s*|\s+-\s+/)[0].trim();
  const PERSON_SIL = `<svg viewBox="0 0 40 46" aria-hidden="true"><rect width="40" height="46" fill="#cfc6b2"/><circle cx="20" cy="17" r="8" fill="#5a5148"/><path d="M5 46 C6 32 13 28 20 28 C27 28 34 32 35 46 Z" fill="#5a5148"/></svg>`;
  // the board, drawn: cards on cork with red string for leads, black for ties, grey to where things are found
  function boardHTML(model, pos, show, W, H, gm) {
    const vis = id => gm || show(id);
    const edges = model.edges.filter(e => vis(e.a) && vis(e.b)).map(e => {
      const a = pos[e.a], b = pos[e.b]; if (!a || !b) return "";
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + Math.min(40, Math.hypot(b[0] - a[0], b[1] - a[1]) * .12);
      return `<path class="bd-str ${e.kind}" d="M${a[0].toFixed(0)} ${a[1].toFixed(0)} Q${mx.toFixed(0)} ${my.toFixed(0)} ${b[0].toFixed(0)} ${b[1].toFixed(0)}"/>`;
    }).join("");
    const cards = model.nodes.filter(n => vis(n.id)).map(n => {
      const p = pos[n.id] || [W / 2, H / 2], rot = ((n.id.length * 37) % 9) - 4;
      return `<div class="bd-card ${n.kind}${gm && !show(n.id) ? " secret" : ""}" data-bd="${esc(n.id)}" style="left:${p[0].toFixed(0)}px;top:${p[1].toFixed(0)}px;--r:${rot}deg">${n.kind === "person" ? PERSON_SIL : ""}<b>${esc(n.title)}</b>${n.sub ? `<span>${esc(gm || n.kind !== "person" ? n.sub : plainRole(n.sub))}</span>` : ""}<i class="bd-pin"></i></div>`;
    }).join("");
    return `<div class="bd" style="width:${W}px;height:${H}px"><svg class="bd-strings" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${edges}</svg>${cards}</div>`;
  }

  // what the players' board shows: clues found and places known, and whatever the referee pins up or takes down
  const foundIn = st => id => {
    const sh = ((st.get("board", "show") || {}).ids) || {};
    if (id in sh) return !!sh[id];
    if (id.startsWith("c:")) { const s = id.slice(2), i = s.lastIndexOf("."); return ((((st.get("clues", s.slice(0, i)) || {}).done) || [])).includes(s.slice(i + 1)); }
    if (id.startsWith("l:")) { const v = (st.get("status", id.slice(2)) || {}).status; return !!v && v !== "unknown"; }
    return false;
  };
  const SAFETY_NOTE = "Anyone can say \"let's skip that\" at any time, or press Stop in the players' window: the game moves on, and nobody has to explain why.";

  /* ---- the players' window: this page opened with #players (or made so in this window). Everything on it is the
          players': what the referee sends to the table, the handouts they have been given, their board, the places they
          know (with only the rooms they have seen), their notes, and the Stop card. Nothing of the referee's is on it:
          the user asked (21 Oct 2026) for the referee's tools and the players' to be in separate windows. On a
          television it stays on The table, and its menu fades until the mouse moves. */
  const STATUS_WORDS = { rumoured: "Heard of", known: "Known", open: "Open to us", resolved: "Finished", closed: "Closed" };
  A.playersScreen = function (ctx) {
    const app = document.getElementById("app"), cfg = A.config, st = ctx.store;
    document.documentElement.dataset.theme = "dark"; app.dataset.mode = "player"; app.classList.add("ps-wrap");
    document.title = (cfg.title || "Campaign") + ": the players' window";
    // a window opened for the players has no way back to the referee's page; only the referee's own window, made into
    // theirs with "Make this window the players' screen", has one (and asks twice)
    const mine = (() => { try { return sessionStorage.getItem(cfg.storageKey + "-players") === "1"; } catch (e) { return false; } })();
    const TABS = [["table", "The table", "screen"], ["handouts", "Handouts", "handout"], ["board", "Our board", "board"], ["places", "Places", "map"], ["notes", "Our notes", "tonight"]];
    app.innerHTML = `<div class="ps" data-tab="table">
      <div class="ps-stage" id="psStage"></div>
      <main class="ps-page" id="psPage" hidden></main>
      <nav class="ps-menu" aria-label="The players' window">${TABS.map(([k, l, ic]) => `<button type="button" class="ps-tab" data-ptab="${k}" aria-pressed="${k === "table"}">${icon(ic)}<span>${l}</span><b class="ps-badge" hidden></b></button>`).join("")}
        <span class="ps-sep" aria-hidden="true"></span>
        <button type="button" class="ps-btn" data-ps="full" title="Full screen" aria-label="Full screen">⤢</button>
        <button type="button" class="ps-x" data-ps="x" title="Touch this if you want what is happening to stop. No need to explain.">✕<span>Stop</span></button>
        ${mine ? `<button type="button" class="ps-btn ps-back" data-ps="back" title="Back to the game master's page (click twice)" aria-label="Back to the game master's page">⌂</button>` : ""}</nav>
      <div class="ps-toast" hidden><span></span><button type="button" data-ptab="table">Look</button></div></div>`;
    const root = app.querySelector(".ps"), stage = app.querySelector("#psStage"), page = app.querySelector("#psPage");
    let now = { kind: "title" }, world = null, tab = "table", first = true;
    const pref = { get(k) { try { return localStorage.getItem(cfg.storageKey + "-p-" + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(cfg.storageKey + "-p-" + k, v); } catch (e) {} } };
    const fit = () => { const el = stage.firstElementChild; if (!el || !el.classList.contains("ps-fit")) return; const w = el.offsetWidth, h = el.offsetHeight, s = Math.min(stage.clientWidth * .94 / w, stage.clientHeight * .86 / h, 3); el.style.transform = `translate(-50%, -50%) scale(${s})`; };
    const when = t => new Date(t || 0).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const placeName = id => (A.meta[id] || {}).name || id;
    // what is on the table, in the players' words
    const nowWords = d => ({ map: "the map of " + placeName(d.place), handout: "a handout", person: d.name || "someone", scene: d.title || "words to read", world: "the world map", board: "your board", safety: "the lines and veils", blank: "nothing" })[d.kind] || "the title";

    /* the table: what the referee sends */
    function render() {
      if (world && now.kind !== "world") { world.dispose(); world = null; }
      const k = now.kind;
      if (k === "map" && now.fly && !A.maps[now.place] && A.table.flyPlace) A.table.flyPlace(now.fly);
      if (k === "map" && A.maps[now.place]) {
        const fog = st.get("fog", now.place) || {}, fi = +now.floor || 0;
        stage.innerHTML = `<div class="ps-map">${fogSVG(now.place, fi, (fog.f || {})[fi] || [], true)}</div>`;
      } else if (k === "handout") {
        const h = allHandouts().find(x => x.id === now.id) || (now.h || null);
        stage.innerHTML = h ? `<div class="ps-fit">${handoutHTML(h)}</div>` : "";
      } else if (k === "person") {
        stage.innerHTML = `<div class="ps-fit"><div class="ps-person">${PERSON_SIL}<h2>${esc(now.name || "A stranger")}</h2>${now.role ? `<p class="ps-role">${esc(now.role)}</p>` : ""}${now.look ? `<p>${esc(now.look)}</p>` : ""}</div></div>`;
      } else if (k === "scene") {
        stage.innerHTML = `<div class="ps-fit"><div class="ps-scene">${now.title ? `<h2>${esc(now.title)}</h2>` : ""}${paras(now.text)}</div></div>`;
      } else if (k === "world" && A.worldMount && A.worldData) {
        if (!world) { stage.innerHTML = `<div class="ps-world"></div>`; world = A.worldMount(stage.firstChild, { mode: () => "player", placesAt: () => [], peopleAt: () => [], leadsInto: () => [], hasCity: () => false, cityName: id => id, enter() {}, open() {}, db: st.ready, store: ctx.prefStore }); }
        else world.sync();
      } else if (k === "board") {
        const [model, pos, W, H] = theirBoard();
        stage.innerHTML = `<div class="ps-fit ps-board">${boardHTML(model, pos, id => ctx.found(id), W, H, false)}</div>`;
      } else if (k === "safety") {
        stage.innerHTML = `<div class="ps-fit">${safetyHTML()}</div>`;
      } else if (k === "blank") stage.innerHTML = "";
      else stage.innerHTML = `<div class="ps-fit"><div class="ps-title"><div>${esc(cfg.system || "")}</div><h1>${esc(cfg.title || "")}</h1>${cfg.strap ? `<p>${esc(cfg.strap)}</p>` : ""}</div></div>`;
      fit(); requestAnimationFrame(fit);
    }
    // the players' own board: only what they have, laid out on its own
    function theirBoard() {
      const all = boardModel(), keep = new Set(all.nodes.filter(nd => ctx.found(nd.id)).map(nd => nd.id));
      const model = { nodes: all.nodes.filter(nd => keep.has(nd.id)), edges: all.edges.filter(e => keep.has(e.a) && keep.has(e.b)) }, [W, H] = boardSize(Math.max(6, model.nodes.length));
      return [model, boardLayout(model, W, H), W, H];
    }
    function safetyHTML() {
      const z = st.get("safety", "zero") || {}, li = a => (a || []).map(x => `<li>${esc(x)}</li>`).join("");
      return `<div class="ps-scene ps-safety"><h2>At this table</h2><div class="ps-lv"><section><h3>Not in the game</h3><ul>${li(z.lines) || "<li>Nothing named yet</li>"}</ul></section><section><h3>Only off screen</h3><ul>${li(z.veils) || "<li>Nothing named yet</li>"}</ul></section></div><p>${esc(SAFETY_NOTE)}</p></div>`;
    }

    /* the players' own pages */
    const given = () => { const g = st.get("given") || {}, all = allHandouts(); return Object.entries(g).map(([id, x]) => ({ t: x.t || 0, h: all.find(h => h.id === id) || x.h || null })).filter(x => x.h).sort((a, b) => b.t - a.t); };
    function known() {
      const out = [];
      for (const id of A.order) {
        const m = A.meta[id]; if (!m || String(id).startsWith("fly-")) continue;
        const s = (st.get("status", id) || {}).status || "unknown", fog = (st.get("fog", id) || {}).f || {}, seen = Object.values(fog).some(l => (l || []).length);
        if (s === "unknown" && !seen) continue;
        out.push({ id, m, s, fog, seen });
      }
      return out;
    }
    function pageHTML() {
      switch (tab) {
        case "handouts": {
          const l = given();
          return `<h2>Handouts</h2><p class="ps-hint">Everything the game master has handed you, newest first. Read them again whenever you like.</p>${l.length ? l.map(x => `<article class="ps-ho"><div class="ps-when">${esc(when(x.t))}</div>${handoutHTML(x.h)}</article>`).join("") : `<p class="ps-empty">Nothing handed to you yet.</p>`}`;
        }
        case "board": {
          const [model, pos, W, H] = theirBoard();
          return `<h2>Our board</h2><p class="ps-hint">The people, places and clues you have found, and how they connect. The game master pins things up as you learn them.</p>${model.nodes.length ? `<div class="ps-bwrap" data-w="${W}" data-h="${H}"><div class="ps-bscale">${boardHTML(model, pos, id => ctx.found(id), W, H, false)}</div></div>` : `<p class="ps-empty">Nothing on the board yet.</p>`}`;
        }
        case "places": {
          const l = known();
          return `<h2>Places</h2><p class="ps-hint">The places you know of, what you found there, and the rooms you have seen.</p>${l.length ? l.map(({ id, m, s, fog, seen }) => {
            const M = A.maps[id] ? A.get(id, 99) : null, done = (st.get("clues", id) || {}).done || [];
            const found = M ? done.map(k => (M.clues || {})[k]).filter(Boolean).map(c => `<li>${esc(String(c.t || "").replace(/\s*\(.*\)\s*$/, ""))}</li>`).join("") : "";
            const floors = M ? M.floors.map((F, fi) => [F, fi]).filter(([F, fi]) => !A.isGmFloor(F) && (fog[fi] || []).length) : [];
            const more = s !== "rumoured" || seen;
            return `<section class="ps-place"><div class="ps-ph"><h3>${esc(m.name || id)}</h3>${m.region ? `<span class="ps-reg">${esc(m.region)}</span>` : ""}${STATUS_WORDS[s] ? `<span class="ps-st st-${s}">${STATUS_WORDS[s]}</span>` : ""}</div>
              ${more && M && M.ext ? `<p class="ps-ext">${esc(M.ext)}</p>` : ""}${found ? `<h4>What we found here</h4><ul class="ps-found">${found}</ul>` : ""}
              ${floors.map(([F, fi]) => `<figure class="ps-pmap">${fogSVG(id, fi, fog[fi], true)}</figure>`).join("")}</section>`;
          }).join("") : `<p class="ps-empty">No places yet. They appear here as you learn of them.</p>`}`;
        }
        case "notes":
          return `<h2>Our notes</h2><p class="ps-hint">What the party knows and suspects: names, theories, things to check. The game master can read these, and may add to them.</p><form class="ps-add"><textarea maxlength="2000" rows="3" placeholder="A note, a theory, a name to remember"></textarea><button type="submit">Add</button></form><div class="ps-entries"></div>`;
      }
      return "";
    }
    function paintNotes() {
      const box = page.querySelector(".ps-entries"); if (!box) return;
      const list = Object.entries(st.get("journal") || {}).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
      box.innerHTML = list.map(([id, e]) => `<div class="ps-entry${e.gm ? " gm" : ""}"><p>${esc(e.text)}</p><time>${e.gm ? "From the game master · " : ""}${esc(when(e.t))}</time><button type="button" data-jdel="${esc(id)}" aria-label="Remove this note">×</button></div>`).join("") || `<p class="ps-hint">Nothing written yet.</p>`;
    }
    function fitBoard() {
      const w = page.querySelector(".ps-bwrap"); if (!w) return;
      const W = +w.dataset.w, H = +w.dataset.h, s = Math.min(1, (w.clientWidth || W) / W), sc = w.querySelector(".ps-bscale");
      sc.style.transform = `scale(${s})`; w.style.height = Math.ceil(H * s) + "px";
    }
    function renderPage() {
      if (tab === "table") return;
      const keep = page.scrollTop;
      page.innerHTML = `<div class="ps-col">${pageHTML()}</div>`;
      if (tab === "notes") paintNotes();
      if (tab === "board") { fitBoard(); requestAnimationFrame(fitBoard); }
      page.scrollTop = keep;
    }
    function setTab(k) {
      tab = k; root.dataset.tab = k;
      root.querySelectorAll(".ps-tab").forEach(b => b.setAttribute("aria-pressed", b.dataset.ptab === k));
      stage.hidden = k !== "table"; page.hidden = k === "table";
      if (k === "table") { fit(); requestAnimationFrame(fit); if (world) world.wake && world.wake(); }
      else { page.scrollTop = 0; renderPage(); }
      if (k === "handouts") { pref.set("seen", String(Date.now())); badges(); }
      app.querySelector(".ps-toast").hidden = true;
    }
    // a count on Handouts of what has come since they last looked
    function badges() {
      const seen = +pref.get("seen") || 0, n = given().filter(x => x.t > seen).length, b = root.querySelector('[data-ptab="handouts"] .ps-badge');
      b.hidden = !n || tab === "handouts"; b.textContent = n;
    }
    const toast = (t, look) => { const el = app.querySelector(".ps-toast"); el.querySelector("span").textContent = t; el.querySelector("button").hidden = !look; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 6000); };

    st.watch("screen", d => {
      const n = d.now || { kind: "title" }, changed = (n.t || 0) !== (now.t || 0);
      now = n; render();
      if (!first && changed && tab !== "table") toast(`New on the table: ${nowWords(now)}.`, true);
      first = false;
    });
    st.watch("fog", () => { if (now.kind === "map") render(); if (tab === "places") renderPage(); });
    st.watch("board", () => { if (now.kind === "board") render(); if (tab === "board") renderPage(); });
    st.watch("safety", () => { if (now.kind === "safety") render(); });
    for (const c of ["clues", "status"]) st.watch(c, () => { if (now.kind === "board") render(); if (tab === "board" || tab === "places") renderPage(); });
    st.watch("given", () => { badges(); if (tab === "handouts") renderPage(); });
    st.watch("mapedits", d => { if (applyMapEdits(d)) { if (now.kind === "map") render(); if (tab === "places") renderPage(); } });
    st.watch("journal", () => paintNotes());
    window.addEventListener("resize", () => { fit(); fitBoard(); });

    // on The table the menu fades away until someone moves the mouse or touches the screen
    let idle = null;
    const wake = () => { root.classList.remove("idle"); clearTimeout(idle); idle = setTimeout(() => { if (tab === "table") root.classList.add("idle"); }, 5000); };
    ["mousemove", "pointerdown", "keydown", "touchstart"].forEach(ev => document.addEventListener(ev, wake, { passive: true })); wake();

    app.addEventListener("click", e => {
      const pt = e.target.closest("[data-ptab]"); if (pt) { setTab(pt.dataset.ptab); return; }
      const b = e.target.closest("[data-ps]"), jd = e.target.closest("[data-jdel]");
      if (jd) { if (jd.dataset.sure) st.set("journal", jd.dataset.jdel, null); else { jd.dataset.sure = 1; jd.textContent = "Really?"; } return; }
      if (!b) return;
      if (b.dataset.ps === "back") {          // twice, so a player does not turn the window into the referee's page by accident
        if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Back to the game master's page? Click again"; setTimeout(() => { delete b.dataset.sure; b.textContent = "⌂"; }, 4000); return; }
        try { sessionStorage.removeItem(cfg.storageKey + "-players"); } catch (e) {}
        location.hash = ""; location.reload(); return;
      }
      if (b.dataset.ps === "full") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); }
      else if (b.dataset.ps === "x") { const t = Date.now(); st.set("xcard", "now", { t }); st.set("xcard", "x" + t, { t }); toast("The game master has been told. Take a breath; the game will move on.", false); }
    });
    app.addEventListener("submit", e => {
      if (!e.target.matches(".ps-add")) return;
      e.preventDefault(); const ta = e.target.querySelector("textarea"), v = ta.value.trim().slice(0, 2000); if (!v) return;
      st.set("journal", "j" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), { text: v, t: Date.now() }); ta.value = "";
    });
    // so the referee's page can say the players' window is open and following
    const beat = () => st.set("presence", "players", { t: Date.now() });
    st.ready.then(beat); setInterval(beat, 30000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) beat(); });
  };

  /* ---- line icons for the table's tools, drawn in the text's colour */
  const IC = {
    home: `<path d="M4 11 12 4l8 7v9h-5.5v-6h-5v6H4z"/>`,
    screen: `<rect x="3" y="4" width="18" height="12.5" rx="1.5"/><path d="M8.5 20h7M12 16.5V20"/>`,
    tonight: `<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9.5 2.8h5v2.6h-5zM8.5 10.5h7M8.5 14h7M8.5 17.5h4"/>`,
    clocks: `<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17"/><path d="M12 12V3.5A8.5 8.5 0 0 1 20.5 12z" fill="currentColor" stroke="none" opacity=".35"/>`,
    combat: `<path d="M5 4.5l9.5 9.5M5 4.5h3.5M5 4.5V8M19 4.5 9.5 14M19 4.5h-3.5M19 4.5V8M8 15.5 5 18.5M16 15.5l3 3M6.5 13.5l4 4M17.5 13.5l-4 4"/>`,
    make: `<path d="M4.5 19.5 15 9M13.5 4.5v3M12 6h3M19 10v3M17.5 11.5h3M18.5 3.5v2M17.5 4.5h2"/>`,
    ask: `<path d="M4 5h16v11H9.5L5 19.5V16H4z"/><path d="M10 9.2a2 2 0 1 1 2.9 1.8c-.6.3-.9.7-.9 1.3M12 14.3v.1"/>`,
    board: `<rect x="3.5" y="4.5" width="17" height="15" rx="1"/><path d="M7.5 15.5l3.5-5 3 3 3.5-6"/><circle cx="7.5" cy="15.5" r="1.3"/><circle cx="11" cy="10.5" r="1.3"/><circle cx="14" cy="13.5" r="1.3"/><circle cx="17.5" cy="7.5" r="1.3"/>`,
    party: `<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c.5-3.5 2.8-5 5.5-5s5 1.5 5.5 5"/><circle cx="16.5" cy="9" r="2.4"/><path d="M15.8 14.3c2.5-.2 4.3 1.4 4.8 4.7"/>`,
    safety: `<path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6z"/><path d="M9 12l2.2 2.2L15.2 10"/>`,
    export: `<path d="M7 8V3.5h10V8M7 17H4.5V9.5c0-.8.7-1.5 1.5-1.5h12c.8 0 1.5.7 1.5 1.5V17H17"/><rect x="7" y="13.5" width="10" height="7"/>`,
    dice: `<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/>`,
    stuck: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5"/>`,
    person: `<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.6-4 3.3-6 7-6s6.4 2 7 6"/>`,
    handout: `<rect x="3.5" y="5.5" width="17" height="13" rx="1"/><path d="M3.5 6.5 12 13l8.5-6.5"/>`,
    map: `<path d="M3.5 6.5 9 4.5l6 2 5.5-2v13L15 19.5l-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>`,
    tables: `<path d="M9 6.5h11M9 12h11M9 17.5h11"/><rect x="3.5" y="4.5" width="3.5" height="3.5" rx=".6"/><rect x="3.5" y="10.2" width="3.5" height="3.5" rx=".6"/><rect x="3.5" y="15.8" width="3.5" height="3.5" rx=".6"/>`,
    play: `<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M12 3v6.5M4 7.5l8 2 8-2M12 9.5 7 17h10z"/>`,
    open: `<path d="M14 4h6v6M20 4l-8.5 8.5M18 14v5.5H4.5V6H10"/>`,
    close: `<path d="M6 6l12 12M18 6 6 18"/>`
  };
  const icon = (k, cls) => `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${IC[k] || ""}</svg>`;

  // for the referee's tools (atlas-table-gm.js), the checker and the build
  A.table = { applyMapEdits, plainRole, icon, boardSize, foundIn, SAFETY_NOTE, era, allHandouts, handoutHTML, makeStore, fogSVG, roll, skillRoll, rollTable, personNow, culture, boardModel, boardLayout, boardHTML, paras, PERSON_SIL, ERA_KIND, NAMES };
})(ATLAS);
