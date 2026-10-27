/* At the table, the referee's side: the "At the table" view and what it adds to each place's dossier. Its tabs:
   Tonight (the session sheet, the session plan, the notes and "Previously on..."), The players' screen (what they see,
   fog of war room by room, handouts), Clocks (the villains' clocks and "They're stuck"), Combat (initiative, wounds,
   sanity, dice), Make it up (a person, a place, random tables), The board (string and pins), The party (the players'
   characters and their notes), Safety (lines and veils, the X-card, how hard each place hits), Ask the campaign, and
   Print and export (the book, maps for online tables). The page around it (atlas-shell.js) hands it its context
   through A.tableUI.init(ctx). Everything kept is kept in the table's store (atlas-table.js). */
(function (A) {
  "use strict";
  if (!A.table) return;
  const T = A.table, esc = A.esc;
  let X = null, S = null, found = () => false;
  const UI = { tab: "tonight", fogPlace: "", fogFloor: 0, fly: null, person: null, dice: [], ask: [], tabSel: "", boardZoom: .8, dirty: false };
  const $ = s => document.querySelector(s);
  const cfg = () => A.config;
  const gmName = () => cfg().gm || "GM";
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const uid = p => (p || "") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const toList = v => (Array.isArray(v) ? v : v || v === 0 ? [v] : []);
  const placeName = id => (A.meta[id] || {}).name || id;
  const goBtn = id => A.meta[id] && !String(id).startsWith("fly-") ? `<button type="button" class="t-go" data-go="${esc(id)}">${esc(placeName(id))}</button>` : esc(placeName(id));
  const SYS = () => { const s = String(cfg().system || "").toLowerCase(); return /cthulhu|delta green|pulp|brp|basic roleplaying|runequest|mythras/.test(s) ? "coc" : /d&d|dungeons|5e|pathfinder|d20|13th age|shadowdark|osr|old.school|starfinder/.test(s) ? "d20" : "any"; };
  const pref = { get(k) { try { return localStorage.getItem(cfg().storageKey + "-t-" + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(cfg().storageKey + "-t-" + k, v); } catch (e) {} } };
  // the viewer shows no confirm() box, so a delete asks twice
  let sure = null;
  function twice(btn, fn) {
    if (sure === btn) { sure = null; fn(); return; }
    if (sure) { sure.textContent = sure.dataset.lbl; sure.classList.remove("sure"); }
    sure = btn; btn.dataset.lbl = btn.textContent; btn.textContent = "Really?"; btn.classList.add("sure");
    setTimeout(() => { if (sure === btn) { btn.textContent = btn.dataset.lbl; btn.classList.remove("sure"); sure = null; } }, 4000);
  }

  /* ================================================================ stat blocks, in the game's own rules */
  function statBlock(st, name) {
    if (!st || typeof st !== "object") return "";
    const v = k => st[k] != null ? st[k] : st[k.toLowerCase()];
    const has = l => l.some(k => v(k) != null), txt = x => Array.isArray(x) ? x.join(", ") : x && typeof x === "object" ? Object.entries(x).map(([a, b]) => a + " " + b).join(", ") : x;
    const kind = has(["SIZ", "POW", "EDU", "APP", "SAN"]) ? "coc" : has(["AC", "WIS", "CHA", "CR"]) ? "d20" : "any";
    const line = (label, x) => x == null || x === "" ? "" : `<p class="sb-p"><span class="kl">${esc(label)}</span>${esc(txt(x))}</p>`;
    const acts = (label, list) => (list || []).length ? `<div class="sb-l"><span class="kl">${esc(label)}</span><ul>${list.map(a => typeof a === "string" ? `<li>${esc(a)}</li>` : `<li><b>${esc(a.n || "")}</b>${a.pct != null ? ` ${esc(a.pct)}%` : ""}${a.hit != null ? ` ${esc(a.hit)} to hit` : ""}${a.dmg ? `, damage ${esc(a.dmg)}` : ""}${a.d ? `. ${esc(a.d)}` : ""}${a.note ? ` · ${esc(a.note)}` : ""}</li>`).join("")}</ul></div>` : "";
    const cell = k => v(k) != null ? `<span><b>${esc(k)}</b>${esc(v(k))}</span>` : "";
    let body = "";
    if (kind === "coc") {
      body = `<div class="sb-ch">${["STR", "CON", "SIZ", "DEX", "INT", "POW", "APP", "EDU"].map(cell).join("")}</div><div class="sb-ch der">${["HP", "MP", "SAN", "Luck", "Build", "DB", "Move", "Armour"].map(k => st[k] != null ? `<span><b>${esc(k)}</b>${esc(st[k])}</span>` : "").join("")}</div>`
        + acts("Attacks", st.attacks) + line("Skills", st.skills ? Object.entries(st.skills).map(([a, b]) => `${a} ${b}%`).join(", ") : "") + line("Spells", st.spells) + line("Sanity loss to see it", st.sanloss) + line("Notes", st.notes);
    } else if (kind === "d20") {
      const mod = x => { const m = Math.floor((+x - 10) / 2); return isNaN(m) ? "" : ` (${m >= 0 ? "+" : ""}${m})`; };
      body = `<div class="sb-ch der">${["AC", "HP", "Speed"].map(k => v(k) != null ? `<span><b>${k}</b>${esc(v(k))}</span>` : "").join("")}</div><div class="sb-ch">${["STR", "DEX", "CON", "INT", "WIS", "CHA"].map(k => v(k) != null ? `<span><b>${k}</b>${esc(v(k))}${mod(v(k))}</span>` : "").join("")}</div>`
        + line("Saves", st.saves) + line("Skills", st.skills) + line("Senses", st.senses) + line("Languages", st.languages) + line("Challenge", v("CR")) + acts("Traits", st.traits) + acts("Actions", st.actions || st.attacks) + acts("Reactions", st.reactions) + line("Notes", st.notes);
    } else {
      const skip = new Set(["attacks", "actions", "notes"]);
      body = `<dl class="sb-any">${Object.entries(st).filter(([k]) => !skip.has(k)).map(([k, x]) => `<div><dt>${esc(k)}</dt><dd>${esc(txt(x))}</dd></div>`).join("")}</dl>` + acts("Attacks", st.attacks || st.actions) + line("Notes", st.notes);
    }
    return `<div class="sb sb-${kind}">${name ? `<div class="sb-n">${esc(name)}</div>` : ""}${body}</div>`;
  }
  const rollBadge = r => r ? `<span class="roll-b" title="The roll this asks for">🎲 ${esc(r)}</span>` : "";

  /* ================================================================ the dossier's additions */
  const pcsHere = id => Object.entries(A.pcsData || {}).filter(([, pc]) => (pc.clue && pc.clue.at === id) || toList(pc.places).includes(id));
  function intensity(m) {
    const n = Math.max(0, Math.min(5, +m.intensity || 0)); if (!n && !(m.content || []).length) return "";
    const words = ["", "Gentle", "Uneasy", "Tense", "Harrowing", "Brutal"];
    return `<span class="tag t-int i${n}" title="How hard this place hits, 1 to 5${(m.content || []).length ? ": " + esc(m.content.join(", ")) : ""}">${n ? "●".repeat(n) + "○".repeat(5 - n) + " " + words[n] : ""}${(m.content || []).length ? `<span class="t-ct">${esc(m.content.join(" · "))}</span>` : ""}</span>`;
  }
  // under the place's name: how hard it hits, then one labelled row of what the referee can do with it at the table
  function dossierBar(p) {
    const m = A.meta[p.id] || {}, hs = T.allHandouts().filter(h => h.place === p.id), nt = Object.keys(m.tables || {}).length, mapped = !!A.maps[p.id];
    const conflict = safetyHits(m);
    const warn = intensity(m) + (conflict.length ? `<span class="tag t-warn" title="It touches what the players asked to keep out or off screen">⚠ ${esc(conflict.join(", "))}</span>` : "");
    const acts = [
      mapped ? `<button type="button" class="t-act" data-t="fogopen" data-id="${esc(p.id)}" title="Put this place's map on the players' screen, then show it a room at a time">${T.icon("screen")}Show its map to the players</button>` : "",
      hs.length ? `<button type="button" class="t-act" data-t="hplace" data-id="${esc(p.id)}" title="Read the handouts found here, print them, or give them to the players">${T.icon("handout")}Handouts (${hs.length})</button>` : "",
      nt ? `<button type="button" class="t-act" data-t="rtables" title="Roll on this place's own random tables">${T.icon("tables")}Random tables (${nt})</button>` : "",
      mapped ? `<button type="button" class="t-act" data-t="vtt" data-id="${esc(p.id)}" title="Its maps, with walls and doors, for Foundry, Roll20 and other online tables">${T.icon("export")}Maps for online tables</button>` : ""
    ].filter(Boolean).join("");
    return (warn ? `<div class="t-dbar keeper">${warn}</div>` : "") + (acts ? `<div class="t-dact keeper"><span class="t-dact-h">${T.icon("play")}At the table</span>${acts}</div>` : "");
  }
  function dossierExtra(p) {
    const m = A.meta[p.id] || {}, out = [];
    const pcs = pcsHere(p.id);
    if (pcs.length) out.push(`<section class="sec keeper t-pcs"><h3>For the players' characters</h3>${pcs.map(([, pc]) => `<div class="t-pcclue"><b>${esc(pc.n)}</b>${pc.player ? ` <span class="kn">(${esc(pc.player)})</span>` : ""}${pc.clue && pc.clue.at === p.id ? `<p><span class="kl">Theirs to find</span>${esc(pc.clue.t || "")}${pc.clue.d ? ": " + esc(pc.clue.d) : ""}</p>` : ""}${pc.hook && toList(pc.places).includes(p.id) ? `<p><span class="kl">Why it matters to them</span>${esc(pc.hook)}</p>` : ""}</div>`).join("")}</section>`);
    const tabs = Object.entries(m.tables || {}).filter(([, l]) => Array.isArray(l) && l.length);
    if (tabs.length) out.push(`<section class="sec keeper t-rt"><h3>Random tables</h3>${tabs.map(([name, list]) => tableRow("p:" + p.id + ":" + name, name, list)).join("")}</section>`);
    return out.join("");
  }
  // one random table: its name, a roll button, the result, and the whole list folded
  function tableRow(key, name, list) {
    const got = UI.tabSel === key && UI.tabRes ? UI.tabRes : "";
    return `<div class="t-tab" data-tkey="${esc(key)}"><div class="t-tabh"><button type="button" class="t-mini" data-t="rolltab" data-key="${esc(key)}">Roll</button><b>${esc(name)}</b> <span class="kn">d${list.length}</span></div><p class="t-tabres" aria-live="polite">${esc(got)}</p><details><summary>The whole table</summary><ol>${list.map(x => `<li>${esc(x)}</li>`).join("")}</ol></details></div>`;
  }
  function tableList(key) {
    const [kind, a, ...rest] = key.split(":"), name = rest.join(":");
    if (kind === "p") return ((A.meta[a] || {}).tables || {})[name] || [];
    if (kind === "c") return (A.tablesData || {})[a + (name ? ":" + name : "")] || [];
    if (kind === "g") return (generic()[a + (name ? ":" + name : "")]) || [];
    return [];
  }
  function handoutBtns(hid) {
    return `<span class="t-hbtn"><button type="button" class="t-mini" data-t="hview" data-id="${esc(hid)}">Read the handout</button><button type="button" class="t-mini" data-t="hshow" data-id="${esc(hid)}">Give it to the players</button></span>`;
  }

  /* ================================================================ random tables everyone has, in the story's age */
  function generic() {
    const e = T.era(), g = e === "medieval" || e === "fantasy" ? "medieval" : e === "modern" ? "modern" : e === "future" ? "future" : "old";
    return {
      old: {
        "The weather": ["A thin rain that soaks through everything", "Fog thick enough to lose a hand in", "A bright, cold morning; breath shows", "Wind off the water, rattling every sign", "Close and airless; a storm coming", "Sleet turning to snow by dusk", "A yellow smog that stings the eyes", "A rare blue day; everyone is out"],
        "In the street": ["A cart has shed its load and a crowd gathers", "A newsboy shouts a headline about the case", "A constable moving people along, a little too keen", "Someone is following the party, badly", "A funeral passes; hats come off", "A dog will not stop barking at one of them", "A pickpocket tries their luck", "A familiar face across the road, gone a moment later", "A street preacher who seems to know too much", "Two men fighting outside a pub"],
        "A complication": ["The one they want left an hour ago", "The door they need is newly locked", "A witness has been paid to forget", "The police arrive at the worst moment", "Someone recognises one of the party", "A fire breaks out nearby", "Their cab driver is listening", "A rival is asking the same questions"],
        "In a pocket or a drawer": ["A pawn ticket", "A lock of hair folded in paper", "A railway timetable with one train ringed", "Three foreign coins", "A letter of credit in another's name", "A pressed flower", "A cheap rosary", "A key with a brass tag, numbered", "A newspaper cutting about a drowning", "Opium, wrapped in a handkerchief"]
      },
      medieval: {
        "The weather": ["Rain from the west, steady and cold", "A morning mist that hides the road", "Hard frost; the ruts are iron", "Thunder in the hills", "A hot, still day; flies everywhere", "Snow in the passes"],
        "On the road": ["A pedlar with news three days old", "Pilgrims singing badly", "A toll nobody mentioned", "A broken cart and a frightened family", "Soldiers looking for someone", "A hanged man at the crossroads", "A wandering friar asking for alms", "Hoofprints that end in a field"],
        "A complication": ["The bridge is out", "The lord's men are in the village", "Someone cries thief", "A fever is going round", "The inn is full of a rival's men", "The priest refuses to speak to them"],
        "In a purse or a chest": ["A tally stick", "A saint's medal", "A broken seal", "Dice, loaded", "A lock of hair", "A letter nobody here can read", "Spices worth a month's wages", "A key on a thong"]
      },
      modern: {
        "The weather": ["Drizzle and a low grey sky", "A heatwave; tempers short", "Wind that turns every umbrella", "Clear and freezing", "Fog over the river", "A storm warning on every phone"],
        "In the street": ["Sirens heading somewhere else", "A delivery van blocking the road", "Someone filming the party on a phone", "A protest coming the other way", "A car that has passed three times", "A busker playing a song that means something", "A power cut takes out the block", "A stranger who knows a name they should not"],
        "A complication": ["The phone battery dies", "The building's security has been changed", "Someone has posted about the party online", "The police want a word", "The person they want has a lawyer now", "The road is closed for an accident"],
        "In a pocket or a drawer": ["A receipt from a petrol station at 3 a.m.", "A key card", "A burner phone", "A photo-booth strip", "A USB stick", "Pills without a label", "A parking ticket from another city", "A business card with a number on the back"]
      },
      future: {
        "Conditions": ["Recycled air tastes of metal today", "A micrometeorite alert; bulkheads close", "The grav plating flickers", "A solar storm; comms are patchy", "The hydroponics bay smells of rot", "Night cycle, half the lights down"],
        "In the corridors": ["A maintenance drone that follows them", "Crew arguing over rations", "An announcement in a language nobody speaks", "A sealed door that was open yesterday", "Someone scrubbing a stain off the deck", "A child where no child should be", "Security running a spot check", "A message scrawled on a viewport"],
        "A complication": ["Their access codes are revoked", "The lift is out between decks", "Someone has altered the logs", "Quarantine is declared", "A pressure leak on their route", "The AI will not answer them"],
        "In a locker": ["A ration bar with a code scratched in it", "A data chip", "A worn photograph from Earth", "Spare filters", "A stun baton, uncharged", "Contraband alcohol", "A crew patch from a ship that was lost", "Someone else's access card"]
      }
    }[g];
  }

  /* ================================================================ a place on the fly: a small mapped place with a person and something to find */
  const FINDS = {
    old: ["a letter, unsent, in a hand someone will know", "a ledger page with one name inked out", "a key on a ribbon that fits no lock here", "a photograph with one face scratched away", "a pawn ticket for something pawned yesterday", "a railway timetable with one train ringed in pencil", "a bloodied handkerchief pushed behind the skirting", "a page torn from a book of strange symbols", "money sewn into a coat lining", "a map of the district with a house marked", "a telegram that was never delivered", "a calling card with a time written on the back"],
    medieval: ["a letter with its seal broken", "a tally stick with too many notches", "a key on a leather thong", "a painted miniature of a stranger", "a purse of foreign coin", "a page written backwards", "a bloodied glove", "a map scratched on a slate", "a holy medal with the saint's face filed off", "a lock of hair tied with red thread"],
    modern: ["a phone with one unread message", "a receipt from somewhere they should not have been", "a key card for a building across town", "a photograph with one face scratched away", "a memory stick taped under a drawer", "a train ticket for tonight", "a bloodied tissue in the bin", "a notebook page of strange symbols", "cash in a cereal box", "a printed map with a house circled"],
    future: ["a data chip with one file locked", "an access card for a sealed deck", "a holo of a crew member marked deceased", "a requisition signed twice", "a ration pack with a message scratched inside", "a sensor log with an hour missing", "a bloodied glove from a pressure suit", "a star chart with one system ringed", "a key that should not exist on a station", "credits hidden in a vent"]
  };
  const SECRETS = ["The owner is paying someone to keep quiet", "There is a way out nobody uses, behind the back room", "Someone here was at the place the party is asking about", "The place is watched from across the street", "Something is hidden under the floor", "The person here is expecting someone else, tonight", "The last tenant left in a hurry and left things behind", "Two of the people who come here are not who they say"];
  const ADJ = ["Crooked", "Drowned", "Golden", "Black", "Silver", "Red", "Lame", "Blind", "Laughing", "Hanged", "Sleeping", "Green", "Broken", "Lucky", "Last"];
  const NOUN = ["Lantern", "Man", "Anchor", "Hart", "Swan", "Bell", "Fox", "Crown", "Wheel", "Raven", "Key", "Moon", "Plough", "Gate", "Lamb"];
  const SAINTS = ["Agnes", "Botolph", "Bride", "Columba", "Dunstan", "Giles", "Hilda", "Jude", "Leonard", "Margaret", "Michael", "Olave", "Sepulchre", "Vedast"];
  // the plans: [rid, x, y, w, h, name, kind, opts]; doors [x, y, "h"|"v", type, len]; what can be found where
  const PLANS = {
    inn: { w: 16, h: 13, R: [["S1", 0, 11, 16, 2, "The street", "street"], ["R1", 1, 5, 9, 6, "Taproom", "boards", { fx: "taproom" }], ["R2", 10, 5, 5, 3, "Kitchen", "flag", { fx: "kitchen" }], ["R3", 10, 8, 5, 3, "Store", "boards", { fx: "store" }], ["R4", 1, 1, 5, 4, "Private room", "carpet-r", { fx: "parlour" }], ["R5", 6, 1, 9, 4, "Landlord's room", "boards", { fx: "bedroom" }]], D: [[4, 11, "h", "dd", 2], [10, 6, "v", "d"], [12, 8, "h", "d"], [3, 5, "h", "d"], [8, 5, "h", "d"], [12, 11, "h", "d"]] },
    shop: { w: 14, h: 11, R: [["S1", 0, 9, 14, 2, "The street", "street"], ["R1", 1, 5, 7, 4, "Shop", "boards", { fx: "shop" }], ["R2", 8, 5, 5, 4, "Workshop", "boards", { fx: "workshop" }], ["R3", 1, 1, 5, 4, "Office", "carpet-g", { fx: "office" }], ["R4", 6, 1, 7, 4, "Store", "boards", { fx: "store" }]], D: [[3, 9, "h", "d"], [8, 6, "v", "d"], [3, 5, "h", "d"], [10, 5, "h", "d"], [6, 2, "v", "d"], [11, 9, "h", "d"]] },
    house: { w: 15, h: 12, R: [["S1", 0, 10, 15, 2, "The street", "street"], ["R1", 6, 5, 3, 5, "Hall", "boards", { fx: "hall" }], ["R2", 1, 5, 5, 5, "Parlour", "carpet-r", { fx: "parlour" }], ["R3", 9, 5, 5, 5, "Dining room", "boards", { fx: "dining" }], ["R4", 1, 1, 6, 4, "Kitchen", "flag", { fx: "kitchen" }], ["R5", 7, 1, 7, 4, "Bedroom", "carpet-b", { fx: "bedroom" }]], D: [[7, 10, "h", "d"], [6, 7, "v", "d"], [9, 7, "v", "d"], [3, 5, "h", "d"], [7, 5, "h", "d"], [1, 2, "v", "d"]] },
    warehouse: { w: 18, h: 13, R: [["S1", 0, 11, 18, 2, "The yard", "yard"], ["R1", 1, 1, 12, 10, "Warehouse floor", "concrete"], ["R2", 13, 1, 4, 4, "Office", "boards", { fx: "office" }], ["R3", 13, 5, 4, 3, "Store", "boards", { fx: "store" }], ["R4", 13, 8, 4, 3, "Back room", "boards", { fx: "workshop" }]], D: [[5, 11, "h", "dd", 3], [13, 2, "v", "d"], [13, 6, "v", "d"], [13, 9, "v", "d"], [15, 11, "h", "d"]], I: [["crate", 2, 2, 2, 2], ["crate", 2, 5, 2, 2], ["crate", 6, 2, 3, 2], ["barrel", 10, 2, 2, 1], ["crate", 9, 6, 2, 3], ["barrel", 5, 8, 2, 1]] },
    office: { w: 15, h: 11, R: [["S1", 0, 9, 15, 2, "The street", "street"], ["R1", 1, 5, 6, 4, "Waiting room", "lino", { fx: "waiting" }], ["R2", 7, 5, 7, 4, "Front office", "boards", { fx: "office" }], ["R3", 1, 1, 6, 4, "Records", "boards", { fx: "library" }], ["R4", 7, 1, 4, 4, "Inner office", "carpet-g", { fx: "office" }], ["R5", 11, 1, 3, 4, "Strong room", "stone", { fx: "strong" }]], D: [[3, 9, "h", "d"], [7, 6, "v", "d"], [3, 5, "h", "d"], [9, 5, "h", "d"], [11, 2, "v", "d"]] },
    chapel: { w: 14, h: 14, R: [["S1", 0, 12, 14, 2, "Churchyard", "grass"], ["R1", 3, 3, 8, 9, "Nave", "flag", { fx: "chapel" }], ["R2", 11, 3, 3, 4, "Vestry", "boards", { fx: "vestry" }], ["R3", 0, 8, 3, 4, "Bell tower", "flag"], ["R4", 3, 0, 8, 3, "Sanctuary", "marble"]], D: [[6, 12, "h", "dd", 2], [11, 4, "v", "d"], [3, 9, "v", "d"], [6, 3, "h", "a", 2]] },
    cave: { w: 16, h: 13, R: [["X1", 0, 0, 16, 11, "", "rock"], ["S1", 0, 11, 16, 2, "The woods", "forest"], ["R1", 5, 8, 5, 3, "Cave mouth", "earth"], ["R2", 2, 3, 8, 5, "Great chamber", "earth"], ["R3", 10, 2, 5, 4, "Sleeping nook", "earth"], ["R4", 10, 6, 5, 4, "Pool", "water"]], D: [[6, 11, "h", "a", 3], [6, 8, "h", "a", 2], [10, 4, "v", "a"], [10, 7, "v", "a"]] }
  };
  const FLY_KINDS = { old: ["inn", "shop", "house", "warehouse", "office", "chapel"], medieval: ["inn", "shop", "house", "warehouse", "chapel", "cave"], modern: ["inn", "shop", "house", "warehouse", "office", "chapel"], future: ["inn", "shop", "house", "warehouse", "office", "chapel"] };
  const KIND_WORD = {
    old: { inn: "A tavern", shop: "A shop", house: "A house", warehouse: "A warehouse", office: "An office", chapel: "A church" },
    medieval: { inn: "An inn", shop: "A craftsman's shop", house: "A cottage", warehouse: "A barn", chapel: "A shrine", cave: "A cave" },
    modern: { inn: "A bar", shop: "A shop", house: "A house", warehouse: "A warehouse", office: "A clinic", chapel: "A church" },
    future: { inn: "A canteen", shop: "A supply store", house: "Crew quarters", warehouse: "A cargo bay", office: "A medbay", chapel: "A memorial chapel" }
  };
  const RENAME = {
    future: { Taproom: "Mess", Kitchen: "Galley", Store: "Locker", "Private room": "Booth room", "Landlord's room": "Manager's cabin", Shop: "Counter", Workshop: "Fab shop", Office: "Office", Hall: "Hatchway", Parlour: "Common room", "Dining room": "Mess", Bedroom: "Bunk room", "Warehouse floor": "Cargo deck", "Back room": "Tool room", "Waiting room": "Triage", "Front office": "Treatment room", Records: "Records", "Inner office": "Surgeon's office", "Strong room": "Dispensary", Nave: "Memorial hall", Vestry: "Chaplain's room", "Bell tower": "Observation blister", Sanctuary: "Wall of names", "The street": "Corridor", "The yard": "Loading bay", Churchyard: "Corridor" },
    modern: { Taproom: "Bar", "Private room": "Back room", "Landlord's room": "Manager's office", Parlour: "Living room", Hall: "Hallway", Records: "Files", "Strong room": "Drugs cupboard", "Front office": "Consulting room" },
    medieval: { "The street": "The lane", Office: "Counting room", "Warehouse floor": "Threshing floor", "Back room": "Tack room", Parlour: "Hall", Hall: "Passage", "Dining room": "Buttery" }
  };
  const FLOOR = {
    future: { boards: "metal", flag: "grating", "carpet-r": "metal", "carpet-g": "metal", "carpet-b": "metal", lino: "metal", stone: "metal", marble: "glass", street: "grating", yard: "metal", grass: "grating", concrete: "metal" },
    modern: { flag: "tile", "carpet-r": "carpet-b", street: "tarmac", yard: "tarmac" },
    medieval: { lino: "boards", concrete: "earth", "carpet-r": "straw", "carpet-g": "boards", "carpet-b": "boards", street: "mud", yard: "mud" }
  };
  const eraGroup = () => { const e = T.era(); return e === "medieval" || e === "fantasy" ? "medieval" : e === "modern" ? "modern" : e === "future" ? "future" : "old"; };
  function flyName(kind, g) {
    const sur = (T.personNow().name.split(" ").slice(-1)[0] || "Mercer"), n = 2 + Math.floor(Math.random() * 40);
    const pubs = `The ${pick(ADJ)} ${pick(NOUN)}`;
    const T1 = {
      inn: { old: pubs, medieval: pubs, modern: pick([pubs, `${pick(NOUN)} Bar`, `The ${pick(NOUN)} Club`]), future: pick([`Deck ${n} Canteen`, pubs]) },
      shop: { old: `${sur}'s ${pick(["Chemist", "Pawnbroker", "Bookshop", "Tobacconist", "Watchmaker", "Draper", "Ironmonger"])}`, medieval: `${sur}'s ${pick(["Chandlery", "Apothecary", "Smithy", "Cooperage", "Bakery"])}`, modern: `${sur}'s ${pick(["Pharmacy", "Pawn Shop", "Books", "Hardware", "Phone Repair"])}`, future: pick([`Parts Depot ${n}`, `${sur} Salvage`, "Commissary", "Med Supplies"]) },
      house: { old: pick([`The ${sur} House`, `No. ${n}, ${pick(NOUN)} Street`]), medieval: `${sur}'s Cottage`, modern: pick([`Flat ${n}`, `No. ${n}, ${pick(NOUN)} Road`]), future: `Quarters ${"ABCDEFG"[n % 7]}-${n}` },
      warehouse: { old: `${sur} & Sons, Warehouse`, medieval: pick(["The Tithe Barn", `${sur}'s Barn`]), modern: `Unit ${n}, ${sur} Logistics`, future: `Cargo Bay ${n}` },
      office: { old: pick([`${sur} & ${T.personNow().name.split(" ").slice(-1)[0]}, Solicitors`, `Dr ${sur}'s Surgery`]), medieval: "The Counting House", modern: pick([`The ${sur} Clinic`, `${sur} Associates`]), future: pick([`Medbay ${n}`, "Survey Office"]) },
      chapel: { old: `St ${pick(SAINTS)}'s`, medieval: `Shrine of St ${pick(SAINTS)}`, modern: `St ${pick(SAINTS)}'s`, future: "The Memorial Chapel" },
      cave: { medieval: pick([`The ${pick(ADJ)} Cave`, `${sur}'s Hole`]) }
    };
    return (T1[kind] || {})[g] || pubs;
  }
  // the lead it carries: a place the party needs and has few ways to reach
  function flyLead() {
    if (!X) return null;
    const cand = X.P.filter(p => { const a = X.accessInfo(p.id); return !a.acc && a.ways.length <= 2; });
    const any = cand.length ? cand : X.P.filter(p => !X.accessInfo(p.id).acc);
    return any.length ? pick(any).id : null;
  }
  function makeFly(kind) {
    const g = eraGroup(); kind = kind && PLANS[kind] && (FLY_KINDS[g] || []).includes(kind) ? kind : pick(FLY_KINDS[g]);
    const rooms = PLANS[kind].R.filter(r => /^R/.test(r[0])).map(r => r[0]), who = rooms[0], at = pick(rooms.slice(1).length ? rooms.slice(1) : rooms);
    return { id: uid("fly-"), kind, g, name: flyName(kind, g), person: T.personNow(), find: pick(FINDS[g]), findAt: at, personAt: who, secret: pick(SECRETS), lead: flyLead(), t: Date.now() };
  }
  // the place itself, registered with the engine so it draws like any other
  function flyPlace(f) {
    if (A.maps[f.id]) return f.id;
    const P0 = PLANS[f.kind] || PLANS.inn, ren = RENAME[f.g] || {}, fl = FLOOR[f.g] || {};
    const R = P0.R.map(r => { const o = r.slice(); o[5] = ren[o[5]] || o[5]; o[6] = fl[o[6]] || o[6]; if (o[7]) o[7] = Object.assign({}, o[7]); return o; });
    const name = n => (R.find(r => r[0] === n) || [])[5] || n;
    A.place(f.id, {
      name: f.name, region: "Made at the table", category: "fly", tier: 3,
      map: {
        t: f.name, ext: `${(KIND_WORD[f.g] || {})[f.kind] || "A place"}, made up at the table.`,
        floors: [{ n: "Ground floor", w: P0.w, h: P0.h, R, D: P0.D.map(d => d.slice()), I: (P0.I || []).map(i => i.slice()) }],
        npcs: { N1: { n: f.person.name + ", " + f.person.trade, at: f.personAt, look: f.person.look, manner: f.person.manner, want: f.person.want, secret: f.person.secret } },
        clues: { C1: { t: f.find, at: f.findAt, d: `In the ${name(f.findAt).toLowerCase()}.`, to: f.lead ? [f.lead] : [] } },
        secrets: { S1: { t: f.secret, at: P0.R[1][0] } }
      }
    });
    const i = A.order.indexOf(f.id); if (i >= 0) A.order.splice(i, 1);   // not one of the campaign's own places
    return f.id;
  }
  T.flyPlace = flyPlace;
  // (the same plans start a place the game master makes in a city: atlas-locations.js)
  T.flyPlans = { PLANS, RENAME, FLOOR, KIND_WORD };

  /* ================================================================ the board, the clocks, the session */
  function clockSVG(n, at, size) {
    n = Math.max(2, Math.min(12, +n || 4)); size = size || 64; const c = size / 2, r = c - 3;
    let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="clk" aria-hidden="true">`;
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n;
      s += `<path d="M${c} ${c}L${(c + r * Math.cos(a0)).toFixed(1)} ${(c + r * Math.sin(a0)).toFixed(1)}A${r} ${r} 0 0 1 ${(c + r * Math.cos(a1)).toFixed(1)} ${(c + r * Math.sin(a1)).toFixed(1)}Z"${i < at ? ` class="on"` : ""}/>`;
    }
    return s + `</svg>`;
  }
  const clockAt = c => Math.max(0, Math.min(+c.segments || (c.ticks || []).length || 4, +((S.get("clocks", c.id) || {}).at) || 0));
  const sessions = () => (A.sessionsData || []).slice().sort((a, b) => (+a.n || 0) - (+b.n || 0));
  const sessionNow = () => { const n = +((S.get("log", "now") || {}).n); if (n) return n; const s = sessions(); return s.length ? +s[0].n : 1; };
  const sessionOf = n => sessions().find(s => +s.n === +n) || null;
  const notesOf = n => (S.get("log", "s" + n) || {});
  // the places tonight is likely to visit: the plan's, and those a found clue now opens
  function tonightPlaces() {
    const s = sessionOf(sessionNow()), out = [];
    for (const id of toList(s && s.places)) if (A.meta[id] && !out.includes(id)) out.push(id);
    if (X && X.TR.ready) for (const p of X.P) { const a = X.accessInfo(p.id), st = X.stOf(p.id); if (["unknown", "rumoured", "known", "open"].includes(st) && a.via.length && !out.includes(p.id)) out.push(p.id); }
    if (!out.length && X && X.state.sel) out.push(X.state.sel);
    return out;
  }
  const lines = () => { const z = S.get("safety", "zero") || {}; return { lines: toList(z.lines).filter(Boolean), veils: toList(z.veils).filter(Boolean) }; };
  function safetyHits(m) {
    const z = lines(), said = [m.name, m.tagline, ...(m.content || [])].join(" ").toLowerCase(), hits = [];
    for (const w of [...z.lines, ...z.veils]) { const k = String(w).toLowerCase().trim(); if (k.length > 2 && said.includes(k)) hits.push(w); }
    return hits;
  }

  /* ================================================================ the AI, where the page can reach one */
  // what comes back is shown as plain text: emphasis marks and headings are taken off
  const unmd = t => String(t || "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/(^|[\s("'])\*([^*\n]+)\*/g, "$1$2").replace(/^#{1,6}\s*/gm, "");
  async function askAI(prompt, onText, signal) {
    const r = await askRaw(prompt, t => onText(unmd(t)), signal); return r == null ? r : unmd(r);
  }
  async function askRaw(prompt, onText, signal) {
    let sample = null; try { sample = window.claude && window.claude.use ? await window.claude.use("sample") : null; } catch (e) { sample = null; }
    if (sample) { const r = await sample(prompt, { onText: e => onText(e.text), signal, cache: false }); return r.text; }
    if (window.ATLAS_APP && window.ATLAS_APP.ask) { const t = await window.ATLAS_APP.ask(prompt); onText(t); return t; }
    return null;
  }
  // the campaign's own words, cut into passages, to look up what a question is about
  let CORPUS = null;
  const STOP = new Set("the and for are but not you all any can had her was one our out has have his how its may new now old see two way who did get him let say she too use that this with from they them then than there their what when where which while will would about into your been were also only some such more most very just like over after before under again does doing done here why whom whose".split(" "));
  const words = s => (String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9']{3,}/g) || []).map(w => w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
  function corpus() {
    if (CORPUS) return CORPUS;
    // plain words: the bible's Markdown marks, its table rules and its list bullets are not what anyone asked about
    const plain = t => String(t || "").replace(/^\s*\|?\s*:?-{3,}.*$/gm, " ").replace(/\s*\|\s*/g, " · ").replace(/^\s*#{1,6}\s*/gm, "").replace(/^\s*(?:[-*]|\d+\.)\s+/gm, "").replace(/\*\*|__|`/g, "").replace(/(^|\s)\*(\S[^*]*?)\*/g, "$1$2").replace(/\s+/g, " ").replace(/(?:\s*·\s*){2,}/g, " · ").replace(/^[\s·]+|[\s·]+$/g, "");
    // a long text is cut at word boundaries, each piece overlapping the one before by a few words
    const docs = [], push = (src, text, go, w) => { text = plain(text); if (text.length < 24) return; let i = 0; while (i < text.length) { let a = Math.max(0, i - 60); if (a) { const sp = text.indexOf(" ", a); a = sp > 0 && sp < i ? sp + 1 : a; } let b = Math.min(text.length, i + 700); if (b < text.length) { const sp = text.lastIndexOf(" ", b); if (sp > i) b = sp; } docs.push({ src, go, w: w || 1, text: (a ? "… " : "") + text.slice(a, b) + (b < text.length ? " …" : "") }); i = b + 1; } };
    const j = (...a) => a.filter(Boolean).join(" ");
    // the bible first; the council's debate and the story as given count for less (they hold what was argued and dropped)
    for (const ch of A.storyData || []) { const w = ch.group === "The story" ? 1 : .55; let buf = ""; for (const p of ch.md.split(/\n\s*\n/)) { if ((buf + p).length > 760 && buf) { push(ch.title, buf, null, w); buf = ""; } buf += "\n" + p; } push(ch.title, buf, null, w); }
    for (const p of X.P) {
      const M = p.M || {};
      push(p.name, j(p.sub, M.ext, M.ov), p.id);
      for (const [k, c] of Object.entries(M.clues || {})) push(`${p.name}: ${c.t || k}`, j(c.t, c.d, c.how, c.rev, c.hint, c.rescue), p.id);
      for (const n of Object.values(M.npcs || {})) { const c = X.castOf(n) || {}, [nm, role] = X.who(n); push(`${nm}${role ? ", " + role : ""} (${p.name})`, j(n.look || c.look, c.bg, n.bg, c.want, c.secret, n.knows, n.rev, n.doing), p.id); }
      for (const e of Object.values(M.enc || {})) push(`${p.name}: ${e.t || ""}`, e.d, p.id);
      for (const [rid, r] of Object.entries(M.rooms || {})) push(`${p.name}: ${rid} ${r.n || A.nameOf(M, rid)}`, j(r.d, r.atm, r.obj, r.now, r.sec, r.kp), p.id);
      for (const [, x] of Object.entries(M.secrets || {})) push(`${p.name}: ${x.t || "a secret"}`, j(x.t, x.acc, x.dest, x.why), p.id);
    }
    for (const c of Object.values(A.castData || {})) push(`${c.n}${c.role ? ", " + c.role : ""}`, j(c.look, c.manner, c.bg, c.want, c.secret, c.lie, c.press, c.fate, typeof c.ties === "object" && c.ties ? Object.entries(c.ties).map(([k, v]) => k + ": " + v).join("; ") : c.ties));
    for (const pc of Object.values(A.pcsData || {})) push(`Player character: ${pc.n}`, j(pc.concept, pc.bg, pc.hook, pc.secret, pc.clue && pc.clue.t, pc.clue && pc.clue.d));
    for (const c of A.clocksData || []) push(`Clock: ${c.name}`, j(c.who, ...(c.ticks || []), c.done));
    for (const s of sessions()) push(`Session ${s.n}: ${s.title || ""}`, j(s.start, s.cliff, s.notes));
    const df = {}; for (const d of docs) { d.tf = {}; for (const w of words(d.src + " " + d.text)) d.tf[w] = (d.tf[w] || 0) + 1; for (const w in d.tf) df[w] = (df[w] || 0) + 1; }
    return (CORPUS = { docs, df, N: docs.length });
  }
  function lookup(q, k) {
    const C = corpus(), qs = [...new Set(words(q).filter(w => !STOP.has(w)))]; if (!qs.length) return [];
    return C.docs.map(d => { let s = 0; for (const w of qs) { const tf = d.tf[w] || 0; if (tf) s += (1 + Math.log(tf)) * Math.log(1 + C.N / (C.df[w] || 1)); } if (s && qs.some(w => d.src.toLowerCase().includes(w))) s *= 1.5; return { d, s: s * d.w }; })
      .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k || 10).map(x => x.d);
  }

  /* ================================================================ files: the book, maps for online tables */
  async function saveFile(name, data, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: type || "text/html" });
    let dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null; } catch (e) { dl = null; }
    if (dl) { try { await dl.save({ filename: name, data: blob }); return "saved"; } catch (e) { if (e && e.code === "declined") return "declined"; if (e && !["unavailable", "not_granted", "capability_disabled", "capability_removed"].includes(e.code)) return "failed: " + (e.message || e.code); } }
    try { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 8000); return "saved"; } catch (e) { return "failed"; }
  }
  const fileSlug = s => String(s || "atlas").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "atlas";
  // a zip of stored files (no compression): enough for an image and its walls
  function zip(files) {
    const tab = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; tab[n] = c >>> 0; }
    const crc = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = tab[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
    const enc = new TextEncoder(), d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const parts = [], central = []; let off = 0;
    for (const f of files) {
      const nm = enc.encode(f.name), data = f.data, c = crc(data);
      const lh = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, c, 4], [18, data.length, 4], [22, data.length, 4], [26, nm.length, 2], [28, 0, 2]].forEach(([o, v, n]) => n === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true));
      parts.push(new Uint8Array(lh.buffer), nm, data);
      const ch = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, c, 4], [20, data.length, 4], [24, data.length, 4], [28, nm.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]].forEach(([o, v, n]) => n === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true));
      central.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + data.length;
    }
    const size = central.reduce((n, a) => n + a.length, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, size, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
  }
  // walls and doors in squares, as the players' map draws them (secret doors are wall; hidden rooms are left off)
  function wallsOf(F) {
    const own = Array.from({ length: F.h }, () => Array(F.w).fill(null));
    for (const r of F.R) { const [rid, x, y, w, h, , kind, o = {}] = r; if (o.h) continue; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < F.h && i >= 0 && i < F.w) own[j][i] = { rid, kind, o }; }
    const at = (i, j) => (i < 0 || j < 0 || i >= F.w || j >= F.h) ? null : own[j][i], indoor = c => !!c && A.isIndoorKind(c.kind);
    const gap = new Set(), portals = [];
    for (const [x, y, o, type = "d", len = 1] of F.D || []) {
      if (type === "s" || type === "w") continue;
      for (let k = 0; k < len; k++) gap.add(o + (o === "h" ? (x + k) + ":" + y : x + ":" + (y + k)));
      if (type !== "a") portals.push(o === "h" ? { position: { x: x + len / 2, y }, bounds: [{ x, y }, { x: x + len, y }], rotation: 0, closed: true, freestanding: false } : { position: { x, y: y + len / 2 }, bounds: [{ x, y }, { x, y: y + len }], rotation: Math.PI / 2, closed: true, freestanding: false });
    }
    const segs = [];
    for (let j = 0; j <= F.h; j++) { let run = null; for (let i = 0; i <= F.w; i++) { const a = at(i, j - 1), b = at(i, j), wall = i < F.w && !((a && b && a.rid === b.rid) || (!indoor(a) && !indoor(b))) && !gap.has("h" + i + ":" + j); if (wall) { if (!run) run = [i, i + 1]; else run[1] = i + 1; } else if (run) { segs.push([{ x: run[0], y: j }, { x: run[1], y: j }]); run = null; } } }
    for (let i = 0; i <= F.w; i++) { let run = null; for (let j = 0; j <= F.h; j++) { const a = at(i - 1, j), b = at(i, j), wall = j < F.h && !((a && b && a.rid === b.rid) || (!indoor(a) && !indoor(b))) && !gap.has("v" + i + ":" + j); if (wall) { if (!run) run = [j, j + 1]; else run[1] = j + 1; } else if (run) { segs.push([{ x: i, y: run[0] }, { x: i, y: run[1] }]); run = null; } } }
    return { segs, portals };
  }
  function pngOf(id, fi, ppg) {
    const F = A.get(id).floors[fi], W = F.w * A.C, H = F.h * A.C;
    let s = A.svg(id, fi, "player", "v" + (A.state.n++)).replace(/ class="lmap2"( style="[^"]*")?/, "").replace(/viewBox="[^"]*"/, `viewBox="0 0 ${W} ${H}" width="${F.w * ppg}" height="${F.h * ppg}"`);
    return new Promise((ok, no) => {
      const img = new Image();
      img.onload = () => { const cv = document.createElement("canvas"); cv.width = F.w * ppg; cv.height = F.h * ppg; const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height); cv.toBlob(b => b ? ok(b) : no(new Error("no image")), "image/png"); };
      img.onerror = () => no(new Error("the map would not draw"));
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    });
  }
  const b64 = buf => { let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  async function exportVTT(id, note) {
    const M = A.get(id), files = [], enc = new TextEncoder();
    for (let fi = 0; fi < M.floors.length; fi++) {
      const F = M.floors[fi]; if (A.isGmFloor(F)) continue;
      const ppg = Math.max(30, Math.min(100, Math.floor(Math.sqrt(16e6 / (F.w * F.h))))), png = await pngOf(id, fi, ppg), buf = await png.arrayBuffer(), { segs, portals } = wallsOf(F);
      const uvtt = { format: 0.3, resolution: { map_origin: { x: 0, y: 0 }, map_size: { x: F.w, y: F.h }, pixels_per_grid: ppg }, line_of_sight: segs, objects_line_of_sight: [], portals, environment: { baked_lighting: true, ambient_light: "ffffffff" }, lights: [], image: b64(buf) };
      const base = `${fileSlug(M.t || id)}-${String(fi + 1).padStart(2, "0")}-${fileSlug(F.n)}`;
      files.push({ name: base + ".dd2vtt", data: enc.encode(JSON.stringify(uvtt)) }, { name: base + ".png", data: new Uint8Array(buf) });
      if (note) note(`Drawn ${F.n}…`);
    }
    files.push({ name: "READ ME.txt", data: enc.encode(`${M.t}: maps for online tables, made by Campaign Atlas.\r\n\r\nEach floor comes twice: a .dd2vtt file (the map with its walls and doors, the Universal VTT format) and a plain picture (.png).\r\n\r\nFoundry VTT: install the "Universal Battlemap Importer" module, then create a scene from the .dd2vtt file.\r\nRoll20, Owlbear Rodeo, Fantasy Grounds and others: use the .png as the map. One square of the grid is ${(cfg().grid || {}).unit || 5} ${(cfg().grid || {}).name || "ft"}.\r\n\r\nThese are the players' maps: secret rooms and secret doors are left off, as on the players' map.\r\n`) });
    return saveFile(fileSlug(M.t || id) + "-online-table-maps.zip", zip(files));
  }
  // in-page printing: the thing to print is put in its own box, which alone prints
  function printNow(html, cls) {
    let el = document.getElementById("atlasPrint"); if (!el) { el = document.createElement("div"); el.id = "atlasPrint"; document.body.appendChild(el); }
    el.className = cls || ""; el.innerHTML = html; document.body.classList.add("printing");
    const done = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    try { window.print(); } catch (e) { done(); return false; }
    return true;
  }
  function bookHTML() {
    const c = cfg(), pad = n => String(n).padStart(2, "0"), parts = [], md = X.md;
    const open = h => h.replace(/<details(?![^>]*\bopen\b)/g, "<details open").replace(/<button[^>]*class="(fold-all|nar-btn|nar-set|lm-flb|lm-go)"[^>]*>[\s\S]*?<\/button>/g, m => /lm-flb|lm-go/.test(m) ? m.replace(/<button[^>]*>/, "<span>").replace(/<\/button>$/, "</span>") : "");
    parts.push(`<section class="bk-title"><div class="bk-sys">${esc([c.system, c.setting].filter(Boolean).join(" · "))}</div><h1>${esc(c.title)}</h1>${c.strap ? `<p class="bk-strap">${esc(c.strap)}</p>` : ""}<p class="bk-for">The ${esc(gmName())}'s book</p></section>`);
    const story = (A.storyData || []).filter(ch => ch.group === "The story");
    parts.push(`<section class="bk-toc"><h2>Contents</h2><ol>${story.map(ch => `<li>${esc(ch.title)}</li>`).join("")}${X.P.length ? `<li>The places</li>` : ""}${Object.keys(A.castData || {}).length ? `<li>The people</li>` : ""}${Object.keys(A.pcsData || {}).length ? `<li>The players' characters</li>` : ""}${sessions().length ? `<li>The sessions</li>` : ""}${(A.clocksData || []).length ? `<li>The clocks</li>` : ""}${T.allHandouts().length ? `<li>Handouts</li>` : ""}</ol></section>`);
    for (const ch of story) parts.push(`<section class="bk-ch"><h2>${esc(ch.title)}</h2>${md(ch.md.replace(/^\s*#\s+.*\n/, ""))}</section>`);
    for (const p of X.P) {
      const M = p.M || {};
      const maps = p.M ? M.floors.map((F, fi) => `<figure class="bk-map">${A.svg(p.id, fi, "gm", "b" + (A.state.n++), 99)}</figure>`).join("") : "";
      const ppl = Object.values(M.npcs || {}).map(n => { const cc = X.castOf(n) || {}, [nm, role] = X.who(n), g = k => n[k] || cc[k]; return `<div class="bk-p"><b>${esc(nm)}</b>${role ? `, ${esc(role)}` : ""}${["look", "manner", "bg", "want", "secret", "knows", "rev"].map(k => g(k) ? `<p><span class="kl">${{ look: "Looks", manner: "Manner", bg: "Story", want: "Wants", secret: "Secret", knows: "Knows", rev: "Reveals" }[k]}</span>${esc(g(k))}</p>` : "").join("")}${statBlock(n.stats || cc.stats)}</div>`; }).join("");
      parts.push(`<section class="bk-pl"><div class="bk-eye">No. ${pad(p.n)} · ${esc(p.dist)}</div><h2>${esc(p.name)}</h2>${p.sub ? `<p class="bk-sub">${esc(p.sub)}</p>` : ""}${M.ext ? `<h3>First impressions</h3><p class="bk-ra">${esc(M.ext)}</p>` : ""}${M.ov ? `<h3>What's really going on</h3><p>${esc(M.ov)}</p>` : ""}${maps}${p.M ? `<div class="bk-ref">${open(A.ref(p.id, 99))}</div>` : ""}${ppl ? `<h3>People here</h3>${ppl}` : ""}</section>`);
    }
    const cast = Object.values(A.castData || {});
    if (cast.length) parts.push(`<section class="bk-ch"><h2>The people</h2>${cast.map(cc => `<div class="bk-p"><b>${esc(cc.n)}</b>${cc.role ? `, ${esc(cc.role)}` : ""}${["look", "manner", "voice", "bg", "want", "secret", "lie", "press", "fate"].map(k => cc[k] ? `<p><span class="kl">${k}</span>${esc(cc[k])}</p>` : "").join("")}${statBlock(cc.stats)}</div>`).join("")}</section>`);
    const pcs = Object.values(A.pcsData || {});
    if (pcs.length) parts.push(`<section class="bk-ch"><h2>The players' characters</h2>${pcs.map(pc => `<div class="bk-p"><b>${esc(pc.n)}</b>${pc.player ? ` (${esc(pc.player)})` : ""}${pc.concept ? `, ${esc(pc.concept)}` : ""}${[["Story", pc.bg], ["The hook", pc.hook], ["Their secret", pc.secret], ["Theirs to find", pc.clue ? `${pc.clue.t || ""}${pc.clue.at ? " (at " + placeName(pc.clue.at) + ")" : ""}${pc.clue.d ? ": " + pc.clue.d : ""}` : ""]].map(([k, v]) => v ? `<p><span class="kl">${k}</span>${esc(v)}</p>` : "").join("")}</div>`).join("")}</section>`);
    if (sessions().length) parts.push(`<section class="bk-ch"><h2>The sessions</h2>${sessions().map(s => `<div class="bk-p"><b>Session ${esc(s.n)}${s.title ? ": " + esc(s.title) : ""}</b>${s.start ? `<p><span class="kl">Start</span>${esc(s.start)}</p>` : ""}${toList(s.places).length ? `<p><span class="kl">Places</span>${toList(s.places).map(id => esc(placeName(id))).join(", ")}</p>` : ""}${s.cliff ? `<p><span class="kl">Cliffhanger</span>${esc(s.cliff)}</p>` : ""}</div>`).join("")}</section>`);
    if ((A.clocksData || []).length) parts.push(`<section class="bk-ch"><h2>The clocks</h2>${A.clocksData.map(ck => `<div class="bk-p"><b>${esc(ck.name)}</b>${ck.who ? ` (${esc(ck.who)})` : ""}<ol>${(ck.ticks || []).map(t => `<li>${esc(t)}</li>`).join("")}</ol>${ck.done ? `<p><span class="kl">When it is full</span>${esc(ck.done)}</p>` : ""}</div>`).join("")}</section>`);
    const hs = T.allHandouts();
    if (hs.length) parts.push(`<section class="bk-ch"><h2>Handouts</h2><p>Each on its own page, to cut out or copy.</p></section>` + hs.map(h => `<section class="bk-ho">${T.handoutHTML(h)}</section>`).join(""));
    return `<div class="bk">${parts.join("")}</div>`;
  }
  function bookFile() {
    const styles = [...document.querySelectorAll("style")].map(s => s.textContent).join("\n"), fonts = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.outerHTML).join("\n");
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(cfg().title)}: the ${esc(gmName())}'s book</title>${fonts}<style>${styles}</style></head><body class="bk-file">${bookHTML()}</body></html>`;
  }

  /* ================================================================ the "At the table" view
     The user found the first version hard to find their way in (20 Oct 2026), so it opens on "Start here": the two
     things a game night turns on (the players' screen, tonight's sheet), every other tool as a card saying what it is
     for, and how a game night goes. The tools are listed down the side with what each does; the quickest ones are also
     in a toolbar at the bottom right of every page (the dock), and each place's page has its own "At the table" row. */
  const TABS = [
    ["home", "Start here", "home", "", "What is here, and how a game night goes"],
    ["screen", "Players' screen", "screen", "play", "What the players see: a map a room at a time, handouts, faces"],
    ["tonight", "Tonight", "tonight", "play", "The session sheet, your notes, Previously on…"],
    ["clocks", "Clocks and stuck", "clocks", "play", "The villains' plans, and ideas when the table stalls"],
    ["combat", "Combat and dice", "combat", "play", "Initiative, wounds, sanity, dice"],
    ["make", "Make it up", "make", "play", "A person or a place on the spot; random tables"],
    ["ask", "Ask the campaign", "ask", "play", "A question about the story, answered from it"],
    ["board", "The board", "board", "play", "People, places and clues, joined with string"],
    ["party", "The party", "party", "prep", "The players' characters, and the players' notes"],
    ["safety", "Safety", "safety", "prep", "Lines and veils, the X-card"],
    ["export", "Print and export", "export", "prep", "The book, handouts, maps for online tables"]
  ];
  const GROUPS = { play: "During the game", prep: "Before and after" };
  // tools other files add (atlas-clueui.js: the investigation): { key, label, icon, group, desc, after, html(), bind(),
  // status(), watch: [collections] }
  const TPLUGS = [];
  function addTab(p) { TPLUGS.push(p); const at = p.after ? TABS.findIndex(t => t[0] === p.after) + 1 : TABS.length; TABS.splice(at > 0 ? at : TABS.length, 0, [p.key, p.label, p.icon, p.group, p.desc]); }
  const navBtn = ([k, l, ic, , desc]) => `<button type="button" role="tab" data-t="tab" data-tab="${k}" aria-selected="${UI.tab === k}" title="${esc(desc)}">${T.icon(ic)}<span class="tvn-l">${esc(l)}</span><span class="tvn-d">${esc(desc)}</span></button>`;
  function view() {
    const box = $("#tablev"); if (!box) return;
    dismissIntro();
    if (!box.dataset.done) {
      box.dataset.done = 1;
      box.innerHTML = `<div class="tv">
        <div class="tv-head"><div><div class="st-kicker">${esc(gmName())} only</div><h2 class="tv-h">At the table</h2><p class="tv-lead">Everything for game night: what your players see, tonight's sheet, the villains' clocks, fights and dice, people and places made up on the spot.</p></div>
          <div class="tv-acts"><button type="button" class="t-btn prim" data-t="openscreen">${T.icon("open")}Open the players' screen</button><button type="button" class="t-btn" data-t="tablet" aria-pressed="${app().dataset.tablet === "1"}" title="Bigger buttons, and the tools along the bottom: for a tablet beside you at the table">${app().dataset.tablet === "1" ? "Table-side view: on" : "Table-side view"}</button></div></div>
        <div class="tv-wrap"><nav class="tv-nav" role="tablist" aria-label="At the table">${navBtn(TABS[0])}${Object.entries(GROUPS).map(([g, gl]) => `<div class="tvn-g">${esc(gl)}</div>${TABS.filter(t => t[3] === g).map(navBtn).join("")}`).join("")}</nav>
        <div class="tv-main"><div class="tv-body" id="tvBody" role="tabpanel"></div><p class="tv-note" id="tvNote" aria-live="polite"></p></div></div></div>`;
    }
    box.querySelectorAll(".tv-nav [data-tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === UI.tab));
    renderTab();
  }
  const app = () => document.getElementById("app");
  function note(t) { const n = $("#tvNote") && visible() ? $("#tvNote") : $("#tDockNote"); if (n) { n.textContent = t; clearTimeout(note.t); note.t = setTimeout(() => { n.textContent = ""; }, 6000); } }
  function renderTab() {
    const body = $("#tvBody"); if (!body) return;
    const a = document.activeElement; if (a && body.contains(a) && /^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName) && a.type !== "button") { UI.dirty = true; return; }
    UI.dirty = false;
    const plug = TPLUGS.find(p => p.key === UI.tab);
    const f = plug ? plug.html : { home: homeHTML, tonight: tonightHTML, screen: screenHTML, clocks: clocksHTML, combat: combatHTML, make: makeHTML, board: boardHTML, party: partyHTML, safety: safetyHTML, ask: askHTML, export: exportHTML }[UI.tab] || homeHTML;
    body.innerHTML = f();
    if (UI.tab === "board") bindBoard();
    if (plug && plug.bind) plug.bind(body);
    fitPreviews(); requestAnimationFrame(fitPreviews); fogPrev3();
    if (UI.tab === "screen") lanPaint();
  }
  const visible = () => X && X.state.view === "table";
  const refresh = tabs => { if (visible() && (!tabs || tabs.includes(UI.tab))) renderTab(); };

  /* ---- Start here */
  const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + "s"}`;
  function statusOf(k) {
    const plug = TPLUGS.find(p => p.key === k); if (plug) return plug.status ? plug.status() : "";
    switch (k) {
      case "clocks": { const l = A.clocksData || [], ticked = l.reduce((n, c) => n + clockAt(c), 0); return l.length ? plural(l.length, "clock") + (ticked ? ` · ${plural(ticked, "tick")} so far` : " · none ticked yet") : "None in this campaign"; }
      case "combat": { const c = cnow(); return c.round ? `Round ${c.round} · ${c.list.length} in the fight` : c.list.length ? `${c.list.length} ready to fight` : "No fight now"; }
      case "make": { const n = Object.keys(S.get("fly") || {}).length; return n ? `${n} kept` : "A name, a face, a place"; }
      case "ask": return "Answers from the story itself";
      case "board": { const m = T.boardModel(), on = m.nodes.filter(nd => found(nd.id)).length; return `${plural(m.nodes.length, "card")} · ${on} on the players' board`; }
      case "party": { const p = Object.keys(A.pcsData || {}).length, j = Object.keys(S.get("journal") || {}).length; return `${plural(p, "character")} · ${plural(j, "note")} from the players`; }
      case "safety": { const z = lines(); return z.lines.length || z.veils.length ? `${plural(z.lines.length, "line")}, ${plural(z.veils.length, "veil")}` : "Not set yet: do it before the first game"; }
      case "export": return `${plural(T.allHandouts().length, "handout")} · ${plural(X.P.filter(p => p.M).length, "place")} with maps`;
      default: return "";
    }
  }
  function homeHTML() {
    const n = sessionNow(), s = sessionOf(n), places = tonightPlaces(), open = screenOpen();
    const left = places.reduce((k, id) => k + (X.ROWS[id] || []).filter(r => !X.clueDone(id, r.k)).length, 0);
    const card = k => { const t = TABS.find(x => x[0] === k); return `<button type="button" class="th-card" data-t="tab" data-tab="${k}">${T.icon(t[2])}<span class="th-n">${esc(t[1])}</span><span class="th-d">${esc(t[4])}</span><span class="th-s${k === "safety" && !lines().lines.length && !lines().veils.length ? " warn" : ""}">${esc(statusOf(k))}</span></button>`; };
    const go = (tab, words) => `<button type="button" class="t-link" data-t="tab" data-tab="${tab}">${words}</button>`;
    return `<div class="th">
      <div class="th-hero">
        <article class="th-big">${T.icon("screen", "big")}<div><h3>The players' screen</h3><p>A second window, for a television or another screen. Your players see only what you send it: a map a room at a time, a handout, a face, the world map.</p>
          <p class="t-scrstat${open ? " on" : ""}">${esc(screenStatus())}</p>
          <div class="t-row">${open ? `<button type="button" class="t-btn prim" data-t="tab" data-tab="screen">Choose what they see</button>` : `<button type="button" class="t-btn prim" data-t="openscreen">${T.icon("open")}Open it</button><button type="button" class="t-btn" data-t="tab" data-tab="screen">Choose what they see</button>`}</div></div></article>
        <article class="th-big">${T.icon("tonight", "big")}<div><h3>Tonight</h3><p>${s ? `Session ${esc(s.n)}${s.title ? ": " + esc(s.title) : ""}. ` : ""}${plural(places.length, "place")} they are likely to visit, ${plural(left, "clue")} still to find there.</p>${s && s.start ? `<p class="th-quote">${esc(s.start)}</p>` : ""}
          <div class="t-row"><button type="button" class="t-btn prim" data-t="tab" data-tab="tonight">Open tonight's sheet</button><button type="button" class="t-btn" data-t="printsheet">Print it</button></div></div></article>
      </div>
      <h3 class="th-h">During the game</h3><div class="th-grid">${["clocks", "combat", "make", "ask", "board"].concat(TPLUGS.filter(p => p.group === "play").map(p => p.key)).map(card).join("")}</div>
      <h3 class="th-h">Before and after</h3><div class="th-grid">${["party", "safety", "export"].concat(TPLUGS.filter(p => p.group === "prep").map(p => p.key)).map(card).join("")}</div>
      <section class="th-how"><h3>How a game night goes</h3><ol>
        <li><b>Before the first game.</b> Ask the table what must stay out of the story and what may only happen off screen, and write it under ${go("safety", "Safety")}. See how the players' characters are woven in under ${go("party", "The party")}.</li>
        <li><b>Before each game.</b> Read ${go("tonight", "tonight's sheet")}. Print it, or the handouts, if you like paper (${go("export", "Print and export")}).</li>
        <li><b>At the table.</b> Open the players' screen on the television. As the players explore, show each place's map a room at a time and give them its handouts: both are on every place's page, in the <i>At the table</i> row under its name. Tick the ${go("clocks", "clocks")} when the villains move.</li>
        <li><b>Whenever you need it.</b> The toolbar at the bottom right of every page: dice, a person made up on the spot, ideas when they're stuck, a question to the campaign, and the players' screen.</li>
        <li><b>After the game.</b> Write a few lines of notes under ${go("tonight", "Tonight")}. Next time, "Previously on…" is made from them.</li>
      </ol></section></div>`;
  }

  /* ---- Tonight */
  function tonightHTML() {
    const n = sessionNow(), s = sessionOf(n), list = sessions(), places = tonightPlaces(), notes = notesOf(n), prev = notesOf(n - 1);
    const openClues = places.flatMap(id => (X.ROWS[id] || []).filter(r => !X.clueDone(id, r.k)).map(r => ({ id, r })));
    const people = places.flatMap(id => Object.values(((A.maps[id] && A.get(id, 99)) || {}).npcs || {}).map(np => ({ id, np })));
    const start = (s && s.start) || (() => { const id = places[0]; if (!id || !A.maps[id]) return ""; const e = Object.values(A.get(id, 99).enc || {})[0]; return e ? `${e.t}: ${e.d || ""}` : A.get(id, 99).ext || ""; })();
    const rescue = (A.rescuesData || []).find(r => !r.at || places.includes(r.at)) || null;
    const backup = (() => { for (const id of places) { const t = Object.entries((A.meta[id] || {}).tables || {})[0]; if (t && t[1].length) return `${t[0]} (${placeName(id)}): ${pick(t[1])}`; } const g = generic(), k = Object.keys(g).find(k => /complication/i.test(k)); return k ? `${k}: ${pick(g[k])}` : ""; })();
    const pcs = places.flatMap(id => pcsHere(id).map(([, pc]) => ({ id, pc })));
    const hits = places.map(id => ({ id, h: safetyHits(A.meta[id] || {}) })).filter(x => x.h.length);
    const clocks = (A.clocksData || []).map(c => { const at = clockAt(c), tot = +c.segments || (c.ticks || []).length || 4; return `<li>${clockSVG(tot, at, 26)} <b>${esc(c.name)}</b> ${at}/${tot}${(c.ticks || [])[at] ? ` · next: ${esc(c.ticks[at])}` : at >= tot ? ` · <b>full</b>${c.done ? ": " + esc(c.done) : ""}` : ""}</li>`; }).join("");
    const sheet = `<article class="t-sheet print-me">
      <header class="t-sh-h"><div class="kl">${esc(cfg().title)} · tonight</div><h3>${s ? `Session ${esc(s.n)}${s.title ? ": " + esc(s.title) : ""}` : "Tonight's session"}</h3>${s && s.hours ? `<span class="kn">About ${esc(s.hours)} hours</span>` : ""}</header>
      ${start ? `<section><h4>A strong start</h4><p>${esc(start)}</p></section>` : ""}
      <section><h4>Where they are likely to go</h4>${places.length ? `<ul class="t-ul">${places.map(id => `<li>${goBtn(id)}${X.TR.ready && X.stOf(id) !== "unknown" ? ` <span class="kn">${esc(X.stOf(id))}</span>` : ""}${(A.meta[id] || {}).tagline ? ` · <span class="kn">${esc(A.meta[id].tagline)}</span>` : ""}</li>`).join("")}</ul>` : `<p class="kn">Choose a place in the gazetteer, or give the campaign a session plan.</p>`}</section>
      <section><h4>Clues still to find there</h4>${openClues.length ? `<ul class="t-ul">${openClues.slice(0, 18).map(({ id, r }) => `<li><b>${esc(r.short)}</b> ${rollBadge(r.roll)} <span class="kn">at ${esc(placeName(id))}</span>${r.to.length ? ` <span class="kn">→ ${r.to.map(t => esc(placeName(t))).join(", ")}</span>` : ""}${r.hint ? `<div class="t-small">If missed: ${esc(r.hint)}</div>` : ""}</li>`).join("")}</ul>` : `<p class="kn">None open: everything there has been found.</p>`}</section>
      ${people.length ? `<section><h4>People they may meet</h4><ul class="t-ul">${people.slice(0, 14).map(({ id, np }) => { const [nm, role] = X.who(np), c = X.castOf(np) || {}; return `<li><b>${esc(nm)}</b>${role ? `, ${esc(role)}` : ""} <span class="kn">at ${esc(placeName(id))}</span>${np.want || c.want ? `<div class="t-small">Wants: ${esc(np.want || c.want)}</div>` : ""}${(np.manner || c.manner) ? `<div class="t-small">Manner: ${esc(np.manner || c.manner)}</div>` : ""}</li>`; }).join("")}</ul></section>` : ""}
      ${pcs.length ? `<section><h4>For the players' characters</h4><ul class="t-ul">${pcs.map(({ id, pc }) => `<li><b>${esc(pc.n)}</b> at ${esc(placeName(id))}: ${esc((pc.clue && pc.clue.at === id ? pc.clue.t : pc.hook) || "")}</li>`).join("")}</ul></section>` : ""}
      ${clocks ? `<section><h4>The clocks</h4><ul class="t-ul t-clk">${clocks}</ul></section>` : ""}
      <section><h4>If it stalls</h4>${rescue ? `<p>${esc(rescue.when ? rescue.when + ": " : "")}${esc(rescue.do || rescue.d || "")}</p>` : ""}${backup ? `<p>${esc(backup)}</p>` : ""}<p class="t-small">The Clocks tab's "They're stuck" has more.</p></section>
      ${s && s.cliff ? `<section><h4>Aim to end on</h4><p>${esc(s.cliff)}</p></section>` : ""}
      ${hits.length ? `<section class="t-warnbox"><h4>Mind the lines and veils</h4><ul class="t-ul">${hits.map(x => `<li>${esc(placeName(x.id))}: ${esc(x.h.join(", "))}</li>`).join("")}</ul></section>` : ""}
    </article>`;
    return `<div class="t-grid t-g2"><div>
        <div class="t-row"><label class="t-lab">Session <select data-t="session">${list.length ? list.map(x => `<option value="${esc(x.n)}"${+x.n === n ? " selected" : ""}>${esc(x.n)}${x.title ? ": " + esc(x.title) : ""}</option>`).join("") : Array.from({ length: Math.max(n, 1) + 1 }, (_, i) => `<option value="${i + 1}"${i + 1 === n ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label><button type="button" class="t-btn" data-t="printsheet">Print tonight's sheet</button></div>
        ${sheet}</div>
      <div>
        <section class="t-card"><h3>Previously on…</h3>
          ${n > 1 ? `<p class="t-small">Made from the notes on session ${n - 1}${prev.notes ? "" : " (none written yet: write them below when the session ends, or now)"}, and what the party has found.</p>` : `<p class="t-small">The first session has nothing before it. Write tonight's notes below; next time they become the recap.</p>`}
          ${n > 1 ? `<label class="t-lab t-block">Notes on session ${n - 1}<textarea rows="4" data-t="notes" data-n="${n - 1}" placeholder="What happened, in a few lines">${esc(prev.notes || "")}</textarea></label>` : ""}
          ${n > 1 ? `<div class="t-row"><button type="button" class="t-btn prim" data-t="recap" data-n="${n - 1}">Write "Previously on…"</button></div>` : ""}
          <div class="t-recap" id="tRecap">${prev.recap ? recapBox(prev.recap) : ""}</div>
        </section>
        <section class="t-card"><h3>Tonight's notes</h3><textarea rows="6" data-t="notes" data-n="${n}" placeholder="What happens tonight: the party's choices, what they learned, who they angered. Next session's recap is made from these.">${esc(notes.notes || "")}</textarea></section>
        ${list.length ? `<section class="t-card"><h3>The session plan</h3><ol class="t-plan">${list.map(x => `<li class="${+x.n === n ? "on" : ""}"><b>${esc(x.n)}. ${esc(x.title || "")}</b>${toList(x.places).length ? `<div class="t-small">${toList(x.places).map(id => esc(placeName(id))).join(" · ")}</div>` : ""}${x.cliff ? `<div class="t-small"><i>Ends:</i> ${esc(x.cliff)}</div>` : ""}</li>`).join("")}</ol></section>` : ""}
      </div></div>`;
  }
  const recapBox = t => `<div class="t-readout"><p>${esc(t).replace(/\n+/g, "</p><p>")}</p><div class="t-row">${A.narrateBtn ? A.narrateBtn(t, "Previously on") : ""}<button type="button" class="t-mini" data-t="recapshow">Put it on the players' screen</button></div></div>`;
  async function recap(n) {
    const box = $("#tRecap"), ta = document.querySelector(`textarea[data-t="notes"][data-n="${n}"]`); if (ta) saveNotes(n, ta.value);
    const notes = (ta ? ta.value : notesOf(n).notes) || "", foundList = [];
    if (X.TR.ready) for (const p of X.P) for (const r of X.ROWS[p.id] || []) if (X.clueDone(p.id, r.k)) foundList.push(r.short);
    const s = sessionOf(n), title = cfg().title;
    const prompt = `Write the "Previously on..." for the next session of the tabletop roleplaying campaign "${title}"${cfg().system ? " (" + cfg().system + ")" : ""}, to be read aloud by the game master to the players. Address the players' characters as "you", in the past tense; vivid but short, 110 to 170 words, in plain prose with no headings or lists. Tell only what the characters saw, did and learned; never reveal a secret they have not found. End on the question still open${s && s.cliff ? " (the session was meant to end on: " + s.cliff + ")" : ""}.\n\nThe game master's notes on the last session:\n${notes || "(none)"}\n\nWhat the party has found so far:\n${foundList.slice(-24).map(x => "- " + x).join("\n") || "(nothing recorded)"}`;
    if (box) box.innerHTML = `<p class="kn">Writing…</p>`;
    let text = null;
    try { text = await askAI(prompt, t => { if (box) box.innerHTML = `<div class="t-readout"><p>${esc(t)}</p></div>`; }); } catch (e) { text = null; if (e && e.code === "rate_limited") note("Too many requests just now: try again in a minute."); }
    if (!text) {
      const said = notes.split(/\n+/).map(l => l.trim().replace(/^[-*•]\s*/, "")).filter(Boolean).map(l => /[.!?]$/.test(l) ? l : l + ".");
      text = `Previously, on ${title}… ${said.join(" ")}${foundList.length ? ` By now you know this: ${foundList.slice(-6).join("; ")}.` : ""}${s && s.cliff ? ` And still: ${s.cliff}` : ""}`.replace(/\s+/g, " ").trim();
    }
    S.set("log", "s" + n, Object.assign({}, notesOf(n), { notes, recap: text }));
    if (box) box.innerHTML = recapBox(text);
  }
  function saveNotes(n, v) { const cur = notesOf(n); if ((cur.notes || "") === v) return; S.set("log", "s" + n, Object.assign({}, cur, { notes: String(v).slice(0, 8000) })); }

  /* ---- The players' screen */
  function screenNow() { return S.get("screen", "now") || { kind: "title" }; }
  // a handout once shown is the players' to keep: their window lists every one they have been given
  function show(doc) {
    const t = Date.now();
    // a handout goes with its words, so the players' copy, which has none of the campaign, can show it and keep it
    if (doc.kind === "handout" && doc.id && !doc.h) { const h = T.allHandouts().find(x => x.id === doc.id); if (h) doc = Object.assign({}, doc, { h }); }
    S.set("screen", "now", Object.assign({ t }, doc));
    if (doc.kind === "handout" && doc.id) S.set("given", doc.id, doc.h ? { t, h: doc.h } : { t });
    note("On the players' screen now.");
  }
  function nowText(d) {
    switch (d.kind) {
      case "map": return `the map of ${placeName(d.place)}${d.floor ? ", floor " + (+d.floor + 1) : ""}${d.view === "3d" ? ", in 3D" : ""}`;
      case "handout": { const h = T.allHandouts().find(x => x.id === d.id) || d.h || {}; return `the handout "${h.title || h.headline || "untitled"}"`; }
      case "person": return d.name || "a person";
      case "scene": return d.title ? `"${d.title}"` : "words to read";
      case "world": return "the world map";
      case "board": return "their board of what they know";
      case "safety": return "the lines and veils";
      case "blank": return "nothing (a dark screen)";
      default: return "the campaign's title";
    }
  }
  // is a players' screen open? It says so every half minute (atlas-table.js)
  const screenOpen = () => Date.now() - (+((S.get("presence", "players") || {}).t) || 0) < 75000;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const screenStatus = () => screenOpen() ? `Open now, showing ${nowText(screenNow())}.` : `Not open yet. When it is, it will show ${nowText(screenNow())}.`;
  // a small copy of what the players see, so the referee knows without looking up at the television
  function previewHTML(d) {
    const k = d.kind;
    if (k === "map" && d.fly && !A.maps[d.place]) flyPlace(d.fly);
    if (k === "map" && A.maps[d.place]) { const fi = +d.floor || 0, doc = S.get("fog", d.place) || {}, fog = doc.f || {}; return `<div class="tp-map">${T.fogSVG(d.place, fi, fog[fi] || [], true, doc)}</div>`; }
    const word = (ic, w) => `<div class="tp-word">${T.icon(ic, "big")}<p>${esc(w)}</p></div>`;
    let inner = "";
    if (k === "handout") { const h = T.allHandouts().find(x => x.id === d.id) || d.h; inner = h ? T.handoutHTML(h) : ""; }
    else if (k === "person") inner = `<div class="ps-person">${T.PERSON_SIL}<h2>${esc(d.name || "")}</h2>${d.role ? `<p class="ps-role">${esc(d.role)}</p>` : ""}${d.look ? `<p>${esc(d.look)}</p>` : ""}</div>`;
    else if (k === "scene") inner = `<div class="ps-scene">${d.title ? `<h2>${esc(d.title)}</h2>` : ""}${T.paras(d.text)}</div>`;
    else if (k === "world") inner = word("map", "The world map");
    else if (k === "board") inner = word("board", "Their board");
    else if (k === "safety") inner = word("safety", "Lines and veils");
    else if (k === "blank") return "";
    else inner = `<div class="ps-title"><div>${esc(cfg().system || "")}</div><h1>${esc(cfg().title || "")}</h1>${cfg().strap ? `<p>${esc(cfg().strap)}</p>` : ""}</div>`;
    return `<div class="tp-fit">${inner}</div>`;
  }
  function fitPreviews() {
    document.querySelectorAll(".t-prev").forEach(box => {
      const el = box.querySelector(".tp-fit"); if (!el || !el.offsetWidth) return;
      const s = Math.min(box.clientWidth * .92 / el.offsetWidth, box.clientHeight * .86 / el.offsetHeight, 1);
      el.style.transform = `translate(-50%, -50%) scale(${s})`;
    });
  }
  function screenStatusPaint() {
    const on = screenOpen();
    document.querySelectorAll(".t-scrstat").forEach(el => { el.textContent = screenStatus(); el.classList.toggle("on", on); });
    const dot = document.querySelector("#tDock .t-dot"); if (dot) dot.classList.toggle("on", on);
  }
  // a place's map, a room at a time: the same editor in the Players' screen tab and in the dialog a place's page opens
  function fogEditor() {
    const d = screenNow(), mapped = X.P.filter(p => p.M), flies = Object.values(S.get("fly") || {}).filter(f => f.kind && f.kind !== "person");
    if (!UI.fogPlace) UI.fogPlace = d.kind === "map" && d.place ? d.place : (X.state.sel && A.maps[X.state.sel] ? X.state.sel : (mapped[0] || {}).id || "");
    const id = UI.fogPlace; if (id && !A.maps[id]) { const f = flies.find(x => x.id === id); if (f) flyPlace(f); }
    const M = id && A.maps[id] ? A.get(id) : null, floors = M ? M.floors.map((F, i) => [F, i]).filter(([F]) => !A.isGmFloor(F)) : [];
    if (M && !floors.some(([, i]) => i === UI.fogFloor)) UI.fogFloor = floors.length ? floors[0][1] : 0;
    const doc = id ? S.get("fog", id) || {} : {}, fog = (doc.f || {})[UI.fogFloor] || [], onScreen = d.kind === "map" && d.place === id && (+d.floor || 0) === UI.fogFloor;
    // on a cave the fog is also brushed away, or painted back, square by square (the user asked, 26 Oct 2026)
    const Fl = M ? M.floors[UI.fogFloor] : null, brush = !!(Fl && Fl.cave), mode = brush ? UI.fogMode || "rooms" : "rooms", cs = Fl && T.fogCells ? T.fogCells(doc, UI.fogFloor, Fl) : null, painted = cs ? cs.filter(c => c === "1").length : 0;
    return `<div class="t-row"><select data-t="fogplace" aria-label="Place">${mapped.map(p => `<option value="${esc(p.id)}"${p.id === id ? " selected" : ""}>${esc(p.name)}</option>`).join("")}${flies.length ? `<optgroup label="Made at the table">${flies.map(f => `<option value="${esc(f.id)}"${f.id === id ? " selected" : ""}>${esc(f.name)}</option>`).join("")}</optgroup>` : ""}</select>
        ${floors.length > 1 ? `<select data-t="fogfloor" aria-label="Floor">${floors.map(([F, i]) => `<option value="${i}"${i === UI.fogFloor ? " selected" : ""}>${esc(F.n)}</option>`).join("")}</select>` : ""}
        ${onScreen ? `<span class="t-onscr">${T.icon("screen")}On their screen</span>` : `<button type="button" class="t-btn prim" data-t="showmap" data-id="${esc(id)}">${T.icon("screen")}Put it on their screen</button>`}</div>
      ${doc.off ? `<p class="t-legend">The fog is off on this map: the players see all of it (but never what is hidden).</p>` : `<p class="t-legend"><span><i class="lg-h"></i>hidden from the players</span><span><i class="lg-s"></i>they can see it</span><span>${mode === "rooms" ? "Click a room to show it or hide it again" : mode === "reveal" ? "Drag over the map to clear the fog" : "Drag over the map to bring the fog back"} · ${plural(fog.length, "room")}${painted ? " and " + plural(painted, "square") : ""} shown on this floor</span></p>`}
      ${M && !doc.off && brush ? `<div class="t-row t-fogtools" role="group" aria-label="How to clear the fog"><button type="button" class="t-mini" data-t="fogmode" data-m="rooms" aria-pressed="${mode === "rooms"}">Room by room</button><button type="button" class="t-mini" data-t="fogmode" data-m="reveal" aria-pressed="${mode === "reveal"}">Brush the fog away</button><button type="button" class="t-mini" data-t="fogmode" data-m="cover" aria-pressed="${mode === "cover"}">Paint the fog back</button><label class="t-fogsz">Brush <select data-t="fogbrush">${[[1, "1 square"], [2, "2 squares"], [3, "3 squares"], [5, "5 squares"], [8, "8 squares"]].map(([v, l]) => `<option value="${v}"${(UI.fogBrush || 3) === v ? " selected" : ""}>${l}</option>`).join("")}</select></label></div>` : ""}
      <div class="t-row">${doc.off ? "" : `<button type="button" class="t-mini" data-t="fogall">Show every room</button><button type="button" class="t-mini" data-t="fognone">Hide them all</button>`}<button type="button" class="t-mini" data-t="fogreset" title="Every floor of this map back under fog, as before the party came">Start exploring again</button><label class="t-fogck"><input type="checkbox" data-t="fogoff"${doc.off ? "" : " checked"}> Fog on this map</label><label class="t-fogck"><input type="checkbox" data-t="fogprev"${UI.fogPrev ? " checked" : ""}> What the players see</label></div>
      ${M && A.room3d ? `<div class="t-row t-fogview" role="group" aria-label="How their screen shows the map"><span class="t-small">Their screen shows it</span><button type="button" class="t-mini" data-t="fogview" data-v="2d" aria-pressed="${fogView() !== "3d"}">Flat</button><button type="button" class="t-mini" data-t="fogview" data-v="3d" aria-pressed="${fogView() === "3d"}" title="In 3D, under the same fog: what they have not seen is not there at all">In 3D</button></div>` : ""}
      ${M && UI.fogPrev && fogView() === "3d" && A.room3d ? `<div class="t-fog3d"></div><p class="t-small">In 3D, as on their screen. To clear the fog, untick "What the players see" and use the flat map: the 3D follows it.</p>`
        : `<div class="t-fog${mode !== "rooms" ? " t-fogpaint" : ""}" data-fogpaint="${mode !== "rooms" ? mode : ""}">${M ? T.fogSVG(id, UI.fogFloor, fog, !!UI.fogPrev, doc, { hits: mode === "rooms" }) : `<p class="kn">No mapped places yet.</p>`}</div>`}`;
  }
  function openFog(id) {
    if (!id || !A.maps[id]) return;
    UI.fogPlace = id; const M = A.get(id), first = M.floors.findIndex(F => !A.isGmFloor(F)); UI.fogFloor = Math.max(0, first);
    const fl = Object.values(S.get("fly") || {}).find(f => f.id === id) || (UI.fly && UI.fly.id === id ? UI.fly : null);
    show({ kind: "map", place: id, floor: UI.fogFloor, fly: fl || null, view: fogView() });
    let dlg = document.getElementById("tFogDlg");
    if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "tFogDlg"; dlg.className = "t-dlg t-fogdlg"; document.body.appendChild(dlg); dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-x]")) dlg.close(); }); }
    fogDlgPaint(dlg);
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  function fogDlgPaint(dlg) {
    dlg = dlg || document.getElementById("tFogDlg"); if (!dlg || (!dlg.open && dlg.showModal)) return;
    const sc = dlg.querySelector(".t-fog") ? dlg.querySelector(".t-fog").scrollTop : 0;
    dlg.innerHTML = `<div class="t-dlgbar">${T.icon("screen")}<b>On the players' screen: ${esc(placeName(UI.fogPlace))}</b><span class="t-sp"></span><span class="t-scrstat${screenOpen() ? " on" : ""}">${esc(screenStatus())}</span>${screenOpen() ? "" : `<button type="button" class="t-mini" data-t="openscreen">Open it</button>`}<button type="button" class="t-mini" data-x="1">Done</button></div><div class="t-dlgbody t-light"><p class="t-small">The players see this place's map with every room dark. Click a room when they enter it, and it appears on their screen.</p>${fogEditor()}</div>`;
    const f = dlg.querySelector(".t-fog"); if (f) f.scrollTop = sc;
    fogPrev3();
  }
  // how the players' screen shows a map: flat, or in 3D (the user asked for the fog in 3D, 27 Oct 2026); a campaign
  // whose rooms are in 3D starts in 3D
  const fogView = () => UI.fogView || (A.config.maps === "3d" ? "3d" : "2d");
  // "What the players see", in 3D: one view, moved into whichever fog panel is drawn, shown again as the fog changes
  let prev3 = null;
  function fogPrev3() {
    const ph = document.querySelector("#tFogDlg[open] .t-fog3d") || document.querySelector("#tvBody .t-fog3d");
    if (!ph) { if (prev3) { prev3.dispose(); prev3 = null; } return; }
    if (!prev3) { const h = document.createElement("div"); h.className = "t-fog3dh"; prev3 = T.fog3d(h); }
    if (prev3.host.parentNode !== ph) ph.appendChild(prev3.host);
    const doc = S.get("fog", UI.fogPlace) || {};
    prev3.show(UI.fogPlace, UI.fogFloor, (doc.f || {})[UI.fogFloor] || [], doc);
  }
  function screenHTML() {
    const d = screenNow(), hs = T.allHandouts(), open = screenOpen();
    const people = Object.entries(A.castData || {});
    const tile = (k, l, ic) => `<button type="button" class="t-tile${d.kind === k ? " on" : ""}" data-t="screen" data-kind="${k}" aria-pressed="${d.kind === k}">${T.icon(ic)}<span>${l}</span></button>`;
    return `<section class="t-card t-scr">
        <div class="t-scr-l"><h3>${T.icon("screen")} The players' screen</h3>
          <p class="t-scrstat${open ? " on" : ""}">${esc(screenStatus())}</p>
          <ol class="t-steps"><li><b>Open it.</b> It opens in a window of its own: drag that onto the television or the second screen, and press ⤢ on it for full screen.</li><li><b>Choose what they see</b> below. Their screen changes at once; the picture here shows what is on it.</li></ol>
          <p class="t-small">It is the players' own window, with nothing of yours on it. Besides what you send to the table, it keeps every handout you have given them, their board, the places they know (only the rooms they have seen) and their notes, each a click away for them.</p>
          <div class="t-row"><button type="button" class="t-btn prim" data-t="openscreen">${T.icon("open")}Open the players' screen</button></div>
          <p class="t-small">On another computer or a tablet instead: open this same page there, and on that one press <button type="button" class="t-link" data-t="beplayers">make this window the players' screen</button>. (Pressed here, it turns this page into theirs.)</p></div>
        <div class="t-scr-r"><div class="kl">What they see now</div><div class="t-prev" role="img" aria-label="${esc(cap(nowText(d)))}">${previewHTML(d)}</div><div class="t-small">${esc(cap(nowText(d)))}</div></div>
      </section>
      ${lanAvail() ? `<section class="t-card t-lan"><h3>${T.icon("party")} On the players' own phones and laptops</h3><div id="tLan"><p class="t-small">…</p></div></section>` : ""}
      <section class="t-card"><h3>Show them</h3><div class="t-tiles">${tile("title", "The title", "play")}${A.worldData && A.worldMount ? tile("world", "The world map", "map") : ""}${tile("board", "Their board", "board")}${tile("safety", "Lines and veils", "safety")}${tile("blank", "A dark screen", "close")}</div></section>
      <div class="t-grid t-g2"><div>
        <section class="t-card"><h3>${T.icon("map")} A map, a room at a time</h3>${fogEditor()}</section></div>
      <div>
        <section class="t-card"><h3>${T.icon("handout")} Handouts</h3>${hs.length ? `<ul class="t-hl">${hs.map(h => `<li><b>${esc(h.title || h.headline || "Untitled")}</b> <span class="kn">${esc(h.kind || T.ERA_KIND[T.era()] || "letter")}${h.place ? " · " + esc(placeName(h.place)) : ""}</span><span class="t-row">${handoutBtns(h.id)}<button type="button" class="t-mini" data-t="hprint" data-id="${esc(h.id)}">Print</button></span></li>`).join("")}</ul>` : `<p class="kn">None yet. A clue becomes a handout when the council gives it one (handout: on the clue).</p>`}</section>
        <section class="t-card"><h3>${T.icon("person")} A face</h3><div class="t-row"><select data-t="facepick" aria-label="Who">${people.map(([cid, c]) => `<option value="${esc(cid)}">${esc(c.n)}</option>`).join("")}</select><button type="button" class="t-btn" data-t="showface">Show who they're meeting</button></div><p class="t-small">Their name, what they do and how they look; nothing they hide.</p></section>
        <section class="t-card"><h3>${T.icon("tonight")} Words to read</h3><input class="t-in" data-t="scenetitle" placeholder="A title (optional)" maxlength="120"><textarea rows="4" data-t="scenetext" placeholder="Words to show the players: a description, a sign, a message"></textarea><div class="t-row"><button type="button" class="t-btn" data-t="showscene">Show it to them</button></div></section>
      </div></div>`;
  }
  /* ---- the players on their own phones (the Atlas app only: app/lib/players-lan.js). The app opens the players' copy
          to this computer's network when the game master says so, with a link and its QR code. */
  const lanAvail = () => !!(window.ATLAS_APP && window.ATLAS_APP.lan);
  function lanFill(d) {
    const box = $("#tLan"); if (!box) return;
    if (!d) { box.innerHTML = `<p class="t-small">The app did not answer: is it still running?</p>`; return; }
    if (!d.on) { box.innerHTML = `<p class="t-small">Each player can follow the game on their own phone or laptop: the same players' copy as the television, with nothing of yours in it, on this computer's Wi-Fi. Nothing is reachable from the network until you switch it on here.</p><div class="t-row"><button type="button" class="t-btn prim" data-t="lanon">Let the players join from this Wi-Fi</button></div><p class="t-small">The first time, Windows may ask whether Node.js may use private networks: allow it. Only the players' copy can be reached, and only with the link.</p>`; return; }
    const url = (d.urls || [])[0];
    box.innerHTML = `${d.error ? `<p class="t-warnbox">${esc(d.error)}</p>` : ""}${url ? `<div class="t-lanqr">${d.qr || ""}<div><p class="t-small">Players point their phone's camera at the code, or type the address:</p><p class="t-lanurl">${esc(url)}</p>${(d.urls || []).length > 1 ? `<p class="t-small">On another network of this computer: ${d.urls.slice(1).map(esc).join(", ")}</p>` : ""}<div class="t-row"><button type="button" class="t-mini" data-t="lancopy" data-url="${esc(url)}">Copy the link</button><button type="button" class="t-mini" data-t="lannew" title="The old link stops working at once">A new link</button><button type="button" class="t-mini" data-t="lanoff">Stop letting them join</button></div></div></div>` : `<p class="t-small">This computer is not on a network a phone can reach. Join the Wi-Fi, then look again.</p><div class="t-row"><button type="button" class="t-mini" data-t="lanoff">Stop letting them join</button></div>`}<p class="t-small">Their phones must be on the same Wi-Fi as this computer, and the app must stay open.</p>`;
  }
  const lanPaint = o => { if (!lanAvail() || !$("#tLan")) return; window.ATLAS_APP.lan(o).then(lanFill, () => lanFill(null)); };
  function toggleRoom(rid) {
    const id = UI.fogPlace, fi = UI.fogFloor, cur = S.get("fog", id) || {}, f = Object.assign({}, cur.f || {}), set = new Set(f[fi] || []);
    set.has(rid) ? set.delete(rid) : set.add(rid); f[fi] = [...set]; S.set("fog", id, Object.assign({}, cur, { f }));
  }
  function setRooms(all) {
    const id = UI.fogPlace, fi = UI.fogFloor, F = A.get(id).floors[fi], cur = S.get("fog", id) || {}, f = Object.assign({}, cur.f || {});
    f[fi] = all ? [...new Set(F.R.filter(r => !(r[7] && r[7].h) && !A.isSolid(r[6])).map(r => r[0]))] : []; const c = Object.assign({}, cur.c || {}); delete c[fi]; S.set("fog", id, Object.assign({}, cur, { f, c }));
  }
  // the fog brushed away (v "1") or painted back ("0") over squares of the floor, kept square by square
  function paintFog(cells, v) {
    const id = UI.fogPlace, fi = UI.fogFloor, F = A.get(id).floors[fi], cur = S.get("fog", id) || {}, cs = T.fogCells(cur, fi, F) || Array(F.w * F.h).fill(".");
    for (const [x, y] of cells) if (x >= 0 && y >= 0 && x < F.w && y < F.h) cs[y * F.w + x] = v;
    S.set("fog", id, Object.assign({}, cur, { c: Object.assign({}, cur.c || {}, { [fi]: cs.join("") }), cw: Object.assign({}, cur.cw || {}, { [fi]: F.w }) }));
  }

  /* ---- Clocks, and "They're stuck" */
  function clocksHTML() {
    const list = A.clocksData || [];
    const cards = list.map(c => {
      const tot = +c.segments || (c.ticks || []).length || 4, at = clockAt(c), full = at >= tot;
      return `<section class="t-card t-clock${full ? " full" : ""}"><div class="t-clkh">${clockSVG(tot, at, 72)}<div><h3>${esc(c.name)}</h3>${c.who ? `<div class="kn">${esc(c.who)}</div>` : ""}<div class="t-row"><button type="button" class="t-mini" data-t="tick" data-id="${esc(c.id)}" data-d="-1" aria-label="Take back a tick"${at ? "" : " disabled"}>−</button><b class="t-clkn">${at} of ${tot}</b><button type="button" class="t-mini" data-t="tick" data-id="${esc(c.id)}" data-d="1" aria-label="Tick it"${full ? " disabled" : ""}>+ Tick</button></div></div></div>
        ${c.when ? `<p class="t-small"><b>Tick it when</b> ${esc(c.when)}</p>` : ""}
        <ol class="t-ticks">${(c.ticks || []).map((t, i) => `<li class="${i < at ? "done" : i === at ? "next" : ""}">${esc(t)}</li>`).join("")}</ol>
        ${c.done ? `<p class="${full ? "t-warnbox" : "t-small"}"><b>When it is full</b> ${esc(c.done)}</p>` : ""}</section>`;
    }).join("");
    return `<div class="t-grid t-g2"><div>${cards || `<section class="t-card"><h3>The villains' clocks</h3><p class="kn">This campaign has no clocks yet. The council gives each enemy who is working while the party investigates a clock: a few steps, each one saying what changes in the world.</p></section>`}</div>
      <div><section class="t-card t-stuck"><h3>${T.icon("stuck")} They're stuck</h3><p class="t-small">When the table goes quiet and nobody knows where to go: ways to bring the story back to them, from what is still open.</p><button type="button" class="t-btn prim" data-t="stuck">They're stuck</button><div id="tStuck">${UI.stuck ? stuckHTML(UI.stuck) : ""}</div></section></div></div>`;
  }
  function stuckIdeas() {
    const out = [], here = X.state.sel, places = [...new Set([here, ...tonightPlaces()])].filter(Boolean);
    for (const id of places) for (const r of X.ROWS[id] || []) if (!X.clueDone(id, r.k) && (r.rescue || r.hint)) out.push({ kind: "clue", place: id, title: r.short, text: r.rescue || r.hint, to: r.to });
    for (const r of A.rescuesData || []) if (!r.at || places.includes(r.at)) out.push({ kind: "rescue", place: r.at, title: r.when || "A way back", text: r.do || r.d || "" });
    if (X.TR.ready) for (const p of X.P) { const a = X.accessInfo(p.id); if (!a.acc && a.ways.length === 1 && !["resolved", "closed"].includes(X.stOf(p.id))) out.push({ kind: "fragile", place: p.id, title: `Only one way to ${p.name}`, text: `Its one lead, "${a.ways[0].text}", is not found yet. Give them a second way in: someone mentions it, a handout names it, or a person from there comes looking for them.` }); }
    for (const c of A.clocksData || []) { const at = clockAt(c), tot = +c.segments || (c.ticks || []).length || 4; if (at < tot && (c.ticks || [])[at]) out.push({ kind: "clock", title: `Move a clock: ${c.name}`, text: `Tick the clock: ${c.ticks[at]} When the enemy acts, the party has something to chase.`, clock: c.id }); }
    for (const p of X.P) { if (!p.M || !X.TR.ready) continue; for (const n of Object.values(p.M.npcs || {})) { const to = toList(n.to).filter(t => !X.accessInfo(t).acc); if (to.length) { const [nm] = X.who(n); out.push({ kind: "person", place: p.id, title: `${nm} comes to them`, text: `${nm} knows the way to ${to.map(placeName).join(", ")}${n.knows ? ": " + String(n.knows).replace(/[.\s]+$/, "") : ""}. Let them seek the party out, with a reason of their own.` }); } } }
    // most useful first: the place they are at, then the council's own rescues, then the rest
    const rank = { clue: 0, rescue: 1, person: 2, fragile: 3, clock: 4 };
    return out.sort((a, b) => rank[a.kind] - rank[b.kind]).slice(0, 8);
  }
  const stuckHTML = ideas => ideas.length ? `<ol class="t-ideas">${ideas.map(i => `<li><b>${esc(i.title)}</b>${i.place ? ` <span class="kn">${esc(placeName(i.place))}</span>` : ""}<p>${esc(i.text)}</p>${i.to && i.to.length ? `<p class="t-small">It leads to ${i.to.map(goBtn).join(", ")}</p>` : ""}${i.clock ? `<button type="button" class="t-mini" data-t="tick" data-id="${esc(i.clock)}" data-d="1">Tick it</button>` : ""}</li>`).join("")}</ol>` : `<p class="kn">Nothing is open that the campaign knows of. Ask the campaign, or make a person or a place up on the spot.</p>`;

  /* ---- Combat: initiative, wounds, sanity */
  const cnow = () => { const c = S.get("combat", "now") || {}; return { round: +c.round || 0, turn: +c.turn || 0, list: Array.isArray(c.list) ? c.list : [] }; };
  const cset = c => S.set("combat", "now", c);
  function fighters() {
    const out = [], pcs = Object.entries(A.pcsData || {});
    for (const [id, pc] of pcs) out.push({ g: "The party", id: "pc:" + id, name: pc.n, stats: pc.stats || {} });
    if (!pcs.length && X.TR.party) for (const m of X.TR.party) out.push({ g: "The party", id: "pm:" + m.id, name: m.name, stats: {} });
    for (const [id, c] of Object.entries(A.castData || {})) if (c.stats) out.push({ g: "The people", id: "c:" + id, name: c.n, stats: c.stats });
    const here = X.state.sel, M = here && A.maps[here] ? A.get(here, 99) : null;
    if (M) { for (const [k, e] of Object.entries(M.enc || {})) if (e.stats) out.push({ g: "Here: " + placeName(here), id: "e:" + here + ":" + k, name: e.t || k, stats: e.stats, count: e.count }); for (const [k, n] of Object.entries(M.npcs || {})) if (n.stats && !n.who) out.push({ g: "Here: " + placeName(here), id: "n:" + here + ":" + k, name: X.who(n)[0], stats: n.stats }); }
    return out;
  }
  function fighterRow(f, n) {
    const st = f.stats || {}, sys = SYS(), g = k => st[k] != null ? +st[k] || st[k] : st[k.toLowerCase()] != null ? st[k.toLowerCase()] : null, dex = +g("DEX") || 0;
    const init = sys === "coc" ? (dex || 50) : sys === "d20" ? T.roll("1d20").total + (dex ? Math.floor((dex - 10) / 2) : 0) : T.roll("1d20").total;
    const hp = parseInt(g("HP"), 10) || (f.g === "The party" ? null : 10);
    return { id: uid("f"), name: n ? f.name + " " + n : f.name, init, hp, hpMax: hp, san: parseInt(g("SAN"), 10) || null, sanMax: parseInt(g("SAN"), 10) || null, luck: parseInt(g("Luck"), 10) || null, mp: parseInt(g("MP"), 10) || null, ac: g("AC"), side: f.g === "The party" ? "pc" : "foe", note: "" };
  }
  function combatHTML() {
    const c = cnow(), sys = SYS(), F = fighters(), groups = [...new Set(F.map(f => f.g))];
    const cols = sys === "coc" ? [["hp", "HP"], ["san", "SAN"], ["luck", "Luck"], ["mp", "MP"]] : sys === "d20" ? [["hp", "HP"], ["ac", "AC"]] : [["hp", "HP"]];
    const num = (r, k) => `<span class="t-num">${k === "ac" ? "" : `<button type="button" class="t-mini" data-t="cb" data-id="${esc(r.id)}" data-f="${k}" data-d="-1" aria-label="${k} down">−</button>`}<input type="number" inputmode="numeric" data-t="cbset" data-id="${esc(r.id)}" data-f="${k}" value="${r[k] == null ? "" : esc(r[k])}" aria-label="${esc(r.name)} ${k}">${k === "ac" ? "" : `<button type="button" class="t-mini" data-t="cb" data-id="${esc(r.id)}" data-f="${k}" data-d="1" aria-label="${k} up">+</button>`}</span>`;
    const rows = c.list.map((r, i) => `<tr class="${i === c.turn && c.round ? "turn" : ""} side-${r.side}${r.hp != null && +r.hp <= 0 ? " down" : ""}"><td><input class="t-init" type="number" data-t="cbset" data-id="${esc(r.id)}" data-f="init" value="${esc(r.init)}" aria-label="Initiative"></td><td><input class="t-nm" data-t="cbset" data-id="${esc(r.id)}" data-f="name" value="${esc(r.name)}" aria-label="Name"></td>${cols.map(([k]) => `<td>${num(r, k)}</td>`).join("")}<td><input class="t-note" data-t="cbset" data-id="${esc(r.id)}" data-f="note" value="${esc(r.note || "")}" placeholder="wounds, conditions" aria-label="Notes"></td><td>${sys === "coc" && r.san != null ? `<button type="button" class="t-mini" data-t="sanroll" data-id="${esc(r.id)}" title="Roll against their Sanity">SAN roll</button>` : ""}<button type="button" class="t-mini" data-t="cbdel" data-id="${esc(r.id)}" aria-label="Remove">×</button></td></tr>`).join("");
    return `<div class="t-grid t-g2w"><div><section class="t-card"><h3>${T.icon("combat")} The fight${c.round ? ` · round ${c.round}` : ""}</h3>
      <div class="t-row"><select data-t="cbpick" aria-label="Who joins">${groups.map(g => `<optgroup label="${esc(g)}">${F.filter(f => f.g === g).map(f => `<option value="${esc(f.id)}"${UI.cbPick === f.id ? " selected" : ""}>${esc(f.name)}</option>`).join("")}</optgroup>`).join("")}<option value="">Someone else…</option></select><input class="t-in t-n" type="number" min="1" max="12" value="1" data-t="cbcount" aria-label="How many"><button type="button" class="t-btn" data-t="cbadd">Add</button>
      <span class="t-sp"></span><button type="button" class="t-btn" data-t="cbsort">Sort by ${sys === "coc" ? "DEX" : "initiative"}</button><button type="button" class="t-btn prim" data-t="cbnext">${c.round ? "Next turn" : "Begin"}</button><button type="button" class="t-btn" data-t="cbend">End the fight</button></div>
      ${c.list.length ? `<div class="t-tblw"><table class="t-cb"><thead><tr><th>${sys === "coc" ? "DEX" : "Init."}</th><th>Who</th>${cols.map(([, l]) => `<th>${l}</th>`).join("")}<th>Notes</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="kn">Nobody in the fight yet. Add the party and whoever they face; ${sys === "coc" ? "in Call of Cthulhu they act in order of DEX, highest first" : "initiative is rolled for you"}.</p>`}
      <p class="t-small" id="tCbMsg" aria-live="polite">${esc(UI.cbMsg || "")}</p></section></div>
      <div>${diceHTML()}</div></div>`;
  }
  // the dice: the same roller in the Combat tab, Make it up, and the toolbar
  const diceBody = () => `<div class="t-row t-dice">${["d4", "d6", "d8", "d10", "d12", "d20", "d100"].map(d => `<button type="button" class="t-btn" data-t="die" data-e="1${d === "d100" ? "d%" : d}">${d}</button>`).join("")}</div>
      <div class="t-row"><input class="t-in t-grow" data-t="diceexpr" placeholder="Any dice, like 2d6+1" aria-label="Dice to roll"><button type="button" class="t-btn" data-t="dicego">Roll</button></div>
      <div class="t-row"><label class="t-lab">Skill <input class="t-in t-n" type="number" min="1" max="99" data-t="skill" placeholder="60"></label><button type="button" class="t-btn" data-t="skillgo">Roll d100 against it</button></div>
      <div class="t-tray" aria-hidden="true"></div>
      <ol class="t-dicelog" aria-live="polite">${UI.dice.map(x => `<li>${x}</li>`).join("")}</ol>`;
  const diceHTML = () => `<section class="t-card"><h3>${T.icon("dice")} Dice</h3>${diceBody()}</section>`;
  const diceLog = h => { UI.dice.unshift(h); UI.dice = UI.dice.slice(0, 10); document.querySelectorAll(".t-dicelog").forEach(l => { l.innerHTML = UI.dice.map(x => `<li>${x}</li>`).join(""); }); };
  const rollShow = x => `<b>${x.total}</b> <span class="kn">${esc(x.expr)}${x.dice.length > 1 ? " · " + x.dice.join(" + ") : ""}</span>`;
  // the box a dice button sits in, so its own inputs are read (the tab's or the toolbar's)
  const boxOf = b => (b && b.closest && b.closest(".t-card, .t-pop")) || document;
  function rollExpr(box) { const v = (box.querySelector('[data-t="diceexpr"]') || {}).value, x = T.roll(v); if (x) tumble(box, x); diceLog(x ? rollShow(x) : `<span class="kn">Write dice like 2d6+1 or d20.</span>`); }
  function rollSkill(box) { const v = +(box.querySelector('[data-t="skill"]') || {}).value || 50, x = T.skillRoll(v); tumble(box, { expr: "1d100", dice: [x.roll], total: x.roll }); diceLog(`<b>${x.roll}</b> <span class="kn">against ${x.skill}:</span> ${esc(x.how)}`); }

  /* ---- the dice, rolled where they can be seen (the user asked for "an animation corresponding to each dice"):
          each die tumbles onto the tray in its own shape (a d4's triangle, a d6's square, a d8's diamond, a d10's
          kite, a d12's pentagon, a d20's many-faced hexagon; a d100 as two d10s, tens and units), its face flickering
          through numbers until it lands on the roll */
  const DIE = {
    4: { fill: "#b5462f", ink: "#fff3e8", ty: 44, shape: `<polygon points="32,5 61,57 3,57"/><path d="M32 5 32 40M3 57 32 40 61 57" fill="none" opacity=".45"/>` },
    6: { fill: "#efe6d2", ink: "#2a2016", ty: 33, shape: `<rect x="7" y="7" width="50" height="50" rx="9"/><rect x="12" y="12" width="40" height="40" rx="6" fill="none" opacity=".35"/>` },
    8: { fill: "#2f7a55", ink: "#effaf3", ty: 27, shape: `<polygon points="32,3 61,32 32,61 3,32"/><path d="M3 32 61 32M32 3 18 32 32 61 46 32 32 3" fill="none" opacity=".35"/>` },
    10: { fill: "#2c5a85", ink: "#eef5ff", ty: 29, shape: `<polygon points="32,3 61,27 32,61 3,27"/><path d="M3 27 32 44 61 27M32 44 32 61" fill="none" opacity=".4"/>` },
    12: { fill: "#6a3f9e", ink: "#f6efff", ty: 34, shape: `<polygon points="32,3 61,24 50,59 14,59 3,24"/><polygon points="32,15 47,26 41,45 23,45 17,26" fill="none" opacity=".45"/><path d="M32 3 32 15M61 24 47 26M50 59 41 45M14 59 23 45M3 24 17 26" fill="none" opacity=".45"/>` },
    20: { fill: "#8a2432", ink: "#fff1d6", ty: 37, shape: `<polygon points="32,2 60,17 60,47 32,62 4,47 4,17"/><polygon points="32,16 49,44 15,44" fill="none" opacity=".5"/><path d="M32 2 32 16M60 17 49 44M4 17 15 44M32 62 15 44M32 62 49 44M4 47 15 44M60 47 49 44M4 17 32 16 60 17" fill="none" opacity=".4"/>` },
    0: { fill: "#5b5650", ink: "#fff", ty: 33, shape: `<circle cx="32" cy="32" r="28"/>` }
  };
  const dieSVG = (sides, v) => { const d = DIE[sides] || DIE[0]; return `<svg viewBox="0 0 64 64"><g fill="${d.fill}" stroke="#14110d" stroke-width="2" stroke-linejoin="round">${d.shape}</g><text x="32" y="${d.ty}" text-anchor="middle" dominant-baseline="middle" fill="${d.ink}" font-family="var(--f-mono), monospace" font-weight="700" font-size="${String(v).length > 2 ? 15 : String(v).length > 1 ? 19 : 22}">${esc(v)}</text></svg>`; };
  function tumble(box, x) {
    const tray = box.querySelector && box.querySelector(".t-tray"); if (!tray) return;
    const m = /d(\d+)/.exec(x.expr || ""), sides = m ? +m[1] : 6;
    // a d100 is two d10s: tens (00 to 90) and units (0 to 9); 100 shows as 00 and 0
    const faces = sides === 100 ? x.dice.flatMap(v => [{ s: 10, v: String(Math.floor((v % 100) / 10) * 10).padStart(2, "0"), rnd: () => String(Math.floor(Math.random() * 10) * 10).padStart(2, "0") }, { s: 10, v: String(v % 10), rnd: () => String(Math.floor(Math.random() * 10)) }])
      : x.dice.map(v => ({ s: sides, v: String(v), rnd: () => String(1 + Math.floor(Math.random() * sides)) }));
    const shown = faces.slice(0, 12), still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    tray.innerHTML = shown.map((f, i) => `<div class="t-die${still ? "" : " rolling"}" style="--i:${i}">${dieSVG(f.s, still ? f.v : f.rnd())}</div>`).join("") + (faces.length > 12 ? `<span class="t-more">+${faces.length - 12}</span>` : "") + `<b class="t-total${still ? " on" : ""}">${x.total}</b>`;
    if (still) return;
    const dies = [...tray.querySelectorAll(".t-die")], t0 = performance.now(), stop = 820;
    clearInterval(tray._flick);
    tray._flick = setInterval(() => {
      const t = performance.now() - t0;
      dies.forEach((el, i) => { const done = t > stop + i * 70, txt = el.querySelector("text"); if (!txt || el.dataset.done) return; if (done) { txt.textContent = shown[i].v; el.dataset.done = 1; el.classList.add("landed"); } else txt.textContent = shown[i].rnd(); });
      if (dies.every(el => el.dataset.done)) { clearInterval(tray._flick); const tot = tray.querySelector(".t-total"); if (tot) tot.classList.add("on"); }
    }, 65);
  }
  // someone made up on the spot, with what to do with them
  const personCard = p => `<div class="t-person"><h4>${esc(p.name)}</h4><p class="kn">${esc(p.trade)}</p><p><span class="kl">Looks</span>${esc(p.look)}</p><p><span class="kl">Manner</span>${esc(p.manner)}</p><p><span class="kl">Wants</span>${esc(p.want)}</p><p><span class="kl">Secret</span>${esc(p.secret)}</p><div class="t-row"><button type="button" class="t-mini" data-t="person">Someone else</button><button type="button" class="t-mini" data-t="personshow">Show them to the players</button><button type="button" class="t-mini" data-t="personkeep">Keep them</button></div></div>`;

  /* ---- Make it up: a person, a place, random tables */
  function makeHTML() {
    const p = UI.person, f = UI.fly, kept = Object.values(S.get("fly") || {}).sort((a, b) => (b.t || 0) - (a.t || 0)), g = eraGroup();
    const ctab = Object.entries(A.tablesData || {}).filter(([, l]) => Array.isArray(l) && l.length), gtab = Object.entries(generic());
    let fly = "";
    if (f) { flyPlace(f); const M = A.get(f.id), rn = rid => A.nameOf(M, rid); fly = `<div class="t-fly"><h4>${esc(f.name)}</h4><p class="kn">${esc((KIND_WORD[f.g] || {})[f.kind] || "")}</p><div class="t-flymap">${A.svg(f.id, 0, "gm", "y" + (A.state.n++))}</div>
      <p><span class="kl">Who is here</span><b>${esc(f.person.name)}</b>, ${esc(f.person.trade)}, in the ${esc(rn(f.personAt).toLowerCase())}: ${esc(f.person.look)}; ${esc(f.person.manner)}. Wants ${esc(f.person.want)}. <i>Secret:</i> ${esc(f.person.secret)}.</p>
      <p><span class="kl">To find</span>${esc(f.find)}, in the ${esc(rn(f.findAt).toLowerCase())}.${f.lead ? ` It points to ${goBtn(f.lead)}.` : ""}</p>
      <p><span class="kl">Its secret</span>${esc(f.secret)}.</p>
      <div class="t-row"><button type="button" class="t-btn" data-t="flyshow">Show its map to the players</button>${kept.some(k => k.id === f.id) ? `<span class="kn">Kept.</span>` : `<button type="button" class="t-btn" data-t="flykeep">Keep it</button>`}</div></div>`; }
    return `<div class="t-grid t-g3"><div>
      <section class="t-card"><h3>${T.icon("person")} A person, now</h3><p class="t-small">A name of the story's people and age, a look, a manner, what they want and what they hide.</p>${p ? "" : `<button type="button" class="t-btn prim" data-t="person">Make someone</button>`}
        ${p ? personCard(p) : ""}
        ${kept.filter(k => k.kind === "person").length ? `<h4 class="t-h4">Kept</h4><ul class="t-ul">${kept.filter(k => k.kind === "person").map(k => `<li><b>${esc(k.person.name)}</b>, ${esc(k.person.trade)} <span class="kn">${esc(k.person.look)}</span> <button type="button" class="t-mini" data-t="flydel" data-id="${esc(k.id)}" aria-label="Forget them">×</button></li>`).join("")}</ul>` : ""}</section>
      ${diceHTML()}</div>
      <div><section class="t-card"><h3>${T.icon("make")} A place, now</h3><p class="t-small">A small place with its map, someone in it and something to find${X.TR.ready ? " that points where the party needs to go" : ""}.</p>
        <div class="t-row"><select data-t="flykind" aria-label="What kind of place"><option value="">Any kind</option>${FLY_KINDS[g].map(k => `<option value="${k}">${esc(KIND_WORD[g][k])}</option>`).join("")}</select><button type="button" class="t-btn prim" data-t="fly">Make a place</button></div>${fly}
        ${kept.filter(k => k.kind !== "person").length ? `<h4 class="t-h4">Places made at the table</h4><ul class="t-ul">${kept.filter(k => k.kind !== "person").map(k => `<li><button type="button" class="t-go" data-t="flyopen" data-id="${esc(k.id)}">${esc(k.name)}</button> <span class="kn">${esc((KIND_WORD[k.g] || {})[k.kind] || "")}</span> <button type="button" class="t-mini" data-t="flydel" data-id="${esc(k.id)}" aria-label="Forget it">×</button></li>`).join("")}</ul>` : ""}</section></div>
      <div><section class="t-card t-rt"><h3>${T.icon("tables")} Random tables</h3>${ctab.map(([n, l]) => tableRow("c:" + n, n, l)).join("")}${gtab.map(([n, l]) => tableRow("g:" + n, n, l)).join("")}<p class="t-small">Each place's own tables are in its dossier.</p></section></div></div>`;
  }

  /* ---- The board */
  function boardHTML() {
    const model = T.boardModel(), [W, H] = T.boardSize(model.nodes.length), pos = Object.assign({}, T.boardLayout(model, W, H), (S.get("board", "pos") || {}).p || {});
    UI.board = { model, W, H, pos };
    const shown = model.nodes.filter(n => found(n.id)).length;
    return `<section class="t-card t-boardc"><div class="t-row"><h3>The board</h3><span class="t-sp"></span><button type="button" class="t-mini" data-t="bzoom" data-d="-1" aria-label="Smaller">−</button><button type="button" class="t-mini" data-t="bzoom" data-d="1" aria-label="Larger">+</button><button type="button" class="t-btn" data-t="screen" data-kind="board">Show the players their board</button><button type="button" class="t-btn" data-t="breset">Tidy it again</button></div>
      <p class="t-small">Everyone and everything, with string: red for where a clue leads, black for who knows whom, grey for where things are. Drag a card to move it. Click a card to pin it to the players' board or take it down; clues they have found and places they know go up by themselves. ${shown} of ${model.nodes.length} are on theirs; the faded ones are not.</p>
      <div class="t-board" id="tBoard"><div class="t-bsize" style="width:${W * UI.boardZoom}px;height:${H * UI.boardZoom}px"><div class="t-bzoom" style="transform:scale(${UI.boardZoom});width:${W}px;height:${H}px">${T.boardHTML(model, pos, found, W, H, true)}</div></div></div></section>`;
  }
  function bindBoard() {
    const box = $("#tBoard"); if (!box) return;
    const z = box.querySelector(".t-bzoom");
    if (!UI.boardFit) { UI.boardFit = 1; UI.boardZoom = Math.max(.35, Math.min(1, (box.clientWidth - 4) / UI.board.W)); z.style.transform = `scale(${UI.boardZoom})`; Object.assign(z.parentElement.style, { width: UI.board.W * UI.boardZoom + "px", height: UI.board.H * UI.boardZoom + "px" }); }
    box.style.maxHeight = "78vh";
    let drag = null;
    box.addEventListener("pointerdown", e => { const c = e.target.closest(".bd-card"); if (!c) return; e.preventDefault(); drag = { el: c, id: c.dataset.bd, x0: e.clientX, y0: e.clientY, l: parseFloat(c.style.left), t: parseFloat(c.style.top), moved: false }; c.setPointerCapture(e.pointerId); });
    box.addEventListener("pointermove", e => { if (!drag) return; const dx = (e.clientX - drag.x0) / UI.boardZoom, dy = (e.clientY - drag.y0) / UI.boardZoom; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; if (!drag.moved) return; drag.el.style.left = (drag.l + dx) + "px"; drag.el.style.top = (drag.t + dy) + "px"; redrawStrings(drag.id, drag.l + dx, drag.t + dy); });
    box.addEventListener("pointerup", () => {
      if (!drag) return; const d = drag; drag = null;
      if (d.moved) { const p = Object.assign({}, (S.get("board", "pos") || {}).p || {}); p[d.id] = [Math.round(parseFloat(d.el.style.left)), Math.round(parseFloat(d.el.style.top))]; S.set("board", "pos", { p }); }
      else { const sh = Object.assign({}, (S.get("board", "show") || {}).ids || {}); sh[d.id] = !found(d.id); S.set("board", "show", { ids: sh }); }
    });
    void z;
  }
  function redrawStrings(id, x, y) {
    UI.board.pos[id] = [x, y];
    const svg = document.querySelector("#tBoard .bd-strings"); if (!svg) return;
    const tmp = document.createElement("div"); tmp.innerHTML = T.boardHTML(UI.board.model, UI.board.pos, found, UI.board.W, UI.board.H, true);
    svg.innerHTML = tmp.querySelector(".bd-strings").innerHTML;
  }

  /* ---- The party */
  function partyHTML() {
    const pcs = Object.entries(A.pcsData || {}), j = Object.entries(S.get("journal") || {}).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
    const card = ([id, pc]) => `<section class="t-card t-pc"><h3>${esc(pc.n)}</h3><div class="kn">${esc([pc.player ? "played by " + pc.player : "", pc.concept].filter(Boolean).join(" · "))}</div>
      ${[["Their story", pc.bg], ["The hook", pc.hook], ["Their secret", pc.secret], ["Ties", typeof pc.ties === "object" && pc.ties ? Object.entries(pc.ties).map(([k, v]) => ((A.castData || {})[k] || {}).n || k).map((nm, i) => nm + ": " + Object.values(pc.ties)[i]).join("; ") : pc.ties]].map(([k, v]) => v ? `<p><span class="kl">${k}</span>${esc(v)}</p>` : "").join("")}
      ${pc.clue ? `<p><span class="kl">Theirs to find</span>${esc(pc.clue.t || "")}${pc.clue.at ? ` at ${goBtn(pc.clue.at)}` : ""}${pc.clue.d ? `: ${esc(pc.clue.d)}` : ""}</p>` : ""}${statBlock(pc.stats)}</section>`;
    return `<div class="t-grid t-g2"><div>${pcs.length ? pcs.map(card).join("") : `<section class="t-card"><h3>The players' characters</h3><p class="kn">None written into this campaign. When the players' characters are given with the story, the council writes each one a hook, a secret and a clue of their own into the places.</p>${X.TR.party && X.TR.party.length ? `<p>The tracker's party: ${X.TR.party.map(m => esc(m.name)).join(", ")}.</p>` : ""}</section>`}</div>
      <div><section class="t-card"><h3>The players' notes</h3><p class="t-small">What they write on their screen ("Our notes"). You can add to it too: it shows on theirs.</p>
        <form class="t-jadd" data-t="jadd"><textarea rows="2" maxlength="2000" placeholder="A note for the players: a name, a reminder, a rumour"></textarea><button type="submit" class="t-btn">Add for them</button></form>
        ${j.length ? `<ul class="t-journal">${j.map(([id, e]) => `<li class="${e.gm ? "gm" : ""}"><p>${esc(e.text)}</p><span class="kn">${e.gm ? "From you · " : ""}${new Date(e.t || 0).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span><button type="button" class="t-mini" data-t="jdel" data-id="${esc(id)}" aria-label="Remove">×</button></li>`).join("")}</ul>` : `<p class="kn">Nothing written yet.</p>`}</section></div></div>`;
  }

  /* ---- Safety */
  function safetyHTML() {
    const z = S.get("safety", "zero") || {}, xs = Object.entries(S.get("xcard") || {}).filter(([k]) => k !== "now").sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
    const rows = X.P.map(p => ({ p, m: A.meta[p.id] || {} })).filter(x => x.m.intensity || (x.m.content || []).length);
    return `<div class="t-grid t-g2"><div><section class="t-card"><h3>Session zero: lines and veils</h3>
      <p class="t-small">Before the first game, ask the table what they do not want in the story at all (lines) and what can happen only off screen (veils). Write one to a line. The places that touch them are flagged in their dossiers and on tonight's sheet.</p>
      <div class="t-g2 t-grid"><label class="t-lab t-block">Lines: not in the game<textarea rows="6" data-t="lines" placeholder="harm to children&#10;spiders">${esc(toList(z.lines).join("\n"))}</textarea></label><label class="t-lab t-block">Veils: only off screen<textarea rows="6" data-t="veils" placeholder="torture&#10;suicide">${esc(toList(z.veils).join("\n"))}</textarea></label></div>
      <div class="t-row"><button type="button" class="t-btn" data-t="screen" data-kind="safety">Show them on the players' screen</button></div>
      <p class="t-small">${esc(T.SAFETY_NOTE)}</p></section>
      <section class="t-card"><h3>The X-card</h3><p class="t-small">The players' screen has a Stop button. When anyone touches it, a banner tells you here: move on from what is happening, without asking why.</p>${xs.length ? `<ul class="t-ul">${xs.slice(0, 12).map(([, x]) => `<li>${new Date(x.t || 0).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</li>`).join("")}</ul>` : `<p class="kn">Not touched yet.</p>`}</section></div>
      <div><section class="t-card"><h3>How hard each place hits</h3>${rows.length ? `<table class="t-int-t"><tbody>${rows.map(({ p, m }) => { const h = safetyHits(m); return `<tr class="${h.length ? "warn" : ""}"><td>${goBtn(p.id)}</td><td>${intensity(m)}</td><td>${h.length ? "⚠ " + esc(h.join(", ")) : ""}</td></tr>`; }).join("")}</tbody></table>` : `<p class="kn">The council has not rated the places yet (intensity and content on each place).</p>`}</section></div></div>`;
  }

  /* ---- Ask the campaign */
  function askHTML() {
    return `<div class="t-grid t-g2w"><div><section class="t-card"><h3>${T.icon("ask")} Ask the campaign</h3><p class="t-small">A question about the story, answered from the campaign's own words: the story bible, the places, the people, the clues. "Who has the key to the vestry?" "What does the doctor know about the fire?" "Where did the party first hear of the ship?"</p>
      <form class="t-ask" data-t="ask"><input class="t-in" name="q" maxlength="400" placeholder="Ask anything about the campaign" aria-label="Your question" autocomplete="off"><button type="submit" class="t-btn prim">Ask</button></form>
      <div id="tAsk">${UI.ask.map(askItem).join("")}</div></section></div>
      <div><section class="t-card"><h3>How it answers</h3><p class="t-small">On claude.ai the answer is written by Claude from the passages it is shown (the page asks your permission the first time). In the Atlas app it is written by your own Claude. Anywhere else, or if that is refused, the page shows you the passages that answer it, best first.</p></section></div></div>`;
  }
  const askItem = a => `<article class="t-qa"><h4>${esc(a.q)}</h4>${a.a ? `<div class="t-ans">${esc(a.a).replace(/\n+/g, "<br>")}</div>` : ""}${a.hits && a.hits.length ? `<details${a.a ? "" : " open"}><summary>${a.a ? "The passages it read" : "What the campaign says"}</summary><ol class="t-hits">${a.hits.map(h => `<li><b>${h.go ? goBtn(h.go) + (h.src !== placeName(h.go) ? " · " + esc(h.src.replace(placeName(h.go) + ": ", "")) : "") : esc(h.src)}</b><p>${mark(h.text, a.q)}</p></li>`).join("")}</ol></details>` : a.a ? "" : `<p class="kn">The campaign says nothing about that.</p>`}</article>`;
  function mark(text, q) { const ws = words(q).filter(w => !STOP.has(w)); let s = esc(text); for (const w of ws) s = s.replace(new RegExp("\\b(" + w.replace(/[^a-z0-9']/g, "") + "\\w*)", "gi"), "<mark>$1</mark>"); return s; }
  async function ask(q) {
    const hits = lookup(q, 12), item = { q, a: "", hits };
    UI.ask.unshift(item); UI.ask = UI.ask.slice(0, 8);
    const paint = () => { const box = $("#tAsk"), pop = $("#tPopAsk"); if (box) box.innerHTML = UI.ask.map(askItem).join(""); if (pop) pop.innerHTML = askItem(UI.ask[0]); };
    paint();
    if (!hits.length) return;
    const c = cfg(), prompt = `You are the memory of the tabletop roleplaying campaign "${c.title}"${c.system ? " (" + c.system + ")" : ""}, helping its game master during play. Answer the question from the passages below, which are the campaign's own words. If they do not answer it, say so in one sentence, then offer what would fit the story, clearly marked as a suggestion. Be brief and concrete: at most five sentences, plain prose, no headings. Use the names the campaign uses.\n\nQuestion: ${q}\n\nPassages:\n${hits.map((h, i) => `[${i + 1}] ${h.src}\n${h.text}`).join("\n\n")}`;
    try { item.a = "…"; paint(); const t = await askAI(prompt, x => { item.a = x; paint(); }); item.a = t || ""; } catch (e) { item.a = ""; if (e && e.code === "rate_limited") note("Too many questions at once: wait a moment."); }
    paint();
  }

  /* ---- Print and export */
  function exportHTML() {
    const mapped = X.P.filter(p => p.M);
    return `<div class="t-grid t-g2"><div><section class="t-card"><h3>The book</h3><p class="t-small">The whole campaign as a book to print: the story, every place with its maps and room-by-room guide, the people, the players' characters, the sessions, the clocks, and the handouts each on a page of its own. It is the ${esc(gmName())}'s book: it holds every secret.</p>
      <div class="t-row"><button type="button" class="t-btn prim" data-t="bookprint">Print the book</button><button type="button" class="t-btn" data-t="booksave">Save it as a file</button></div><p class="t-small">If printing does nothing here, save it as a file, open that in your browser and print from there.</p></section>
      <section class="t-card"><h3>Tonight's sheet and the handouts</h3><div class="t-row"><button type="button" class="t-btn" data-t="printsheet">Print tonight's sheet</button><button type="button" class="t-btn" data-t="printhandouts">Print every handout</button></div></section></div>
      <div><section class="t-card"><h3>Maps for online tables</h3><p class="t-small">A place's floors as pictures with their walls and doors (the Universal VTT format, .dd2vtt), for Foundry VTT and others, plus plain pictures for Roll20 or Owlbear Rodeo. The players' maps: secret rooms and doors are left off.</p>
        <div class="t-row"><select data-t="vttplace" aria-label="Place">${mapped.map(p => `<option value="${esc(p.id)}"${p.id === X.state.sel ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select><button type="button" class="t-btn prim" data-t="vtt">Export</button></div></section></div></div>`;
  }

  /* ================================================================ actions */
  const cbMsg = t => { UI.cbMsg = t; const m = $("#tCbMsg"); if (m) m.textContent = t; };
  async function act(t, b, e) {
    const d = b.dataset;
    switch (d.t) {
      case "tab": dockClose(); UI.tab = d.tab; pref.set("tab", d.tab); if (X.state.view !== "table") X.setView("table"); else view(); window.scrollTo({ top: ($("#tablev") || document.body).offsetTop - 8, behavior: "smooth" }); break;
      case "tablet": { const on = app().dataset.tablet !== "1"; app().dataset.tablet = on ? "1" : ""; pref.set("tablet", on ? "1" : ""); b.setAttribute("aria-pressed", on); b.textContent = on ? "Table-side view: on" : "Table-side view"; break; }
      case "openscreen": openScreen(); break;
      case "lanon": lanPaint({ on: true }); break;
      case "lannew": lanPaint({ on: true, fresh: true }); break;
      case "lanoff": lanPaint({ on: false }); break;
      case "lancopy": try { navigator.clipboard.writeText(d.url); note("The players' link is copied."); } catch (x) { note("This browser would not copy it: read it out instead."); } break;
      case "beplayers": try { sessionStorage.setItem(cfg().storageKey + "-players", "1"); } catch (_) {} location.hash = "players"; location.reload(); break;
      case "screen": show({ kind: d.kind }); refresh(["screen"]); break;
      case "showmap": { const id = d.id || UI.fogPlace; if (!id || !A.maps[id]) return; UI.fogPlace = id; const fl = Object.values(S.get("fly") || {}).find(f => f.id === id) || (UI.fly && UI.fly.id === id ? UI.fly : null); show({ kind: "map", place: id, floor: UI.fogFloor || 0, fly: fl || null, view: fogView() }); refresh(["screen"]); fogDlgPaint(); break; }
      case "fogview": { UI.fogView = b.dataset.v; const cur = screenNow(); if (cur.kind === "map" && cur.place === UI.fogPlace) show(Object.assign({}, cur, { view: UI.fogView })); renderTab(); fogDlgPaint(); break; }
      case "fogopen": dockClose(); openFog(d.id); break;
      case "hplace": { const hs = T.allHandouts().filter(h => h.place === d.id); if (hs.length) openHandout(hs[0].id, d.id); break; }
      case "rtables": { const el = document.querySelector("#dossier .t-rt"); if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); el.classList.remove("lm-hl"); void el.offsetWidth; el.classList.add("lm-hl"); } break; }
      case "fogall": setRooms(true); break;
      case "fogmode": UI.fogMode = b.dataset.m; renderTab(); fogDlgPaint(); break;
      case "fogreset": if (b.dataset.sure) { const cur = S.get("fog", UI.fogPlace) || {}; S.set("fog", UI.fogPlace, { off: cur.off || false, f: {}, c: {} }); } else { b.dataset.sure = 1; b.textContent = "Really hide every floor again?"; } break;
      case "fognone": setRooms(false); break;
      case "showscene": { const bx = boxOf(b), tt = (bx.querySelector('[data-t="scenetitle"]') || {}).value || "", tx = (bx.querySelector('[data-t="scenetext"]') || {}).value || ""; if (!tx.trim() && !tt.trim()) return; show({ kind: "scene", title: tt.trim().slice(0, 120), text: tx.trim().slice(0, 4000) }); break; }
      case "showface": { const cid = (boxOf(b).querySelector('[data-t="facepick"]') || {}).value, c = (A.castData || {})[cid]; if (c) show({ kind: "person", name: c.n, role: T.plainRole(c.role), look: c.look || "" }); break; }   // the plain part of a role only: what follows a semicolon or a dash is often the secret
      case "hview": if (b.closest("summary") && e) e.preventDefault(); openHandout(d.id, d.list || null); break;
      case "hshow": { const h = T.allHandouts().find(x => x.id === d.id); if (!h) return; show({ kind: "handout", id: h.id }); const dl = b.closest("#tDlg"); if (dl) openHandout(h.id, dl.dataset.place || null); break; }
      case "hprint": { const h = T.allHandouts().find(x => x.id === d.id); if (h) printNow(`<div class="bk-ho">${T.handoutHTML(h)}</div>`, "pr-ho"); break; }
      case "printhandouts": printNow(T.allHandouts().map(h => `<div class="bk-ho">${T.handoutHTML(h)}</div>`).join(""), "pr-ho"); break;
      case "printsheet": { const prev = UI.tab; UI.tab = "tonight"; const tmp = document.createElement("div"); tmp.innerHTML = tonightHTML(); UI.tab = prev; const sh = tmp.querySelector(".t-sheet"); printNow(sh ? sh.outerHTML : "", "pr-sheet"); break; }
      case "recap": recap(+d.n); break;
      case "recapshow": { const r = (notesOf(sessionNow() - 1).recap) || ""; if (r) show({ kind: "scene", title: "Previously…", text: r }); break; }
      case "tick": { const c = (A.clocksData || []).find(x => x.id === d.id); if (!c) return; const tot = +c.segments || (c.ticks || []).length || 4, at = Math.max(0, Math.min(tot, clockAt(c) + +d.d)); S.set("clocks", c.id, { at, t: Date.now() }); if (+d.d > 0 && (c.ticks || [])[at - 1]) note(`${c.name}: ${c.ticks[at - 1]}`); break; }
      case "stuck": UI.stuck = stuckIdeas(); { const s = $("#tStuck"); if (s) s.innerHTML = stuckHTML(UI.stuck); } renderPop(); break;
      case "cbadd": {
        const sel = $('[data-t="cbpick"]'); UI.cbPick = sel ? sel.value : ""; const n = Math.max(1, Math.min(12, +($('[data-t="cbcount"]') || {}).value || 1)), F = fighters().find(f => f.id === (sel && sel.value)), c = cnow();
        const add = F ? Array.from({ length: n }, (_, i) => fighterRow(F, n > 1 ? i + 1 : 0)) : [fighterRow({ g: "", name: "Someone", stats: {} }, 0)];
        c.list = c.list.concat(add); cset(c); break;
      }
      case "cb": { const c = cnow(), r = c.list.find(x => x.id === d.id); if (!r) return; r[d.f] = (+r[d.f] || 0) + +d.d; cset(c); break; }
      case "cbdel": { const c = cnow(); c.list = c.list.filter(x => x.id !== d.id); c.turn = Math.min(c.turn, Math.max(0, c.list.length - 1)); cset(c); break; }
      case "cbsort": { const c = cnow(); c.list.sort((a, b) => (+b.init || 0) - (+a.init || 0)); c.turn = 0; cset(c); break; }
      case "cbnext": { const c = cnow(); if (!c.list.length) return; if (!c.round) { c.list.sort((a, b) => (+b.init || 0) - (+a.init || 0)); c.round = 1; c.turn = 0; } else { c.turn++; if (c.turn >= c.list.length) { c.turn = 0; c.round++; } } cset(c); cbMsg(`${c.list[c.turn].name} acts.`); break; }
      case "cbend": twice(b, () => { cset({ round: 0, turn: 0, list: [] }); cbMsg("The fight is over."); }); break;
      case "sanroll": { const r = cnow().list.find(x => x.id === d.id); if (!r) return; const x = T.skillRoll(r.san); cbMsg(`${r.name}: Sanity roll ${x.roll} against ${x.skill}: ${x.how === "Failure" || x.how === "Fumble" ? "failed, so the larger loss" : "succeeded, so the smaller loss"}.`); break; }
      case "die": { const x = T.roll(d.e); if (x) { tumble(boxOf(b), x); diceLog(rollShow(x)); } break; }
      case "dicego": rollExpr(boxOf(b)); break;
      case "skillgo": rollSkill(boxOf(b)); break;
      case "rolltab": { const list = tableList(d.key); if (!list.length) return; UI.tabSel = d.key; UI.tabRes = T.rollTable(list); document.querySelectorAll(`.t-tab[data-tkey="${CSS.escape(d.key)}"] .t-tabres`).forEach(x => { x.textContent = UI.tabRes; }); break; }
      case "person": UI.person = T.personNow(); refresh(["make"]); renderPop(); break;
      case "personshow": if (UI.person) show({ kind: "person", name: UI.person.name, role: UI.person.trade, look: UI.person.look }); break;
      case "personkeep": if (UI.person) { const id = uid("p"); S.set("fly", id, { id, kind: "person", person: UI.person, t: Date.now() }); note(`${UI.person.name} is kept.`); } break;
      case "fly": UI.fly = makeFly((boxOf(b).querySelector('[data-t="flykind"]') || {}).value); renderTab(); break;
      case "flykeep": if (UI.fly) S.set("fly", UI.fly.id, UI.fly); break;
      case "flyshow": if (UI.fly) { flyPlace(UI.fly); UI.fogPlace = UI.fly.id; UI.fogFloor = 0; if (!S.get("fly", UI.fly.id)) S.set("fly", UI.fly.id, UI.fly); show({ kind: "map", place: UI.fly.id, floor: 0, fly: UI.fly, view: fogView() }); } break;
      case "flyopen": { const f = S.get("fly", d.id); if (f) { UI.fly = f; renderTab(); } break; }
      case "flydel": twice(b, () => { S.set("fly", d.id, null); if (UI.fly && UI.fly.id === d.id) UI.fly = null; }); break;
      case "bzoom": UI.boardZoom = Math.max(.35, Math.min(1.4, UI.boardZoom + +d.d * .15)); renderTab(); break;
      case "breset": twice(b, () => S.set("board", "pos", { p: {} })); break;
      case "jdel": twice(b, () => S.set("journal", d.id, null)); break;
      case "bookprint": printNow(bookHTML(), "pr-book"); break;
      case "booksave": { note("Making the book…"); const r = await saveFile(fileSlug(cfg().title) + "-book.html", bookFile(), "text/html"); note(r === "saved" ? "The book is saved: open it in your browser and print." : r === "declined" ? "Not saved." : "The book could not be saved here."); break; }
      case "vtt": { const id = d.id || ($('[data-t="vttplace"]') || {}).value; if (!id || !A.maps[id]) return; note("Drawing the maps…"); try { const r = await exportVTT(id, note); note(r === "saved" ? `The maps of ${placeName(id)} are saved, as a .zip.` : r === "declined" ? "Not saved." : "They could not be saved here."); } catch (err) { note("The maps could not be drawn: " + (err.message || err)); } break; }
      default: return false;
    }
    return true;
  }
  function openScreen() {
    // the players' copy beside this page when there is one (dist/players.html: none of the campaign in it, atlas-share.js),
    // or else this page as the players' window
    const url = A.playersPage ? new URL(A.playersPage, location.href).href : location.href.split("#")[0] + "#players";
    let w = null; try { w = window.open(url, "atlas-players", "popup=yes,width=1280,height=760"); } catch (e) { w = null; }
    if (w) { S.addPeer(w); note("The players' screen is open in a new window: drag it onto the television or the second screen, and press ⤢ there for full screen."); }
    else note(`Your browser kept the new window from opening. Open this page again on the other screen (or another computer), and there press "make this window the players' screen" in At the table, Players' screen.`);
  }
  // a handout to read, give or print; opened from a place's page, with that place's other handouts a click away
  function openHandout(hid, placeId) {
    const h = T.allHandouts().find(x => x.id === hid); if (!h) return;
    const list = placeId ? T.allHandouts().filter(x => x.place === placeId) : [], nm = x => x.title || x.headline || "Handout";
    const on = screenNow().kind === "handout" && screenNow().id === h.id;
    let dlg = document.getElementById("tDlg");
    if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "tDlg"; dlg.className = "t-dlg"; document.body.appendChild(dlg); dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-x]")) dlg.close(); }); }
    dlg.dataset.place = placeId || "";
    dlg.innerHTML = `<div class="t-dlgbar">${T.icon("handout")}<b>${esc(nm(h))}</b><span class="t-sp"></span>${on ? `<span class="t-onscr">${T.icon("screen")}On their screen</span>` : `<button type="button" class="t-btn prim" data-t="hshow" data-id="${esc(h.id)}">${T.icon("screen")}Give it to the players</button>`}<button type="button" class="t-mini" data-t="hprint" data-id="${esc(h.id)}">Print</button><button type="button" class="t-mini" data-x="1">Close</button></div>${list.length > 1 ? `<div class="t-dlgtabs" role="group" aria-label="This place's handouts">${list.map(x => `<button type="button" data-t="hview" data-id="${esc(x.id)}" data-list="${esc(placeId)}" aria-pressed="${x.id === h.id}">${esc(nm(x))}</button>`).join("")}</div>` : ""}<div class="t-dlgbody">${T.handoutHTML(h)}</div>`;
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  // the X-card: a banner the referee cannot miss
  function xcard(d) {
    const t = +((d.now || {}).t) || 0, seen = +pref.get("xseen") || 0;
    if (!t || t <= seen || Date.now() - t > 20 * 60 * 1000) return;
    let el = document.getElementById("tXcard");
    if (!el) { el = document.createElement("div"); el.id = "tXcard"; el.className = "t-xcard keeper"; el.setAttribute("role", "alert"); app().prepend(el); }
    el.innerHTML = `<b>The X-card has been touched.</b> Move on from what is happening now: cut it, skip it or change it. Nobody needs to explain. <button type="button" class="t-btn" data-t2="xok" data-at="${t}">Done</button>`;
    el.hidden = false;
  }

  /* ---- the toolbar at the bottom right of every page (referee only): what is wanted in the middle of play, without
          leaving the place being read. Each button opens a small panel above it; "More" goes to the full tool. */
  const DOCK = [["dice", "Dice", "dice"], ["person", "A person", "person"], ["stuck", "Stuck?", "stuck"], ["ask", "Ask", "ask"], ["screen", "Players' screen", "screen"]];
  // a button another file adds (atlas-copilot.js: Talk), before the players' screen; html(head) draws its panel
  const DPLUGS = {};
  function addDock(k, label, icon, html) { if (DPLUGS[k]) return; DOCK.splice(DOCK.length - 1, 0, [k, label, icon]); DPLUGS[k] = html; }
  function dockInit() {
    if ($("#tDock") || !app()) return;
    const dock = document.createElement("div"); dock.id = "tDock"; dock.className = "t-dock keeper"; dock.setAttribute("role", "toolbar"); dock.setAttribute("aria-label", "Table tools");
    dock.innerHTML = DOCK.map(([k, l, ic]) => `<button type="button" data-dock="${k}" aria-expanded="false" title="${esc(l)}">${T.icon(ic)}<span>${esc(l)}</span>${k === "screen" ? `<i class="t-dot" aria-hidden="true"></i>` : ""}</button>`).join("");
    const pop = document.createElement("div"); pop.id = "tPop"; pop.className = "t-pop keeper"; pop.hidden = true; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Table tool");
    const msg = document.createElement("p"); msg.id = "tDockNote"; msg.className = "t-docknote keeper"; msg.setAttribute("aria-live", "polite");
    app().append(pop, msg, dock);
  }
  function dockOpen(k) {
    if (UI.dock === k) { dockClose(); return; }
    UI.dock = k; renderPop();
    const pop = $("#tPop"); pop.hidden = false;
    document.querySelectorAll("#tDock [data-dock]").forEach(b => b.setAttribute("aria-expanded", String(b.dataset.dock === k)));
    const f = pop.querySelector('input[name="q"]'); if (f && !(window.matchMedia && matchMedia("(pointer: coarse)").matches)) f.focus();
  }
  function dockClose() {
    if (!UI.dock) return; UI.dock = null;
    const pop = $("#tPop"); if (pop) pop.hidden = true;
    document.querySelectorAll("#tDock [data-dock]").forEach(b => b.setAttribute("aria-expanded", "false"));
  }
  function renderPop() {
    const pop = $("#tPop"); if (!pop || !UI.dock) return;
    const head = (ic, t, tab, more) => `<div class="tp-h">${T.icon(ic)}<b>${esc(t)}</b><span class="t-sp"></span>${tab ? `<button type="button" class="t-link" data-t="tab" data-tab="${tab}">${esc(more)}</button>` : ""}<button type="button" class="t-x" data-dock="close" aria-label="Close">${T.icon("close")}</button></div>`;
    let html = "";
    switch (UI.dock) {
      case "dice": html = head("dice", "Dice", "combat", "Combat") + diceBody(); break;
      case "person": if (!UI.person) UI.person = T.personNow(); html = head("person", "A person, now", "make", "Make it up") + personCard(UI.person); break;
      case "stuck": UI.stuck = stuckIdeas(); html = head("stuck", "They're stuck", "clocks", "Clocks and stuck") + `<p class="t-small">Ways to bring the story back to them, from what is still open; the most useful first.</p>` + stuckHTML(UI.stuck); break;
      case "ask": html = head("ask", "Ask the campaign", "ask", "Earlier questions") + `<form class="t-ask" data-t="ask"><input class="t-in" name="q" maxlength="400" placeholder="Who has the key to the vestry?" aria-label="Your question" autocomplete="off"><button type="submit" class="t-btn prim">Ask</button></form><div id="tPopAsk">${UI.ask[0] ? askItem(UI.ask[0]) : `<p class="t-small">A question about the story, answered from its own words: the bible, the places, the people and the clues.</p>`}</div>`; break;
      case "screen": {
        const d = screenNow(), here = X.state.sel && A.maps[X.state.sel] ? X.state.sel : null, open = screenOpen();
        html = head("screen", "The players' screen", "screen", "Choose what they see") + `<p class="t-scrstat${open ? " on" : ""}">${esc(screenStatus())}</p><div class="t-prev sm" role="img" aria-label="${esc(cap(nowText(d)))}">${previewHTML(d)}</div>
          <div class="t-row">${open ? "" : `<button type="button" class="t-btn prim" data-t="openscreen">${T.icon("open")}Open it</button>`}${here ? `<button type="button" class="t-btn" data-t="fogopen" data-id="${esc(here)}">${T.icon("map")}Show ${esc(placeName(here))}</button>` : ""}<button type="button" class="t-btn" data-t="screen" data-kind="title">The title</button><button type="button" class="t-btn" data-t="screen" data-kind="blank">Dark screen</button></div>`;
        break;
      }
      default: if (DPLUGS[UI.dock]) html = DPLUGS[UI.dock](head);
    }
    pop.innerHTML = html; pop.dataset.kind = UI.dock;
    fitPreviews(); requestAnimationFrame(fitPreviews);
  }
  // a hint, once, for a referee who has not found the table yet
  function intro() {
    if (pref.get("intro") === "1" || $("#tIntro")) return;
    const nav = document.querySelector("nav.views"); if (!nav) return;
    const el = document.createElement("div"); el.id = "tIntro"; el.className = "t-intro keeper"; el.setAttribute("role", "note");
    el.innerHTML = `${T.icon("play", "big")}<div class="ti-t"><b>New: everything for game night is under At the table.</b> A players' screen for your television, handouts, the villains' clocks, fights and dice, people and places made up on the spot. The quickest tools are always in the toolbar at the bottom right.</div><div class="t-row"><button type="button" class="t-btn prim" data-t="tab" data-tab="home">Show me</button><button type="button" class="t-btn" data-t2="introok">Got it</button></div>`;
    nav.after(el);
  }
  function dismissIntro() { pref.set("intro", "1"); const el = $("#tIntro"); if (el) el.remove(); }

  /* ================================================================ connecting it to the page */
  A.tableUI = {
    stats: statBlock, roll: rollBadge, dossierBar, dossierExtra, handoutBtns, view, intensity, addTab, addDock,
    // what another file's tool may use: the store, the page, notes, Claude, the campaign's passages, a place's button
    api: { store: () => S, ctx: () => X, note: t => note(t), show: d => show(d), refresh: tabs => refresh(tabs), render: () => renderTab(), askRaw: (p, f, s) => askRaw(p, f || (() => {}), s), lookup: (q, k) => lookup(q, k), goBtn, placeName, tab: () => UI.tab, open: k => { UI.tab = k; pref.set("tab", k); if (X && X.setView) X.setView("table"); view(); }, pop: () => renderPop(), dock: () => UI.dock, openDock: k => { if (UI.dock !== k) dockOpen(k); }, session: () => sessionNow(), notesOf: n => notesOf(n), saveNotes: (n, v) => saveNotes(n, v), clockAt: c => clockAt(c) },
    init(ctx) {
      X = ctx; S = T.makeStore(ctx.db, cfg().storageKey); found = T.foundIn(S);
      if (A.story && A.story.connect) A.story.connect(S);
      UI.tab = pref.get("tab") || "home"; if (!TABS.some(([k]) => k === UI.tab)) UI.tab = "home";
      if (pref.get("tablet") === "1") app().dataset.tablet = "1";
      dockInit(); intro();
      if (A.mapEditor) A.mapEditor.init(S, ctx);
      if (A.locations) A.locations.init(S, ctx);
      // the players' copy: what the players have been shown, kept for it as the table changes (atlas-share.js)
      if (A.share) A.share.start(S, ctx.prefs);
      for (const p of TPLUGS) if (p.init) p.init(S, ctx);
      const MAP = { screen: ["screen", "home"], fog: ["screen"], clocks: ["clocks", "tonight", "home"], log: ["tonight", "home"], combat: ["combat", "home"], board: ["board", "home"], journal: ["party", "home"], safety: ["safety", "tonight", "home"], fly: ["make", "screen", "home"], clues: ["tonight", "board", "home"], status: ["tonight", "board"] };
      for (const f of Object.keys(MAP)) S.watch(f, () => {
        if (f === "fly") for (const x of Object.values(S.get("fly") || {})) if (x.kind && x.kind !== "person") flyPlace(x);
        if (f === "safety" && ctx.redraw) ctx.redraw();
        refresh(MAP[f]);
        if (f === "screen" || f === "fog") { if (UI.dock === "screen") renderPop(); fogDlgPaint(); }
      });
      // the fog brush: a drag over a cave's map in the fog panel clears the fog, or brings it back, square by square. It is
      // kept as the drag goes (every third of a second), so the players' screen follows the brush; the panel is drawn
      // again as it is kept, so the map under the pointer is looked up afresh each time
      let fogStroke = null;
      const fogSvg = () => document.querySelector((fogStroke && fogStroke.dlg ? "#tFogDlg " : "") + ".t-fogpaint svg");
      const fogBrushAt = e => {
        const svg = fogSvg(); if (!svg || !svg.getScreenCTM()) return;
        const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()), C = A.C, n = UI.fogBrush || 3, r = (n - 1) / 2;
        // the brush runs the whole way from where it was to where it is, however fast the hand moves
        const to = [q.x / C, q.y / C], from = fogStroke.last || to, steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / .5)); fogStroke.last = to;
        let g = svg.querySelector(".fog-br"); if (!g) { g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", "fog-br" + (fogStroke.v === "0" ? " cover" : "")); svg.appendChild(g); }
        for (let k = 1; k <= steps; k++) { const x0 = from[0] + (to[0] - from[0]) * k / steps, y0 = from[1] + (to[1] - from[1]) * k / steps;
        for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (n > 1 && Math.hypot(dx, dy) > r + .5) continue;
          const cx = Math.floor(x0) + dx, cy = Math.floor(y0) + dy, k = cx + "," + cy; if (fogStroke.cells.has(k)) continue;
          fogStroke.cells.set(k, [cx, cy]); fogStroke.todo.push([cx, cy]);
          const re = document.createElementNS("http://www.w3.org/2000/svg", "rect"); re.setAttribute("x", cx * C); re.setAttribute("y", cy * C); re.setAttribute("width", C); re.setAttribute("height", C); g.appendChild(re);
        } }
        if (Date.now() - fogStroke.t > 330 && fogStroke.todo.length) { fogStroke.t = Date.now(); paintFog(fogStroke.todo.splice(0), fogStroke.v); }
      };
      document.addEventListener("pointerdown", e => {
        const box = e.target.closest && e.target.closest(".t-fogpaint"); if (!box || e.button) return;
        e.preventDefault(); fogStroke = { v: box.dataset.fogpaint === "reveal" ? "1" : "0", cells: new Map(), todo: [], t: Date.now(), dlg: !!box.closest("#tFogDlg") };
        fogBrushAt(e);
      });
      document.addEventListener("pointermove", e => { if (fogStroke) { e.preventDefault(); fogBrushAt(e); } });
      const fogEnd = () => { if (!fogStroke) return; const st = fogStroke; fogStroke = null; if (st.todo.length) paintFog(st.todo, st.v); };
      document.addEventListener("pointerup", fogEnd); document.addEventListener("pointercancel", fogEnd);
      S.watch("presence", screenStatusPaint); setInterval(screenStatusPaint, 15000);
      S.watch("xcard", xcard);
      document.addEventListener("click", async e => {
        const t = e.target; if (!t.closest) return;
        const x = t.closest("[data-t2]");
        if (x && x.dataset.t2 === "xok") { pref.set("xseen", x.dataset.at); const el = document.getElementById("tXcard"); if (el) el.hidden = true; return; }
        if (x && x.dataset.t2 === "introok") { dismissIntro(); return; }
        const dk = t.closest("[data-dock]"); if (dk) { if (dk.dataset.dock === "close") dockClose(); else dockOpen(dk.dataset.dock); return; }
        // (a click on something its own panel has just drawn again is still inside it)
        if (UI.dock && t.isConnected && !t.closest("#tPop, #tDock, dialog")) dockClose();
        const fh = t.closest(".t-fog .fog-hit"); if (fh) { toggleRoom(fh.dataset.fogroom); return; }
        if (t.closest(".t-fogpaint")) return;
        const b = t.closest("[data-t]"); if (!b || b.tagName === "SELECT" || b.tagName === "TEXTAREA" || (b.tagName === "INPUT") || b.tagName === "FORM") return;
        await act(t, b, e);
      });
      document.addEventListener("change", e => {
        const t = e.target; if (!t.matches || !t.matches("[data-t]")) return;
        const d = t.dataset;
        if (d.t === "session") { S.set("log", "now", { n: +t.value }); }
        else if (d.t === "fogplace") { UI.fogPlace = t.value; UI.fogFloor = 0; renderTab(); fogDlgPaint(); }
        else if (d.t === "fogfloor") { UI.fogFloor = +t.value; renderTab(); fogDlgPaint(); }
        else if (d.t === "fogbrush") UI.fogBrush = +t.value;
        else if (d.t === "fogprev") { UI.fogPrev = t.checked; t.blur(); renderTab(); fogDlgPaint(); }
        else if (d.t === "fogoff") { t.blur(); const cur = S.get("fog", UI.fogPlace) || {}; S.set("fog", UI.fogPlace, Object.assign({}, cur, { off: !t.checked })); }
        else if (d.t === "notes") saveNotes(+d.n, t.value);
        else if (d.t === "lines" || d.t === "veils") { const z = Object.assign({}, S.get("safety", "zero") || {}); z[d.t] = t.value.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, 60); S.set("safety", "zero", z); }
        else if (d.t === "cbset") { const c = cnow(), r = c.list.find(x => x.id === d.id); if (!r) return; r[d.f] = ["name", "note", "ac"].includes(d.f) ? t.value.slice(0, 120) : (t.value === "" ? null : +t.value); cset(c); }
      });
      document.addEventListener("focusout", e => { if (UI.dirty && $("#tvBody") && $("#tvBody").contains(e.target)) setTimeout(() => { if (!$("#tvBody").contains(document.activeElement)) renderTab(); }, 0); });
      document.addEventListener("submit", e => {
        const f = e.target; if (!f.matches) return;
        if (f.matches('[data-t="ask"]')) { e.preventDefault(); const q = f.q.value.trim(); if (q) { f.q.value = ""; ask(q); } }
        if (f.matches('[data-t="jadd"]')) { e.preventDefault(); const ta = f.querySelector("textarea"), v = ta.value.trim().slice(0, 2000); if (!v) return; S.set("journal", uid("j"), { text: v, t: Date.now(), gm: true }); ta.value = ""; }
      });
      document.addEventListener("keydown", e => {
        if (e.key === "Escape" && UI.dock) { dockClose(); return; }
        if (e.key !== "Enter" || !e.target.matches) return;
        if (e.target.matches('[data-t="diceexpr"]')) { e.preventDefault(); rollExpr(boxOf(e.target)); }
        else if (e.target.matches('[data-t="skill"]')) { e.preventDefault(); rollSkill(boxOf(e.target)); }
      });
      window.addEventListener("resize", () => requestAnimationFrame(fitPreviews));
    }
  };
})(ATLAS);
