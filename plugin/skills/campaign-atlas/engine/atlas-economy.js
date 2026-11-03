/* Money and goods (the user's master plan, 26 Oct 2026, part 19: loot and the economy, simple or full as the game
   master wants; prices that differ from place to place and move with what happens in the world (war, famine, a
   blockade, a festival); merchants with stock that comes back as the world's time passes; the party's purse and what
   it carries; loot by rarity, quality and condition). The campaign may give its money, goods, places' prices and
   merchants in table.js (ATLAS.economy: references/table.md, section 21); without them the page uses goods and money
   of the story's age. In the simple way there are the goods at their usual price, the purse, the stash and loot; the
   full way adds prices by place, merchants and what moves prices. What moves prices is kept in collection "prices":
   the game master's own, and an event's or a consequence's (a change of the kind "price", done and undone with it);
   a faction at war makes arms and food dearer where it holds. The purse and the options are in "econ", what the party
   carries in "stash", the merchants the game master adds in "merchants", their stock in "stock". A tab of At the
   table; the world's history is told of loot; a saved moment keeps all of it. */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc;
  const S = () => api.store();
  const W = () => A.worldTime;
  const nowM = () => W() ? W().now() : 0;
  const at = m => W() ? W().at(m) : { short: "", day: 1 };
  const placeName = id => (A.meta[id] || {}).name || id;
  const pls = () => A.order.filter(id => A.meta[id] && !String(id).startsWith("fly-"));
  const D = () => A.economyData || {};
  const UI = { place: "", merchant: "", loot: null, size: "cache" };

  /* ---- goods and money of the story's age (prices in the smallest coin: copper, pence, cents, credits) */
  const AGES = {
    fantasy: { money: { coins: [["gp", 100], ["sp", 10], ["cp", 1]] }, goods: [
      ["Bread, a loaf", "food", 2], ["A hot meal at an inn", "food", 30], ["Rations for a day", "food", 50], ["Ale, a mug", "drink", 4], ["Wine, a bottle", "drink", 200, "uncommon"], ["A bed at an inn, a night", "lodging", 50], ["A room of one's own, a night", "lodging", 200],
      ["Travelling clothes", "clothing", 100], ["A fine cloak", "clothing", 500, "uncommon"], ["Rope, fifty feet", "tools", 100], ["Thieves' tools", "tools", 2500, "uncommon"], ["A lantern", "light", 500], ["Torches, five", "light", 5], ["Lamp oil, a flask", "light", 10],
      ["A dagger", "weapons", 200], ["A sword", "weapons", 1500], ["A longbow", "weapons", 5000, "uncommon"], ["Arrows, twenty", "ammunition", 100], ["Leather armour", "armour", 1000], ["Chain mail", "armour", 7500, "uncommon"], ["A shield", "armour", 1000],
      ["Bandages and herbs", "medicine", 50], ["A healing draught", "medicine", 5000, "rare"], ["A horse", "animals", 7500], ["A wagon ride to the next town", "travel", 50], ["Passage by ship, a day", "travel", 100], ["Ink and parchment", "books", 20], ["A book", "books", 2500, "uncommon"],
      ["A guide for a day", "services", 200], ["A silver ring", "luxury", 1500, "uncommon"]],
      treasure: [["A garnet", 1000, "uncommon"], ["A silver chalice", 2500, "uncommon"], ["A pearl", 10000, "rare"], ["An old map of the hills", 500, "uncommon"], ["A gold idol", 25000, "rare"], ["A scroll of a forgotten spell", 15000, "rare"], ["A ring that hums when touched", 500000, "legendary"], ["A copper bracelet", 300, "common"], ["A carved bone die", 20, "common"]] },
    victorian: { money: { coins: [["£", 240, 1], ["s", 12], ["d", 1]] }, goods: [
      ["A loaf of bread", "food", 2], ["A chop-house dinner", "food", 12], ["A pint of beer", "drink", 2], ["A bottle of claret", "drink", 48, "uncommon"], ["A night in a common lodging house", "lodging", 4], ["A room at a good hotel", "lodging", 120],
      ["A ready-made suit", "clothing", 480], ["Boots", "clothing", 180], ["A bull's-eye lantern", "light", 60], ["Candles, a dozen", "light", 12], ["Matches, a box", "light", 1], ["A magnifying glass", "tools", 36], ["A crowbar", "tools", 30], ["Rope, fifty feet", "tools", 24],
      ["A clasp knife", "weapons", 24], ["A sword-stick", "weapons", 360, "uncommon"], ["A revolver", "weapons", 720, "uncommon"], ["Cartridges, fifty", "ammunition", 60], ["Laudanum, a bottle", "medicine", 6], ["A doctor's visit", "medicine", 126],
      ["A hansom cab, a mile", "travel", 6], ["Third class by rail, fifty miles", "travel", 50], ["First class by rail, fifty miles", "travel", 150], ["A newspaper", "books", 1], ["A book", "books", 72], ["A telegram", "services", 6], ["A word with a constable", "services", 60], ["A gold watch", "luxury", 2400, "rare"]],
      treasure: [["A silver snuffbox", 360, "uncommon"], ["A bundle of banknotes", 1200, "uncommon"], ["A cameo brooch", 600, "uncommon"], ["A diamond ring", 12000, "rare"], ["Letters that someone would pay to keep quiet", 2400, "rare"], ["A tarnished locket", 60, "common"], ["A few shillings in a purse", 40, "common"]] },
    "1920s": { money: { symbol: "$", cents: true }, goods: [
      ["A diner meal", "food", 35], ["A steak dinner", "food", 150], ["Coffee", "drink", 5], ["A bottle of bootleg whiskey", "drink", 400, "uncommon"], ["A cheap hotel room", "lodging", 100], ["A good hotel room", "lodging", 500], ["A suit", "clothing", 2500], ["A trench coat", "clothing", 1500],
      ["A flashlight", "light", 150], ["Batteries", "light", 30], ["Rope, fifty feet", "tools", 200], ["A crowbar", "tools", 100], ["A camera", "tools", 2500, "uncommon"], ["A knife", "weapons", 200], ["A .38 revolver", "weapons", 1800, "uncommon"], ["A shotgun", "weapons", 3500, "uncommon"], ["A Thompson gun", "weapons", 17500, "rare"],
      ["Cartridges, a box", "ammunition", 150], ["A first-aid kit", "medicine", 300], ["A doctor's visit", "medicine", 300], ["A taxi ride", "travel", 50], ["A train ticket, a hundred miles", "travel", 400], ["A used car", "travel", 30000, "uncommon"], ["Gasoline, a gallon", "fuel", 20],
      ["A newspaper", "books", 5], ["An old book", "books", 500, "uncommon"], ["A long-distance call", "services", 150], ["Something for a policeman", "services", 1000], ["A pocket watch", "luxury", 2000, "uncommon"]],
      treasure: [["A roll of bills", 5000, "uncommon"], ["A silver flask", 1500, "uncommon"], ["A pearl necklace", 25000, "rare"], ["An old diary in a strange hand", 1000, "rare"], ["A statuette of no known culture", 50000, "legendary"], ["A few coins and a matchbook", 75, "common"], ["A cigarette case", 300, "common"]] },
    modern: { money: { symbol: "$", cents: true }, goods: [
      ["Fast food", "food", 800], ["A restaurant meal", "food", 3000], ["Coffee", "drink", 400], ["A bottle of wine", "drink", 2000], ["A motel room", "lodging", 8000], ["A hotel room", "lodging", 25000], ["Clothes", "clothing", 6000], ["A good jacket", "clothing", 15000],
      ["A flashlight", "light", 2500], ["Rope, fifty feet", "tools", 3000], ["A crowbar", "tools", 2500], ["Lock picks", "tools", 4000, "uncommon"], ["A laptop", "tech", 90000], ["A phone", "tech", 50000], ["A burner phone", "tech", 5000], ["A drone", "tech", 70000, "uncommon"],
      ["A knife", "weapons", 4000], ["A pistol", "weapons", 60000, "uncommon"], ["A shotgun", "weapons", 50000, "uncommon"], ["Ammunition, a box", "ammunition", 3000], ["A first-aid kit", "medicine", 3000], ["A doctor, no questions asked", "medicine", 50000, "rare"],
      ["A taxi", "travel", 2500], ["A plane ticket", "travel", 40000], ["A used car", "travel", 800000], ["Fuel, a gallon", "fuel", 400], ["A favour from a clerk", "services", 50000, "uncommon"], ["A good watch", "luxury", 30000, "uncommon"]],
      treasure: [["Cash in an envelope", 50000, "uncommon"], ["A hard drive someone wants back", 100000, "rare"], ["A gold chain", 120000, "rare"], ["A painting nobody should have", 2500000, "legendary"], ["Loose change and a key card", 400, "common"], ["A cheap watch", 2000, "common"]] },
    future: { money: { name: "cr" }, goods: [
      ["A ration bar", "food", 2], ["A hot meal", "food", 15], ["Synth-ale", "drink", 5], ["Real coffee", "drink", 40, "uncommon"], ["A bunk for a night", "lodging", 20], ["A cabin for a night", "lodging", 120], ["A ship suit", "clothing", 80], ["A vacuum suit", "clothing", 1500, "uncommon"],
      ["A hand light", "light", 10], ["A power cell", "fuel", 25], ["A tool kit", "tools", 200], ["Cable, thirty metres", "tools", 40], ["A data slate", "tech", 200], ["A comm unit", "tech", 150], ["A drone", "tech", 900, "uncommon"], ["A hacking rig", "tech", 1200, "rare"],
      ["A knife", "weapons", 30], ["A sidearm", "weapons", 600, "uncommon"], ["A rifle", "weapons", 1500, "uncommon"], ["A charge pack", "ammunition", 40], ["A med kit", "medicine", 150], ["A stim shot", "medicine", 60], ["An autodoc treatment", "medicine", 800, "uncommon"],
      ["A transit pass", "travel", 5], ["Passage to the next system", "travel", 2000], ["Fuel, a unit", "fuel", 100], ["A word with a customs officer", "services", 300, "uncommon"], ["Rare spice", "luxury", 500, "rare"]],
      treasure: [["A credit chit", 200, "common"], ["A sealed data core", 2500, "uncommon"], ["A crystal from a dead world", 8000, "rare"], ["An alien artefact that is warm to the touch", 100000, "legendary"], ["Spare parts", 60, "common"], ["A pilot's medal", 400, "uncommon"]] }
  };
  AGES.medieval = AGES.fantasy;
  const age = () => { const e = T.era ? T.era() : "fantasy"; return AGES[e] || AGES.fantasy; };
  const money = () => Object.assign({}, D().currency ? (typeof D().currency === "string" ? { name: D().currency } : D().currency) : age().money);
  // a sum in the smallest coin, written as the story's money
  function fmt(n) {
    n = Math.round(+n || 0); const c = money(), neg = n < 0 ? "−" : ""; n = Math.abs(n);
    if (c.coins) { const out = []; let r = n; for (const [nm, v, pre] of c.coins) { const k = Math.floor(r / v); r -= k * v; if (k) out.push(pre ? nm + k : k + (nm.length > 1 ? " " : "") + nm); } return neg + (out.join(" ") || "0" + (c.coins[c.coins.length - 1][0].length > 1 ? " " : "") + c.coins[c.coins.length - 1][0]); }
    if (c.symbol) return neg + c.symbol + (c.cents ? (n / 100).toFixed(n % 100 ? 2 : 0) : n);
    return neg + n.toLocaleString("en") + " " + (c.name || "");
  }
  // a sum as the game master writes it ("2 gp 5 sp", "£1 5s", "$3.50", "120"), in the smallest coin
  function parse(s) {
    if (typeof s === "number") return Math.round(s); const c = money(), t = String(s || "").trim(); if (!t) return 0;
    if (c.coins) { let n = 0, any = false; for (const [nm, v] of c.coins) { const re = new RegExp("(?:" + nm.replace(/[£$]/g, "\\$&") + "\\s*(\\d+(?:\\.\\d+)?)|(\\d+(?:\\.\\d+)?)\\s*" + nm.replace(/[£$]/g, "\\$&") + "\\b)", "i"), m = re.exec(t); if (m) { n += +(m[1] || m[2]) * v; any = true; } } if (any) return Math.round(n); return Math.round((+t.replace(/[^\d.]/g, "") || 0) * c.coins[0][1]); }
    const v = +t.replace(/[^\d.]/g, "") || 0; return c.cents ? Math.round(v * 100) : Math.round(v);
  }
  // every kind of goods, each { id, n, kind, price, rarity }: the campaign's own over the age's
  function goods() {
    const own = D().goods, out = [];
    if (own) for (const [id, g] of Object.entries(own)) out.push({ id, n: g.n || id, kind: g.kind || "goods", price: parse(g.price), rarity: g.rarity || "common", own: true });
    if (!own || D().keepAge) age().goods.forEach(([n, kind, price, rarity], i) => out.push({ id: "g" + i, n, kind, price, rarity: rarity || "common" }));
    return out;
  }
  const kinds = () => [...new Set(goods().map(g => g.kind))];
  const goodsOf = id => goods().find(g => g.id === id);

  /* ---- what moves prices: a place's own, the game master's, an event's or a consequence's, and war */
  const conds = () => Object.entries((S() && S().get("prices")) || {}).filter(([, c]) => c && (c.until == null || nowM() < c.until)).map(([id, c]) => Object.assign({ id }, c));
  const facs = () => A.lives ? Object.keys(A.factionsData || {}).map(A.lives.fac).filter(Boolean) : [];
  function wars() {
    const out = [];
    for (const f of facs()) if (Object.values(f.rels || {}).includes("war")) for (const p of f.territory || []) out.push({ id: "war-" + f.id + "-" + p, goods: "weapons", place: p, by: 1.5, why: `${f.n} is at war`, war: true }, { id: "warf-" + f.id + "-" + p, goods: "food", place: p, by: 1.25, why: `${f.n} is at war`, war: true });
    return out;
  }
  const region = p => (D().regions || {})[p] || null;
  // the price of a kind of goods at a place (or anywhere), and why it is not the usual
  function price(g, place) {
    let v = g.price; const why = [];
    if (mode() === "full" && place) {
      const r = region(place);
      if (r) { if (r.by && r.by !== 1) { v *= r.by; why.push((r.note || placeName(place)) + " ×" + r.by); } if ((r.scarce || []).includes(g.kind)) { v *= 1.5; why.push(`${g.kind} are scarce here`); } if ((r.plenty || []).includes(g.kind)) { v *= .75; why.push(`${g.kind} are plentiful here`); } }
    }
    if (mode() === "full") for (const c of conds().concat(wars())) if ((!c.place || c.place === place) && (c.goods === "all" || c.goods === g.kind || c.goods === g.id)) { v *= +c.by || 1; why.push(`${c.why || "prices move"} ×${+c.by}`); }
    return { v: Math.max(1, Math.round(v)), why };
  }

  /* ---- the purse, the stash, the merchants */
  const econ = k => (S() && S().get("econ", k)) || {};
  // (simple or full is Money and goods' own level in What this campaign uses, where the campaign has chosen; else as before)
  const chosen = () => A.modules && A.config && (A.config.features || (S() && S().get("features", "now")));
  const mode = () => chosen() ? (A.modules.on("money", "full") ? "full" : "simple") : econ("opts").mode || D().mode || "simple";
  const purse = () => econ("purse").n != null ? +econ("purse").n : parse(D().purse || 0);
  function spend(by, what) {
    const p = econ("purse"), n = purse() + by, log = (p.log || []).concat({ m: nowM(), by, what: String(what || "").slice(0, 120) }).slice(-40);
    S().set("econ", "purse", { n, log });
  }
  const stash = () => Object.entries((S() && S().get("stash")) || {}).filter(([, x]) => x && x.n).sort((a, b) => b[1].t - a[1].t);
  const putItem = x => S().set("stash", "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), Object.assign({ t: Date.now(), m: nowM(), qty: 1 }, x));
  function merchants() {
    const own = (S() && S().get("merchants")) || {}, out = [];
    for (const [id, m] of Object.entries(D().merchants || {})) if (!(own[id] && own[id].gone)) out.push(Object.assign({ id }, m, own[id] || {}));
    for (const [id, m] of Object.entries(own)) if (m && !m.gone && !(D().merchants || {})[id]) out.push(Object.assign({ id, mine: true }, m));
    return out;
  }
  const sells = m => goods().filter(g => !(m.sells || []).length || m.sells.includes(g.kind) || m.sells.includes(g.id));
  const fullOf = (m, g) => g.rarity === "rare" || g.rarity === "legendary" ? 1 : g.rarity === "uncommon" ? Math.max(1, Math.round((m.stock || 3) / 2)) : (m.stock || 3);
  // what a merchant has now: all of it again once their days have passed since it was last made up
  function stockOf(m) {
    const s = (S() && S().get("stock", m.id)) || null, every = (+m.restock || 7) * 1440, n = nowM();
    const fresh = !s || n - (s.at || 0) >= every, q = {};
    for (const g of sells(m)) q[g.id] = fresh ? fullOf(m, g) : (s.q || {})[g.id] != null ? s.q[g.id] : fullOf(m, g);
    return { q, at: fresh ? n : s.at, next: (fresh ? n : s.at) + every };
  }
  function buy(m, gid) {
    const g = goodsOf(gid), s = stockOf(m); if (!g || !(s.q[gid] > 0)) return;
    const p = Math.round(price(g, m.at).v * (+m.markup || 1));
    if (purse() < p) { api.note(`The party has ${fmt(purse())}; ${g.n} costs ${fmt(p)}.`); return; }
    s.q[gid]--; S().set("stock", m.id, { q: s.q, at: s.at });
    spend(-p, `${g.n}, from ${m.n || "a merchant"}`); putItem({ n: g.n, kind: g.kind, value: g.price, rarity: g.rarity, quality: "plain", cond: "good", from: "bought" });
    api.note(`Bought: ${g.n} for ${fmt(p)}.`);
  }
  // what the party gets for a thing: half its worth where it is sold, or what the merchant buying it gives
  function sellPrice(x) { const m = merchants().find(y => y.id === UI.merchant), g = { price: +x.value || 0, kind: x.kind || "" }; return Math.round(price(g, m ? m.at : UI.place).v * (m ? (+m.buys || .5) : .5)); }

  /* ---- loot: coins and things, by rarity, quality and condition */
  const QUAL = [["shoddy", "Shoddy", .5, 15], ["plain", "Plain", 1, 63], ["fine", "Fine", 1.8, 18], ["masterwork", "Masterwork", 4, 4]];
  const COND = [["broken", "Broken", .15, 8], ["worn", "Worn", .6, 32], ["good", "Good", 1, 50], ["new", "As new", 1.15, 10]];
  const RAR = { common: 1, uncommon: 2, rare: 3, legendary: 4 };
  const SIZES = [["pockets", "What someone carries", [0, 2], 1, [0, .3]], ["cache", "A hidden cache", [1, 3], 2, [.5, 2]], ["hoard", "A hoard", [3, 6], 3, [3, 12]]];
  const pickW = l => { let r = Math.random() * l.reduce((a, x) => a + x[3], 0); for (const x of l) if ((r -= x[3]) < 0) return x; return l[0]; };
  function rollLoot(size) {
    const [, , [a, b], lvl, [c0, c1]] = SIZES.find(s => s[0] === size) || SIZES[1], base = goods().filter(g => !["lodging", "services", "travel", "food", "drink"].includes(g.kind)).map(g => [g.n, g.price, g.rarity, g.kind]);
    const tre = (D().treasure || age().treasure).map(t => Array.isArray(t) ? [t[0], parse(t[1]), t[2] || "common", "valuables"] : [t.n, parse(t.value), t.rarity || "common", t.kind || "valuables"]);
    const pool = base.concat(tre, tre), out = [], n = a + Math.floor(Math.random() * (b - a + 1));
    const rar = () => { const r = Math.random() * 100; return lvl === 3 ? (r < 40 ? "common" : r < 75 ? "uncommon" : r < 96 ? "rare" : "legendary") : lvl === 2 ? (r < 60 ? "common" : r < 90 ? "uncommon" : r < 99 ? "rare" : "legendary") : (r < 85 ? "common" : r < 98 ? "uncommon" : "rare"); };
    for (let i = 0; i < n; i++) {
      const want = rar(), l = pool.filter(x => x[2] === want), pick = (l.length ? l : pool)[Math.floor(Math.random() * (l.length || pool.length))];
      const q = pick[3] === "valuables" ? QUAL[1] : pickW(QUAL), cd = pickW(COND);
      out.push({ n: pick[0], kind: pick[3], rarity: pick[2], quality: q[0], cond: cd[0], value: Math.max(1, Math.round(pick[1] * q[2] * cd[2])) });
    }
    // the coins: a day's wage and more, as the age reckons it (its dearest meal is a fair measure of a day)
    const day = Math.max(...goods().filter(g => g.kind === "food").map(g => g.price), 10) * 4;
    return { size, coins: Math.round(day * (c0 + Math.random() * (c1 - c0))), items: out };
  }
  const word = (L, k) => (L.find(x => x[0] === k) || [0, k])[1];
  const itemLine = x => `${x.quality && x.quality !== "plain" ? word(QUAL, x.quality) + ", " : ""}${x.cond && x.cond !== "good" ? word(COND, x.cond).toLowerCase() + ", " : ""}${x.rarity && x.rarity !== "common" ? x.rarity : ""}`.replace(/, $/, "");

  /* ---- prices as a change an event or a consequence makes (atlas-factions.js keeps the other kinds) */
  const FX = A.worldEffects;
  function cleanPrice(x) {
    const g = String(x.price != null ? x.price : x.goods || "all"), ok = g === "all" || kinds().includes(g) || !!goodsOf(g), by = Math.max(.25, Math.min(4, +x.by || 1.25));
    if (!ok || (x.place && !A.meta[x.place])) return null;
    return Object.assign({ price: g, by: Math.round(by * 100) / 100 }, x.place ? { place: x.place } : {}, +x.days ? { days: Math.min(365, Math.round(+x.days)) } : {});
  }
  const sayPrice = x => `${x.price === "all" ? "All prices" : "Prices of " + ((goodsOf(x.price) || {}).n || x.price)}${x.place ? " at " + placeName(x.place) : ""} ×${x.by}${x.days ? " for " + x.days + " days" : ""}`;
  if (FX) {
    FX.KINDS.push(["price", "Prices change"]);
    const { apply, say, toRow, fromRow, rowHTML } = FX;
    FX.apply = (e, when) => {
      const undo = apply(e, when), st = S();
      for (const x of (e.effects || []).filter(x => x.price != null)) {
        const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        undo.push({ coll: "prices", id, before: null });
        st.set("prices", id, Object.assign({ goods: x.price, by: +x.by || 1, why: e.title || "", from: "event", t: Date.now(), m: nowM() }, x.place ? { place: x.place } : {}, x.days ? { until: nowM() + x.days * 1440 } : {}));
      }
      return undo;
    };
    FX.say = x => x.price != null ? sayPrice(x) : say(x);
    FX.toRow = x => x.price != null ? { k: "price", a: x.price, b: x.place || "", c: String(x.by), d: String(x.days || "") } : toRow(x);
    FX.fromRow = r => r.k === "price" ? cleanPrice({ price: r.a || "all", place: r.b, by: r.c, days: r.d }) : fromRow(r);
    FX.rowHTML = (r, i) => {
      if (r.k !== "price") return rowHTML(r, i);
      const n = k => `fx${k}${i}`, o = (v, l, cur) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(l)}</option>`;
      return `<div class="tw-cond tw-fx"><select class="t-in" name="${n("k")}" data-twfx="kind" aria-label="What changes"><option value="">What changes…</option>${FX.KINDS.map(([k, l]) => o(k, l, r.k)).join("")}</select>
        <select class="t-in" name="${n("a")}" aria-label="Which goods">${o("all", "All goods", r.a)}${kinds().map(k => o(k, k[0].toUpperCase() + k.slice(1), r.a)).join("")}</select>
        <select class="t-in" name="${n("b")}" aria-label="Where">${o("", "Everywhere", r.b)}${pls().map(p => o(p, placeName(p), r.b)).join("")}</select>
        <input class="t-in t-n" type="number" step="0.05" min="0.25" max="4" name="${n("c")}" value="${esc(r.c || "1.5")}" aria-label="Times the usual price" title="Times the usual price">
        <input class="t-in t-n" type="number" min="0" name="${n("d")}" value="${esc(r.d || "")}" placeholder="days" aria-label="For how many days"><button type="button" class="t-mini" data-tw="delfx" data-i="${i}" aria-label="Remove this change">×</button></div>`;
    };
  }

  /* ---- drawing it */
  const BY = [["0.5", "Half the price"], ["0.75", "Cheaper"], ["1.25", "Dearer"], ["1.5", "Much dearer"], ["2", "Twice the price"], ["3", "Scarce: three times"]];
  function priceList(place) {
    const by = {}; for (const g of goods()) (by[g.kind] = by[g.kind] || []).push(g);
    return Object.entries(by).map(([k, l]) => `<h4 class="tw-sub">${esc(k)}</h4><ul class="ec-l">${l.map(g => { const p = price(g, place), up = p.v > g.price, dn = p.v < g.price; return `<li><span>${esc(g.n)}${g.rarity !== "common" ? ` <span class="kn">${esc(g.rarity)}</span>` : ""}</span><b class="${up ? "ec-up" : dn ? "ec-dn" : ""}"${p.why.length ? ` title="${esc(p.why.join("; "))}"` : ""}>${esc(fmt(p.v))}${up ? " ↑" : dn ? " ↓" : ""}</b></li>`; }).join("")}</ul>`).join("");
  }
  function merchantHTML(m) {
    const s = stockOf(m), l = sells(m).filter(g => s.q[g.id] > 0);
    return `<div class="tw-ev"><div class="tw-h"><b>${esc(m.n || m.id)}</b><span class="kn">${m.at ? esc(placeName(m.at)) : ""}${m.who && (A.castData || {})[m.who] ? " · " + esc(A.castData[m.who].n) : ""} · stock made up again on day ${esc(at(s.next).day)}</span>${m.mine ? `<button type="button" class="t-link" data-ec="mdel" data-id="${esc(m.id)}">remove</button>` : ""}</div>
      ${l.length ? `<ul class="ec-l">${l.map(g => `<li><span>${esc(g.n)} <span class="kn">${s.q[g.id]} left</span></span><b>${esc(fmt(Math.round(price(g, m.at).v * (+m.markup || 1))))}</b><button type="button" class="t-mini" data-ec="buy" data-m="${esc(m.id)}" data-g="${esc(g.id)}">Buy</button></li>`).join("")}</ul>` : `<p class="kn">Sold out until day ${esc(at(s.next).day)}.</p>`}</div>`;
  }
  function html() {
    const full = mode() === "full", P = econ("purse"), L = UI.loot, st = stash(), ms = merchants(), opt = (v, l, cur) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(l)}</option>`;
    return `<div class="t-grid t-g2w"><div>
      <section class="t-card"><div class="tw-hh"><h3>${T.icon("coin")} The party's purse</h3><span class="ec-purse">${esc(fmt(purse()))}</span></div>
        <form class="ec-cf" data-ec="purse"><input class="t-in t-n" name="n" placeholder="${esc(fmt(parse("10")))}" aria-label="How much"><input class="t-in" name="w" maxlength="120" placeholder="What for" aria-label="What for"><button class="t-mini" name="add" value="1">Add</button><button class="t-mini" name="spend" value="1">Spend</button></form>
        ${(P.log || []).length ? `<ul class="ec-log">${P.log.slice(-6).reverse().map(x => `<li><span class="kn">${esc(at(x.m).short)}</span> ${esc(x.what || "")} <b class="${x.by < 0 ? "ec-up" : "ec-dn"}">${x.by > 0 ? "+" : ""}${esc(fmt(x.by))}</b></li>`).join("")}</ul>` : ""}</section>
      <section class="t-card"><h3>Loot</h3><p class="t-small">Roll what is found: coins, and things of the story's age, each common, uncommon, rare or legendary, made well or badly, whole or broken, and worth what that makes them.</p>
        <div class="t-row"><select class="t-in tw-sel" data-ec="size" aria-label="How much">${SIZES.map(([k, l]) => opt(k, l, UI.size)).join("")}</select><button type="button" class="t-btn" data-ec="roll">${L ? "Roll again" : "Roll loot"}</button></div>
        ${L ? `<div class="ec-loot"><p><b>${esc(fmt(L.coins))}</b> in coin</p><ul class="ec-l">${L.items.map((x, i) => `<li class="ec-r-${esc(x.rarity)}"><span>${esc(x.n)} <span class="kn">${esc(itemLine(x))}</span></span><b>${esc(fmt(x.value))}</b><button type="button" class="t-mini" data-ec="ldrop" data-i="${i}" aria-label="Leave it">×</button></li>`).join("")}</ul>
          <div class="t-row"><button type="button" class="t-btn prim" data-ec="ltake">The party takes it</button><button type="button" class="t-mini" data-ec="lclear">Leave it</button></div></div>` : ""}</section>
      <section class="t-card"><h3>What the party carries</h3>${st.length ? `<ul class="ec-l">${st.map(([id, x]) => `<li><span>${esc(x.n)}${x.qty > 1 ? " ×" + x.qty : ""} <span class="kn">${esc(itemLine(x))}</span></span><b>${esc(fmt(x.value))}</b><button type="button" class="t-mini" data-ec="sell" data-id="${esc(id)}" title="Sold for ${esc(fmt(sellPrice(x)))}">Sell</button><button type="button" class="t-mini" data-ec="drop" data-id="${esc(id)}" aria-label="Remove">×</button></li>`).join("")}</ul>` : `<p class="kn">Nothing yet.</p>`}
        <form class="ec-cf" data-ec="item"><input class="t-in" name="n" maxlength="100" placeholder="Something of their own" aria-label="What"><input class="t-in t-n" name="v" placeholder="worth" aria-label="Worth"><button class="t-mini">Add</button></form>
        <p class="t-small kn">Selling gives ${full ? "what the market where they are pays (or the chosen merchant)" : "half of a thing's worth"}.</p></section>
      ${full ? `<section class="t-card"><h3>Merchants</h3>${ms.length ? ms.map(merchantHTML).join("") : `<p class="kn">None yet.</p>`}
        <form class="ec-mf" data-ec="madd"><input class="t-in" name="n" maxlength="80" required placeholder="A merchant: Old Ma Grieve's" aria-label="Name"><select class="t-in" name="at" aria-label="Where">${opt("", "Where…", "")}${pls().map(p => opt(p, placeName(p), "")).join("")}</select>
          <select class="t-in" name="sells" multiple size="4" aria-label="What they sell">${kinds().map(k => opt(k, k, "")).join("")}</select><label class="t-small">Made up every <input class="t-in t-n" type="number" name="r" min="1" value="7"> days</label><button class="t-mini">Add a merchant</button></form></section>` : ""}</div>
      <div><section class="t-card"><div class="tw-hh"><h3>Prices</h3><label class="t-small"><select class="t-in tw-sel" data-ec="mode" aria-label="Simple or full">${opt("simple", "Simple: the usual prices", mode())}${opt("full", "Full: by place, merchants, what moves prices", mode())}</select></label></div>
        ${full ? `<div class="t-row"><label class="t-small">At <select class="t-in tw-sel" data-ec="place">${opt("", "Anywhere", UI.place)}${pls().map(p => opt(p, placeName(p), UI.place)).join("")}</select></label>${ms.length ? `<label class="t-small">Selling to <select class="t-in tw-sel" data-ec="merchant">${opt("", "The market", UI.merchant)}${ms.map(m => opt(m.id, m.n || m.id, UI.merchant)).join("")}</select></label>` : ""}</div>` : ""}
        ${full ? `<div class="ec-moves"><h4 class="tw-sub">What moves prices</h4>${conds().concat(wars()).map(c => `<div class="tw-ev"><div class="tw-h"><b>${esc(c.why || "Prices move")}</b><span class="kn">${esc(c.goods === "all" ? "everything" : c.goods)}${c.place ? " at " + esc(placeName(c.place)) : " everywhere"} ×${esc(c.by)}${c.until ? " · until day " + esc(at(c.until).day) : ""}${c.from === "event" ? " · from an event" : ""}</span>${c.war ? `<span class="tw-tag">while the war lasts</span>` : `<button type="button" class="t-link" data-ec="cdel" data-id="${esc(c.id)}">remove</button>`}</div></div>`).join("") || `<p class="kn">Nothing: prices are as usual.</p>`}
        <form class="ec-cf" data-ec="cadd"><input class="t-in" name="why" maxlength="100" required placeholder="Why: the harvest failed" aria-label="Why"><select class="t-in" name="g" aria-label="Which goods">${opt("all", "All goods", "")}${kinds().map(k => opt(k, k, "")).join("")}</select><select class="t-in" name="p" aria-label="Where">${opt("", "Everywhere", "")}${pls().map(p => opt(p, placeName(p), "")).join("")}</select><select class="t-in" name="by" aria-label="How much">${BY.map(([v, l]) => opt(v, l, "1.5")).join("")}</select><input class="t-in t-n" type="number" name="d" min="0" placeholder="days" aria-label="For how many days"><button class="t-mini">Add</button></form></div>` : ""}
        ${priceList(full ? UI.place : "")}</section></div></div>`;
  }

  /* ---- what the game master does */
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-ec]"); if (!b || ["FORM", "SELECT", "INPUT"].includes(b.tagName)) return;
    const k = b.dataset.ec, id = b.dataset.id;
    switch (k) {
      case "roll": UI.loot = rollLoot(UI.size); break;
      case "ldrop": UI.loot.items.splice(+b.dataset.i, 1); break;
      case "lclear": UI.loot = null; break;
      case "ltake": {
        const L = UI.loot; if (!L) return; if (L.coins) spend(L.coins, "Loot"); for (const x of L.items) putItem(Object.assign({ from: "loot" }, x));
        if (A.history) A.history.add({ kind: "loot", title: `Found: ${[L.coins ? fmt(L.coins) : "", ...L.items.map(x => x.n.replace(/^an? /i, "").replace(/^./, c => c.toLowerCase()))].filter(Boolean).join(", ")}`.slice(0, 140), what: L.items.map(x => `${x.n} (${[itemLine(x), fmt(x.value)].filter(Boolean).join(", ")})`).join("; "), vis: "players" });
        UI.loot = null; api.note("The party has it: in the purse and what they carry."); break;
      }
      case "sell": { const x = S().get("stash", id); if (!x) return; const p = sellPrice(x); spend(p, `Sold: ${x.n}`); S().set("stash", id, x.qty > 1 ? Object.assign({}, x, { qty: x.qty - 1 }) : null); break; }
      case "drop": S().set("stash", id, null); break;
      case "buy": { const m = merchants().find(y => y.id === b.dataset.m); if (m) buy(m, b.dataset.g); break; }
      case "mdel": S().set("merchants", id, (D().merchants || {})[id] ? { gone: true } : null); break;
      case "cdel": S().set("prices", id, null); break;
      default: return;
    }
    paint();
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || !t.dataset.ec) return;
    // (the same choice as Money and goods' level in What this campaign uses, once the campaign has chosen there)
    if (t.dataset.ec === "mode") { if (chosen()) A.modules.set("money", t.value === "full" ? "full" : "simple"); else S().set("econ", "opts", Object.assign({}, econ("opts"), { mode: t.value })); }
    else if (t.dataset.ec === "place") UI.place = t.value; else if (t.dataset.ec === "merchant") UI.merchant = t.value; else if (t.dataset.ec === "size") UI.size = t.value; else return;
    t.blur(); paint();
  });
  document.addEventListener("submit", e => {
    const f = e.target; if (!f.dataset || !f.dataset.ec) return; e.preventDefault();
    const g = n => String((f.elements[n] || {}).value || "").trim();
    if (f.dataset.ec === "purse") { const n = parse(g("n")); if (!n) return; const out = e.submitter && e.submitter.name === "spend"; spend(out ? -n : n, g("w") || (out ? "Spent" : "Added")); }
    else if (f.dataset.ec === "item") { if (!g("n")) return; putItem({ n: g("n").slice(0, 100), value: parse(g("v")), quality: "plain", cond: "good", from: "own" }); }
    else if (f.dataset.ec === "madd") { const sel = [...f.elements.sells.selectedOptions].map(o => o.value); S().set("merchants", "m" + Date.now().toString(36), Object.assign({ n: g("n").slice(0, 80), restock: Math.max(1, +g("r") || 7), stock: 3 }, g("at") ? { at: g("at") } : {}, sel.length ? { sells: sel } : {})); }
    else if (f.dataset.ec === "cadd") { const d = +g("d"); S().set("prices", "p" + Date.now().toString(36), Object.assign({ why: g("why").slice(0, 100), goods: g("g") || "all", by: +g("by") || 1.5, from: "gm", t: Date.now(), m: nowM() }, g("p") ? { place: g("p") } : {}, d > 0 ? { until: nowM() + d * 1440 } : {})); }
    f.reset(); if (document.activeElement) document.activeElement.blur(); paint();
  });
  function paint() { if (api.tab() === "money") api.render(); }

  TU.addTab({ key: "money", label: "Money and goods", icon: "coin", group: "play", after: "deeds", desc: "The purse, what the party carries, loot, prices, merchants",
    html, status: () => `${fmt(purse())} in the purse${stash().length ? ` · ${stash().length} thing${stash().length > 1 ? "s" : ""} carried` : ""}`,
    init(store) { for (const c of ["econ", "stash", "prices", "merchants", "stock", "clock", "factions"]) store.watch(c, () => paint()); if (A.history) for (const c of ["econ", "stash", "prices", "merchants", "stock"]) A.history.keep(c); } });

  // (ATLAS.economy, the campaign's own, is how table.js gives its money and goods: the page's are A.money)
  A.money = { fmt, parse, goods, kinds, price, purse, spend, stash, merchants, stockOf, rollLoot, conds: () => conds().concat(wars()), cleanPrice, mode, sayPrice };
})(ATLAS);
