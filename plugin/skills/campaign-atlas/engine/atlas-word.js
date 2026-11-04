/* Word between groups (the user's approved idea of 3 Nov 2026, the fourteenth in the workspace's
   reviews/2026-11-03-ideas.md: "one world, many campaigns: several campaigns, or several groups, share one world and its
   history (West Marches style); what one group does, the other hears about").
   Campaigns that share a world (atlas.js world <campaign> --from <other>, which marks world.js shared: "<id>") pass word
   of what happens to each other: what the party did, what came of it, what happened in the world, the news, where they
   went. Sending gathers what has happened here since word was last sent; in the Atlas app it goes to every campaign of
   the same world on this computer, and anywhere it can be saved as a small file and read in on the other page.
   Received, nothing reaches the players by itself: the game master lets each piece spread, and it starts in the rumour
   mill where it happened (atlas-rumours.js), told and changed on the roads like any rumour, and is written in the
   world's history as word from that group. Kept in collection "word" (what was sent and received). */
(function (A) {
  "use strict";
  const TU = A.tableUI, T = A.table; if (!TU || !T) return;
  const api = TU.api, esc = A.esc, S = () => api.store();
  const nowM = () => (A.worldTime ? A.worldTime.now() : 0), at = m => (A.worldTime ? A.worldTime.at(m) : { short: "" });
  const SEND = ["deed", "conseq", "event", "news", "reached"];
  const REACH = { deed: "region", conseq: "region", news: "region", reached: "near" };
  const UI = { box: [], msg: "" };
  const shared = () => { const w = A.worlds && A.worlds.main && A.worlds.main.data; return w && typeof w.shared === "string" && /^[a-z0-9-]{1,48}$/.test(w.shared) ? w.shared : ""; };
  const me = () => (A.config && A.config.title) || "Another group";
  const doc = id => (S() && S().get("word", id)) || null;
  const placeOf = h => { const p = [].concat(h.places || [])[0]; return p && A.rumours ? A.rumours.locOf(p) : null; };

  // what has happened here since word was last sent
  function gather() {
    const last = doc("sent") || {}, all = A.history ? A.history.all() : [];
    return all.filter(h => h && h.m != null && SEND.includes(h.kind) && h.m > (last.m == null ? -1e12 : last.m) && !String(h.id || "").startsWith("w_")).sort((a, b) => a.m - b.m).slice(-40)
      .map(h => ({ id: String(h.id), kind: h.kind, title: String(h.title || "").slice(0, 160), what: String(h.what || "").slice(0, 600), place: placeOf(h), m: h.m, when: at(h.m).short, imp: h.imp || "" }));
  }
  function dispatch() { const items = gather(); return items.length ? { atlasWord: 1, world: shared(), from: me(), t: Date.now(), m: nowM(), when: at(nowM()).short, items } : null; }
  const markSent = d => S().set("word", "sent", { m: d.m, t: d.t, n: ((doc("sent") || {}).n || 0) + d.items.length });
  function sendApp() {
    const d = dispatch(); if (!d) { api.note("Nothing new has happened here since word was last sent."); return; }
    window.ATLAS_APP.word.send(d).then(() => { markSent(d); api.note(`Word sent to the other groups of this world: ${d.items.length} thing${d.items.length > 1 ? "s" : ""}.`); paint(); }).catch(e => api.note("The word could not be sent: " + e.message));
  }
  function sendFile() {
    const d = dispatch(); if (!d) { api.note("Nothing new has happened here since word was last sent."); return; }
    const a = document.createElement("a"), slug = me().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
    a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: "application/json" })); a.download = `word-from-${slug}-${d.when.replace(/[^\w]+/g, "-")}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    markSent(d); api.note("Saved: give the file to the other group's game master to read in.");
  }
  // word come in: kept to be let spread, piece by piece or all at once
  function take(d, src) {
    if (!d || d.atlasWord !== 1 || !Array.isArray(d.items)) { UI.msg = "That is not word from another group."; return false; }
    if (d.world !== shared()) { UI.msg = `That word is from another world${d.world ? " (" + d.world + ")" : ""}: this campaign's world is ${shared() || "not shared"}.`; return false; }
    const got = (doc("got") || {}).ids || [], fresh = d.items.filter(x => x && !got.includes(d.from + "|" + x.id));
    if (!fresh.length) { UI.msg = `Nothing new from ${d.from}.`; return false; }
    UI.box = UI.box.filter(b => !(b.from === d.from && b.t === d.t)).concat({ from: d.from, t: d.t, when: d.when, items: fresh, src });
    UI.msg = ""; return true;
  }
  function spread(bi, ii) {
    const b = UI.box[bi]; if (!b) return; const list = ii == null ? b.items : [b.items[ii]].filter(Boolean), got = (doc("got") || {}).ids || [], ids = got.slice();
    for (const x of list) {
      const key = b.from + "|" + x.id; if (ids.includes(key)) continue; ids.push(key);
      if (x.place && A.rumours) S().set("rumours", "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), { truth: `${x.what || x.title} (as ${b.from} had it, ${x.when})`, said: x.title, from: x.place, reach: REACH[x.kind] || x.imp || "region", m: nowM(), mine: true, word: b.from, t: Date.now() });
      if (A.history) A.history.add({ id: "w_" + key.replace(/[^\w]/g, "_").slice(0, 60), kind: "heard", title: `Word from ${b.from}: ${x.title}`.slice(0, 140), what: [x.what, x.when ? `(${x.when} for them)` : ""].filter(Boolean).join(" "), places: x.place ? [x.place] : [], vis: "gm" });
    }
    S().set("word", "got", { ids: ids.slice(-500), t: Date.now() });
    b.items = b.items.filter(x => !list.includes(x)); if (!b.items.length) UI.box.splice(bi, 1);
    api.note(list.length > 1 ? `${list.length} pieces of word are spreading.` : "It is spreading."); paint();
  }
  // in the Atlas app: word from the other campaigns of this world, looked for when the page opens and now and then
  let polling = false;
  function poll() { if (!shared() || !(window.ATLAS_APP && window.ATLAS_APP.word)) return; window.ATLAS_APP.word.inbox(shared()).then(l => { let any = false; for (const d of l || []) if (take(d, "app")) any = true; if (any) { api.note("Word has come from another group of this world: see The world's history."); paint(); } }).catch(() => {}); }
  function follow() { if (polling || !shared()) return; polling = true; setTimeout(poll, 1500); setInterval(poll, 60000); }

  function cardHTML() {
    const id = shared(); if (!id) return "";
    follow();
    const app = !!(window.ATLAS_APP && window.ATLAS_APP.word), sent = doc("sent"), next = gather();
    return `<section class="t-card wd-card"><h3>Word between groups</h3><p class="t-small">This world is shared with other campaigns (${esc(id)}). What happens here can be told to them, and what happens there heard of here, as rumours that start where it happened.</p>
      <div class="t-row">${app ? `<button type="button" class="t-btn" data-wd="send"${next.length ? "" : " disabled"}>Send word (${next.length})</button>` : ""}<button type="button" class="t-mini" data-wd="file"${next.length ? "" : " disabled"}>Save word as a file</button><label class="t-mini wd-read">Read word from a file<input type="file" accept=".json,application/json" data-wd="read" hidden></label></div>
      <p class="t-small kn">${sent ? `Last sent ${esc(at(sent.m).short)}; ` : ""}${next.length ? `${next.length} thing${next.length > 1 ? "s" : ""} to tell since: ${next.slice(-3).map(x => esc(x.title)).join("; ")}` : "nothing new to tell."}</p>
      ${UI.msg ? `<p class="t-err">${esc(UI.msg)}</p>` : ""}
      ${UI.box.map((b, bi) => `<div class="wd-in"><h4>From ${esc(b.from)} <span class="kn">${esc(b.when || "")}</span></h4><ul class="t-ul">${b.items.map((x, ii) => `<li><b>${esc(x.title)}</b>${x.what ? ` <span class="t-small">${esc(x.what.slice(0, 200))}</span>` : ""}${x.place ? ` <span class="kn">at ${esc((A.rumours && A.rumours.graph() && A.rumours.graph().locs[x.place] || {}).name || x.place)}</span>` : ""} <button type="button" class="t-link" data-wd="one" data-b="${bi}" data-i="${ii}">Let it spread</button></li>`).join("")}</ul><div class="t-row"><button type="button" class="t-mini" data-wd="all" data-b="${bi}">Let all of it spread</button><button type="button" class="t-mini" data-wd="drop" data-b="${bi}">Not now</button></div></div>`).join("")}</section>`;
  }
  function paint() { if (api.tab() === "history") api.render(); }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-wd]"); if (!b || b.tagName === "INPUT") return;
    const k = b.dataset.wd;
    if (k === "send") sendApp(); else if (k === "file") sendFile();
    else if (k === "one") spread(+b.dataset.b, +b.dataset.i); else if (k === "all") spread(+b.dataset.b);
    else if (k === "drop") { UI.box.splice(+b.dataset.b, 1); paint(); }
  });
  document.addEventListener("change", e => {
    const t = e.target; if (!t.dataset || t.dataset.wd !== "read" || !t.files || !t.files[0]) return;
    const r = new FileReader(); r.onload = () => { let d = null; try { d = JSON.parse(r.result); } catch (x) { d = null; } take(d, "file"); t.value = ""; paint(); }; r.readAsText(t.files[0]);
  });
  A.word = { shared, gather, dispatch, take, spread, cardHTML, box: () => UI.box };
})(ATLAS);
