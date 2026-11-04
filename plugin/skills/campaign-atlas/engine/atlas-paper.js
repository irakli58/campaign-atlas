/* The world's newspaper (the user's approved idea of 3 Nov 2026, the seventh in the workspace's
   reviews/2026-11-03-ideas.md: "each in-game week, the news is printed as a handout in the age's style (a broadsheet,
   a town crier's sheet, a datapad bulletin), ready for the players' screen").
   When a week of the story ends, the news the players were told in it (collection "news": the game master's own, the
   events they let the players hear, the rumours told) is printed as that week's paper, a handout of the kind "gazette"
   drawn in the campaign's age (atlas-table.js handoutHTML), with the weather ahead where the party is (atlas-weather.js).
   It waits in The world's time, under the news, for the game master to show it on the players' screen, which gives it
   to them to keep. A week with no news prints nothing; the week so far can be printed at any time. A week is the
   calendar's own (as many days as it has weekdays), else seven. Kept in collection "papers". */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T || !A.worldTime) return;
  const api = TU.api, esc = A.esc, S = () => api.store(), WT = A.worldTime;
  const cal = () => Object.assign({}, A.calendarData || {}, (S() && S().get("clock", "cal")) || {});
  const weekLen = () => { const w = cal().weekdays; return w && w.length >= 3 ? w.length : 7; };
  // the week a moment falls in, from the story's first day, and where it begins and ends
  const weekOf = m => Math.floor((WT.at(m).day - 1) / weekLen());
  // (the story's first day began some hours before its first moment, at midnight)
  const startOf = k => { const o = WT.at(0), mm = /(\d{1,2}):(\d{2})\s*$/.exec(o.short || ""), off = mm ? +mm[1] * 60 + +mm[2] : o.h * 60; return k * weekLen() * 1440 - off; };
  const opts = () => (S() && S().get("papers", "opts")) || {};

  // its name, as the age would have it, after the place the party is in
  function name() {
    const e = T.era(), w = A.worlds && A.worlds.main, p = w && w.data ? Object.assign({}, w.data.party || {}, ((S() && S().get("world")) || {}).party || {}) : {}, L = p.at && w.data ? (w.data.locations || []).find(l => l.id === p.at) : null;
    const town = (L && L.name) || String((A.cityData && A.cityData.title) || (A.config && A.config.setting) || "Evening").replace(/^(a true map of|the)\s+/i, "").split(/[,·(]/)[0].trim();
    const t = town.replace(/^the\s+/i, "");
    return e === "medieval" || e === "fantasy" ? `The ${t} Crier` : e === "future" ? `${t} Newsfeed` : e === "modern" ? `The ${t} Daily` : T.paperName ? T.paperName({}) : `The ${t} Gazette`;
  }
  // a week's news, oldest first: what the players were told, once each
  function itemsOf(a, b) {
    const seen = new Set();
    return Object.values((S() && S().get("news")) || {}).filter(n => n && n.headline && n.m != null && n.m >= a && n.m < b).sort((x, y) => x.m - y.m)
      .filter(n => { const k = (n.headline || "").toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
      .map(n => ({ headline: n.headline, text: n.text && n.text !== n.headline ? n.text : "", paper: n.paper || "", m: n.m }));
  }
  function print(k, soFar) {
    const a = startOf(k), b = soFar ? WT.now() + 1 : startOf(k + 1), items = itemsOf(a, b); if (!items.length) return null;
    // the lead: what matters most, a major or critical event's news first, else the latest
    items.sort((x, y) => (rank(y) - rank(x)) || (y.m - x.m));
    const d0 = WT.at(a), d1 = WT.at(Math.max(a, b - 1)), wxd = A.weather ? [1, 2].map(i => A.weather.at(A.weather.party(), b + (i - 1) * 1440)).filter(Boolean) : [];
    const wx = wxd.length && !wxd[0].none ? `The weather ahead${A.weather.party() ? " at " + A.weather.party().name : ""}: ${wxd.map(d => { const s = A.weather.short(d); return s[0].toLowerCase() + s.slice(1); }).join("; then ")}.` : "";
    const doc = { k, m: b, t: Date.now(), paper: name(), era: T.era(), date: soFar ? `${d0.short.replace(/,.*$/, "")} to ${d1.short.replace(/,.*$/, "")}, so far` : `The week of ${d0.short.replace(/,.*$/, "")} to ${d1.short.replace(/,.*$/, "")}`, items: items.slice(0, 8).map(({ headline, text, paper }) => ({ headline, text, paper })), weather: wx, soFar: !!soFar };
    S().set("papers", "w" + k, doc);
    return doc;
  }
  const rank = n => { const e = WT.events().find(x => (x.news && x.news.headline === n.headline) || x.title === n.headline); return e ? ({ critical: 3, major: 2, notable: 1, minor: 1 }[e.importance] || 0) : 0; };
  const handout = (id, P) => ({ id: "paper-" + id, kind: "gazette", era: P.era, title: `${P.paper}: ${P.date}`, paper: P.paper, date: P.date, items: P.items, weather: P.weather });
  // a week that has ended is printed by itself, once, if it had news (unless the game master has said not to)
  function catchUp() {
    const st = S(); if (!st || opts().off) return; const k = weekOf(WT.now()) - 1; if (k < 0) return;
    const P = st.get("papers", "w" + k); if (P && !P.soFar) return; const done = print(k, false); if (done) api.note(`This week's paper is printed: ${done.paper}. Show it from The world's time.`);
  }
  function papers() { return Object.entries((S() && S().get("papers")) || {}).filter(([id, P]) => id !== "opts" && P && P.items).sort((a, b) => b[1].k - a[1].k || b[1].t - a[1].t); }

  // under the world's news in The world's time
  function html() {
    const L = papers(), given = (S() && S().get("given")) || {};
    return `<div class="tw-paper"><h4 class="tw-sub">The week's paper</h4><p class="t-small">Each week of the story, the news the players were told is printed as ${esc({ medieval: "the town crier's sheet", fantasy: "the town crier's sheet", future: "a newsfeed bulletin", modern: "a daily paper" }[T.era()] || "a broadsheet")}, ready to show them.</p>
      ${L.slice(0, 4).map(([id, P]) => `<details class="tw-pp"><summary><b>${esc(P.paper)}</b> <span class="kn">${esc(P.date)} · ${P.items.length} stor${P.items.length === 1 ? "y" : "ies"}${given["paper-" + id] ? " · shown" : ""}</span></summary>${T.handoutHTML(handout(id, P))}</details><div class="t-row"><button type="button" class="t-mini" data-pp="show" data-id="${esc(id)}">${given["paper-" + id] ? "Show it again" : "Show it on the players' screen"}</button></div>`).join("") || `<p class="kn">No paper yet.</p>`}
      <div class="t-row"><button type="button" class="t-mini" data-pp="now">Print the week so far</button><label class="t-small"><input type="checkbox" data-pp="auto"${opts().off ? "" : " checked"}> Print each week's by itself</label></div></div>`;
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-pp]"); if (!b || b.tagName === "INPUT") return;
    if (b.dataset.pp === "now") { const P = print(weekOf(WT.now()), true); api.note(P ? `Printed: ${P.paper}, ${P.date}.` : "Nothing has been told to the players this week."); }
    else if (b.dataset.pp === "show") { const P = S().get("papers", b.dataset.id); if (P) api.show({ kind: "handout", id: "paper-" + b.dataset.id, h: handout(b.dataset.id, P) }); }
    else return;
    setTimeout(() => { if (api.tab() === "time") api.render(); }, 60);
  });
  document.addEventListener("change", e => { const t = e.target; if (t.dataset && t.dataset.pp === "auto") { S().set("papers", "opts", Object.assign({}, opts(), { off: !t.checked })); if (t.checked) setTimeout(catchUp, 60); } });

  // following the clock: a week ended prints its paper
  let watching = false;
  function follow() { const st = S(); if (!st || watching) return; watching = true; st.watch("papers", () => { if (api.tab() === "time") api.render(); }); st.watch("news", () => {}); st.watch("clock", () => setTimeout(catchUp, 30)); }
  A.paper = { html: () => { follow(); return html(); }, print, weekOf, follow, papers };
})(ATLAS);
