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
      return `<div class="bd-card ${n.kind}${gm && !show(n.id) ? " secret" : ""}" data-bd="${esc(n.id)}" style="left:${p[0].toFixed(0)}px;top:${p[1].toFixed(0)}px;--r:${rot}deg">${n.kind === "person" ? PERSON_SIL : ""}<b>${esc(n.title)}</b>${n.sub ? `<span>${esc(n.sub)}</span>` : ""}<i class="bd-pin"></i></div>`;
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
  const SAFETY_NOTE = "Anyone can say \"let's skip that\" at any time, or touch Stop on the players' screen: the game moves on, and nobody has to explain why.";

  /* ---- the players' screen: this page opened with #players. Only what the referee shows is on it */
  A.playersScreen = function (ctx) {
    const app = document.getElementById("app"), cfg = A.config, st = ctx.store;
    document.documentElement.dataset.theme = "dark"; app.dataset.mode = "player"; app.classList.add("ps-wrap");
    document.title = (cfg.title || "Campaign") + ": the players' screen";
    app.innerHTML = `<div class="ps"><div class="ps-stage" id="psStage"></div>
      <div class="ps-bar"><button type="button" class="ps-btn ps-back" data-ps="back" title="Back to the game master's page (click twice)">⌂</button><button type="button" class="ps-btn" data-ps="notes">Our notes</button><button type="button" class="ps-btn" data-ps="full" title="Full screen">⤢</button><button type="button" class="ps-x" data-ps="x" title="Touch this if you want what is happening to stop. No need to explain.">✕<span>Stop</span></button></div>
      <aside class="ps-journal" hidden><h3>Our notes</h3><p class="ps-hint">What the party knows and suspects. The game master can read these.</p><form class="ps-add"><textarea maxlength="2000" rows="3" placeholder="A note, a theory, a name to remember"></textarea><button type="submit">Add</button></form><div class="ps-entries"></div></aside>
      <div class="ps-toast" hidden></div></div>`;
    const stage = app.querySelector("#psStage"), journal = app.querySelector(".ps-journal");
    let now = { kind: "title" }, world = null;
    const fit = () => { const el = stage.firstElementChild; if (!el || !el.classList.contains("ps-fit")) return; const w = el.offsetWidth, h = el.offsetHeight, s = Math.min(stage.clientWidth * .94 / w, stage.clientHeight * .9 / h, 3); el.style.transform = `translate(-50%, -50%) scale(${s})`; };
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
        // the players' own board: only what they have, laid out on its own
        const all = boardModel(), keep = new Set(all.nodes.filter(nd => ctx.found(nd.id)).map(nd => nd.id)), model = { nodes: all.nodes.filter(nd => keep.has(nd.id)), edges: all.edges.filter(e => keep.has(e.a) && keep.has(e.b)) }, [W, H] = boardSize(Math.max(6, model.nodes.length)), pos = boardLayout(model, W, H);
        stage.innerHTML = `<div class="ps-fit ps-board">${boardHTML(model, pos, id => ctx.found(id), W, H, false)}</div>`;
      } else if (k === "safety") {
        const z = st.get("safety", "zero") || {}, li = a => (a || []).map(x => `<li>${esc(x)}</li>`).join("");
        stage.innerHTML = `<div class="ps-fit"><div class="ps-scene ps-safety"><h2>At this table</h2><div class="ps-lv"><section><h3>Not in the game</h3><ul>${li(z.lines) || "<li>Nothing named yet</li>"}</ul></section><section><h3>Only off screen</h3><ul>${li(z.veils) || "<li>Nothing named yet</li>"}</ul></section></div><p>${esc(SAFETY_NOTE)}</p></div></div>`;
      } else if (k === "blank") stage.innerHTML = "";
      else stage.innerHTML = `<div class="ps-fit"><div class="ps-title"><div>${esc(cfg.system || "")}</div><h1>${esc(cfg.title || "")}</h1>${cfg.strap ? `<p>${esc(cfg.strap)}</p>` : ""}</div></div>`;
      requestAnimationFrame(fit);
    }
    st.watch("screen", d => { now = d.now || { kind: "title" }; render(); });
    st.watch("fog", () => { if (now.kind === "map") render(); });
    st.watch("board", () => { if (now.kind === "board") render(); });
    st.watch("safety", () => { if (now.kind === "safety") render(); });
    for (const c of ["clues", "status"]) st.watch(c, () => { if (now.kind === "board") render(); });
    st.watch("journal", d => {
      const list = Object.entries(d).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
      journal.querySelector(".ps-entries").innerHTML = list.map(([id, e]) => `<div class="ps-entry"><p>${esc(e.text)}</p><time>${new Date(e.t || 0).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time><button type="button" data-jdel="${esc(id)}" aria-label="Remove this note">×</button></div>`).join("") || `<p class="ps-hint">Nothing written yet.</p>`;
    });
    window.addEventListener("resize", fit);
    const toast = t => { const el = app.querySelector(".ps-toast"); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 4000); };
    app.addEventListener("click", e => {
      const b = e.target.closest("[data-ps]"), jd = e.target.closest("[data-jdel]");
      if (jd) { if (jd.dataset.sure) st.set("journal", jd.dataset.jdel, null); else { jd.dataset.sure = 1; jd.textContent = "Really?"; } return; }
      if (!b) return;
      if (b.dataset.ps === "back") {          // twice, so a player does not turn the screen into the referee's page by accident
        if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = "Back to the game master's page? Click again"; setTimeout(() => { delete b.dataset.sure; b.textContent = "⌂"; }, 4000); return; }
        try { sessionStorage.removeItem(cfg.storageKey + "-players"); } catch (e) {}
        location.hash = ""; location.reload(); return;
      }
      if (b.dataset.ps === "notes") journal.hidden = !journal.hidden;
      else if (b.dataset.ps === "full") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); }
      else if (b.dataset.ps === "x") { const t = Date.now(); st.set("xcard", "now", { t }); st.set("xcard", "x" + t, { t }); toast("The game master has been told. Take a breath; the game will move on."); }
    });
    app.querySelector(".ps-add").addEventListener("submit", e => {
      e.preventDefault(); const ta = e.target.querySelector("textarea"), v = ta.value.trim().slice(0, 2000); if (!v) return;
      st.set("journal", "j" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), { text: v, t: Date.now() }); ta.value = "";
    });
  };

  // for the referee's tools (atlas-table-gm.js), the checker and the build
  A.table = { boardSize, foundIn, SAFETY_NOTE, era, allHandouts, handoutHTML, makeStore, fogSVG, roll, skillRoll, rollTable, personNow, culture, boardModel, boardLayout, boardHTML, paras, PERSON_SIL, ERA_KIND, NAMES };
})(ATLAS);
