/* The map editor's Markers tool (the user's master plan, 26 Oct 2026, part 16: the 2D editor places furniture, doors,
   windows, containers, clues, traps, NPC markers and secret areas). The editor had all of those but the people, the
   dangers and the secrets the guide speaks of: this puts them on the map where they are, in the room under the pointer,
   with their words (who someone is and what they are doing and know; what a danger is; how a secret is found and where
   it leads), chosen, moved and taken away like the clues. They are kept with the map (the edit's npcs, enc and secrets:
   atlas-table.js lays them over the place's own), so the place's page, its guide and the investigation have them. */
(function (A) {
  "use strict";
  if (!A.mapEditor || !A.mapEditor.plug) return;
  const esc = A.esc, T = A.table;
  let ed = null;
  const E = () => ed.E, F = () => ed.cur(), C = A.C;
  // the three kinds: the letter of their markers, the list they live in, and their words
  const KINDS = {
    N: { list: "npcs", name: "A person", glyph: "N", fields: [["n", "Who (a name, and who they are)", 120], ["look", "How they look", 400], ["doing", "What they are doing", 300], ["knows", "What they know (only you)", 600]] },
    E: { list: "enc", name: "A danger or an encounter", glyph: "E", fields: [["t", "What it is", 120], ["d", "What happens (only you)", 800]] },
    S: { list: "secrets", name: "A secret", glyph: "S", fields: [["t", "What it is", 120], ["acc", "How it is found", 400], ["dest", "What it leads to or hides", 400], ["why", "Why it is there (only you)", 400]] }
  };
  const letter = id => String(id || "").charAt(0), isMine = id => !!KINDS[letter(id)] && /^[NES]\d+$/.test(id);
  const more = () => E().draft.more = E().draft.more || {};
  const placed = () => { const M = A.get(E().id, 99) || {}; return M; };
  const recOf = id => { const k = KINDS[letter(id)]; if (!k) return {}; const m = more()[k.list] || {}; return id in m ? m[id] || {} : (placed()[k.list] || {})[id] || {}; };
  const setRec = (id, rec) => { const k = KINDS[letter(id)]; const m = more()[k.list] = Object.assign({}, more()[k.list] || {}); m[id] = rec; E().dirty = true; };
  const roomAt = (x, y) => { const R = F().R || []; for (let i = R.length - 1; i >= 0; i--) { const r = R[i]; if (/^R\d/.test(r[0]) && x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4]) return r[0]; } return ""; };
  const hit = (x, y) => { const M0 = F().M || []; for (let i = M0.length - 1; i >= 0; i--) { const m = M0[i]; if (isMine(m[0]) && Math.hypot(m[1] - x, m[2] - y) < .5) return i; } return -1; };
  function nextId(L) {
    let n = 0; const take = id => { if (letter(id) === L) n = Math.max(n, +String(id).slice(1) || 0); };
    for (const G of E().draft.floors) for (const m of G.M || []) take(m[0]);
    for (const id of Object.keys(placed()[KINDS[L].list] || {})) take(id); for (const id of Object.keys(more()[KINDS[L].list] || {})) take(id);
    return L + (n + 1);
  }
  const st = () => E().mk = E().mk || { kind: "N", sel: null, drag: null };
  function place(x, y) {
    const s = st(), id = nextId(s.kind), at = roomAt(x, y), px = Math.round(x * 4) / 4, py = Math.round(y * 4) / 4;
    ed.change(() => { (F().M = F().M || []).push([id, px, py]); });
    const k = KINDS[s.kind], rec = s.kind === "N" ? { n: "Someone new", look: "", doing: "", knows: "" } : s.kind === "E" ? { t: "A danger", d: "" } : { t: "A secret", acc: "", dest: "", why: "" };
    setRec(id, Object.assign(rec, at ? { at } : {})); s.sel = id; ed.paint();
    setTimeout(() => { const n = document.querySelector(`#meSide [data-mkf="${k.fields[0][0]}"]`); if (n) { n.focus(); n.select(); } }, 30);
  }
  function side() {
    if (E().tool !== "marks") return "";
    const s = st(), sel = s.sel, here = (F().M || []).filter(m => isMine(m[0]));
    let h = `<section class="me-clue"><h4>People, dangers and secrets</h4><div class="me-row" role="radiogroup" aria-label="What to put down">${Object.entries(KINDS).map(([L, k]) => `<button type="button" data-mkk="${L}" aria-pressed="${s.kind === L}">${esc(k.name)}</button>`).join("")}</div>`;
    if (sel && isMine(sel)) {
      const k = KINDS[letter(sel)], r = recOf(sel);
      h += `<div class="me-cl-ed"><p class="me-help">${esc(sel)}${r.at ? ", in " + esc(r.at) : ""}</p>${k.fields.map(([f, l, max]) => `<label class="me-f"><span>${esc(l)}</span>${max > 150 ? `<textarea data-mkf="${f}" rows="2" maxlength="${max}">${esc(r[f] || "")}</textarea>` : `<input data-mkf="${f}" value="${esc(r[f] || "")}" maxlength="${max}">`}</label>`).join("")}
        <div class="me-row"><button type="button" class="me-del" data-mkx="del">Take it away</button></div></div>`;
    } else h += `<p class="me-help">Choose what to put down, then click the map: it goes in the room under the pointer. Click a marker to choose it; drag it to move it. Everything else about them is on the place's page and in the investigation.</p>`;
    if (here.length) h += `<div class="me-cl-list">${here.map(m => { const r = recOf(m[0]); return `<button type="button" data-mksel="${esc(m[0])}" aria-pressed="${m[0] === sel}">${esc(m[0])} ${esc(r.n || r.t || "")}</button>`; }).join("")}</div>`;
    return h + `</section>`;
  }
  A.mapEditor.plug({
    tools: [["marks", "People, dangers, secrets", "Choose a person, a danger or a secret, then click the map to put it there; click a marker to choose it and drag it to move it."]],
    icons: { marks: `<circle cx="9" cy="8" r="3.4"/><path d="M3.5 19c.8-4 3-6 5.5-6s4.7 2 5.5 6"/><path d="M16 5l4 4M20 5l-4 4"/>` },
    open(a) { ed = a; E().mk = { kind: "N", sel: null, drag: null }; },
    // what is written here and not yet saved is drawn as it will be
    draftMap(M) { const m = E().draft.more || {}; for (const k of ["npcs", "enc", "secrets"]) if (m[k]) M[k] = Object.assign({}, M[k] || {}, m[k]); },
    side,
    overlay() { const s = E().mk && E().mk.sel, m = s && (F().M || []).find(x => x[0] === s); return m ? `<circle class="me-sel" cx="${m[1] * C}" cy="${m[2] * C}" r="14"/>` : ""; },
    down(e, p) {
      if (E().tool !== "marks" || (e.button && e.button !== 0)) return false;
      const i = hit(p.x, p.y), s = st();
      if (i >= 0) { const m = F().M[i]; s.sel = m[0]; s.drag = { i, x0: p.x, y0: p.y, mx: m[1], my: m[2] }; ed.paintCanvas(); ed.paintSide(); return true; }
      place(p.x, p.y); return true;
    },
    move(e, p) {
      const d = E().mk && E().mk.drag; if (!d || E().tool !== "marks") return false;
      const g = document.querySelector(`#meCanvas .lm-mk[data-ref="${CSS.escape(F().M[d.i][0])}"]`); if (g) g.setAttribute("transform", `translate(${(p.x - d.x0) * C} ${(p.y - d.y0) * C})`); d.moved = Math.abs(p.x - d.x0) + Math.abs(p.y - d.y0) > .1; return true;
    },
    up(e, p) {
      const d = E().mk && E().mk.drag; if (!d || E().tool !== "marks") return false; E().mk.drag = null;
      if (d.moved) ed.change(() => { const m = F().M[d.i]; m[1] = Math.round((d.mx + p.x - d.x0) * 4) / 4; m[2] = Math.round((d.my + p.y - d.y0) * 4) / 4; const at = roomAt(m[1], m[2]); if (at && at !== recOf(m[0]).at) setRec(m[0], Object.assign({}, recOf(m[0]), { at })); });
      ed.paint(); return true;
    },
    click(e) {
      const t = e.target, k = t.closest("[data-mkk]"); if (k) { st().kind = k.dataset.mkk; st().sel = null; ed.paintSide(); return true; }
      const s = t.closest("[data-mksel]"); if (s) { st().sel = s.dataset.mksel; ed.paintCanvas(); ed.paintSide(); return true; }
      const b = t.closest("[data-mkx]"); if (!b) return false;
      const id = st().sel; if (b.dataset.mkx === "del" && id) { ed.change(() => { E().draft.floors.forEach(G => { G.M = (G.M || []).filter(m => m[0] !== id); }); }); setRec(id, null); st().sel = null; ed.paint(); return true; }
      return false;
    },
    change(e) {
      const t = e.target, f = t.dataset.mkf; if (!f) return false; const id = st().sel; if (!id) return true;
      const r = Object.assign({}, recOf(id), { [f]: t.value.trim() }); if (!t.value.trim()) delete r[f]; setRec(id, r); ed.paintTop(); if (f === "n" || f === "t") ed.paintSide();
      return true;
    },
    key(e) { if (E().tool !== "marks" || !st().sel) return false; if (e.key === "Delete" || e.key === "Backspace") { if (/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || "")) return false; e.preventDefault(); const b = document.querySelector('#meSide [data-mkx="del"]'); if (b) b.click(); return true; } return false; },
    cancel() { if (E().tool === "marks" && st().sel) { st().sel = null; ed.paintCanvas(); ed.paintSide(); return true; } return false; }
  });
  void T;
})(ATLAS);
