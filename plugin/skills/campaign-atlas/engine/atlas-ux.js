/* What every part of Atlas does the same way (the user's UX review of 5 Nov 2026, all 22 of its recommendations
   approved the same day: "okay do all of the things you listed"; the workspace's reviews/2026-11-05-ux-review.md).
   The pieces each editor and each of Claude's tools use, so that they behave alike:
   - the edge round a map while it is edited (item 8): A.ux.editing(el, label)
   - the save mark (item 9): every write through the table's store, and the editors' own, says "Saving…" then "Saved" in
     each .ux-save on the page (A.ux.saveMark(), A.ux.track(promise)); leaving while something is unsaved is warned of
   - the keys (item 6): A.ux.KEYS, the card "?" shows (A.ux.keys(name), A.ux.keysBtn(name)); the same keys everywhere
   - the right-click menu (item 7): A.ux.menu(ev, items); A.ux.longPress(el, fn) gives it on a touch screen
   - undo kept after a reload (item 6): A.ux.keepHist(name) -> { load(H, R), save(H, R) }, the last twenty changes
   - the hand mark (item 10): A.ux.hand(words) for what the game master made or changed, never redrawn
   - earlier versions (item 11): A.ux.versions(store, coll) -> { add, list, get }, the last five of each map
   - what Claude is doing, and the tray of what it made (items 12 and 18): A.ux.aiBegin(meta) / aiEnd(run, ok);
     A.ux.work(meta) for long work of Atlas's own (a planet's surface), with how far it has got
   - the card for what Claude suggests (items 13 and 14): A.ux.card(spec): what it would change, what it was made from,
     what it touches; keep all, keep some, edit first, ask again (all or one part), throw away */
(function (A) {
  "use strict";
  if (!A || A.ux || typeof document === "undefined") return;
  const esc = A.esc || (s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const SK = () => (A.config && A.config.storageKey) || "atlas";
  const ls = {
    get(k) { try { return localStorage.getItem(SK() + "-" + k); } catch (e) { return null; } },
    set(k, v) { try { if (v == null) localStorage.removeItem(SK() + "-" + k); else localStorage.setItem(SK() + "-" + k, v); return true; } catch (e) { return false; } }
  };
  const UX = A.ux = { ls, esc };
  const typing = el => !!(el && el.closest && el.closest("input, textarea, select, [contenteditable='true']"));
  UX.typing = typing;
  // (a key typed in a box is the box's: the editors' keys only when nothing is being written)
  UX.keyFree = e => !typing(e.target) && !e.altKey;

  /* ---- the edge round a map being edited, and what is in hand */
  UX.editing = (el, label, host) => {
    if (!el) return;
    const h = host || el;
    let tag = h.querySelector(":scope > .ux-elabel");
    if (!label) { el.classList.remove("ux-editing"); if (tag) tag.remove(); return; }
    if (getComputedStyle(h).position === "static") h.style.position = "relative";
    el.classList.add("ux-editing");
    if (!tag) { tag = document.createElement("div"); tag.className = "ux-elabel"; tag.setAttribute("aria-live", "polite"); h.appendChild(tag); }
    const t = `Editing: ${label}. Esc to stop`; if (tag.textContent !== t) tag.textContent = t;
  };

  /* ---- the save mark */
  const SV = { n: 0, last: 0, bad: false };
  const saveText = () => SV.n ? "Saving…" : SV.bad ? "Not saved" : SV.last ? "Saved" : "";
  function paintSave() {
    const t = saveText();
    document.querySelectorAll(".ux-save:not([data-own])").forEach(m => { if (m.textContent !== t) m.textContent = t; m.classList.toggle("on", !!SV.n); m.classList.toggle("bad", !SV.n && SV.bad); m.title = SV.bad ? "The last change could not be saved: try it again" : SV.last ? "Saved at " + new Date(SV.last).toLocaleTimeString() : ""; });
  }
  UX.track = p => {
    SV.n++; paintSave();
    Promise.resolve(p).then(ok => { SV.n = Math.max(0, SV.n - 1); if (ok === false) SV.bad = true; else { SV.bad = false; SV.last = Date.now(); } paintSave(); }, () => { SV.n = Math.max(0, SV.n - 1); SV.bad = true; paintSave(); });
    return p;
  };
  UX.saveMark = () => `<span class="ux-save" aria-live="polite">${esc(saveText())}</span>`;
  UX.saveState = () => ({ saving: SV.n, last: SV.last, bad: SV.bad });
  // an editor that keeps changes until Save says what it holds (the room map editor): its own mark, and a warning on leaving
  const DIRTY = new Map();
  UX.dirty = (name, fn) => { if (fn) DIRTY.set(name, fn); else DIRTY.delete(name); };
  window.addEventListener("beforeunload", e => { let any = SV.n > 0; for (const f of DIRTY.values()) { try { if (f()) any = true; } catch (_) {} } if (any) { e.preventDefault(); e.returnValue = ""; } });

  /* ---- a small panel by a button or the pointer (the keys, the menu, the tray), one at a time */
  let POP = null;
  function closePop(keepFocus) {
    if (!POP) return; const p = POP; POP = null; p.el.remove();
    if (!keepFocus && p.prev && p.prev.isConnected && p.prev.focus) { try { p.prev.focus({ preventScroll: true }); } catch (_) {} }
  }
  function pop(html, at, cls) {
    closePop(true);
    const el = document.createElement("div"); el.className = "ux-pop " + (cls || ""); el.innerHTML = html;
    const inside = at && (at.inside || at).closest ? (at.inside || at).closest("dialog[open]") : null;
    (inside || document.body).appendChild(el);
    const r = el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight; let x, y;
    if (at && at.getBoundingClientRect) { const b = at.getBoundingClientRect(); x = b.right - r.width; y = b.bottom + 6; if (y + r.height > vh - 8) y = Math.max(8, b.top - r.height - 6); }
    else { x = (at && at.x) || 16; y = (at && at.y) || 16; if (y + r.height > vh - 8) y = Math.max(8, vh - r.height - 8); }
    el.style.left = Math.round(Math.max(8, Math.min(x, vw - r.width - 8))) + "px"; el.style.top = Math.round(y) + "px";
    POP = { el, prev: document.activeElement };
    return el;
  }
  UX.pop = pop; UX.closePop = closePop;
  document.addEventListener("pointerdown", e => { if (POP && !POP.el.contains(e.target) && !(e.target.closest && e.target.closest("[data-ux-keys], [data-ux-ai='tray']"))) closePop(true); }, true);
  document.addEventListener("keydown", e => { if (POP && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePop(); } }, true);
  window.addEventListener("resize", () => closePop(true));

  /* ---- the keys: the same in every editor */
  const K_EDIT = [["Ctrl+Z", "Undo"], ["Ctrl+Y, or Ctrl+Shift+Z", "Redo"], ["Esc", "Put the tool down; again, let go of what is chosen; again, stop editing"], ["Delete", "Take away what is chosen"]];
  const K_END = [["Right-click, or a long press", "What can be done there"], ["?", "These keys"]];
  UX.KEYS = {
    world: [...K_EDIT, ["E", "Start or stop editing the map"], ["1 to 6", "The tools: + Place, + Route, Shape the land, + River, + Realm, + Name"], ["Enter", "Finish a river or a border"], ["Backspace", "Take back the last point"], ["Space and drag", "Move the map while a tool is in hand"], ["Arrows, + and −", "Move the map, closer and further"], ...K_END],
    city: [...K_EDIT, ["1 to 9", "The tools, in their order on the bar"], ["Enter", "Finish a road, a wall or an area"], ["Backspace", "Take back the last point"], ["Drag", "Turn the view; with the right button, move it"], ...K_END],
    room: [...K_EDIT, ["1 to 9, or V R D S E", "The tools, in their order (V choose, R room, D door, S stairs, E erase)"], ["Space and drag", "Move the map"], ["+ and −", "Closer and further"], ...K_END],
    stars: [...K_EDIT, ["1 to 5", "The tools: + System, + Region, + Lane, + Sector, Paint territory (while editing)"], ["Drag", "Move the chart"], ["+ and −", "Closer and further"], ...K_END],
    clues: [["Ctrl+Z", "Undo"], ["Ctrl+Y, or Ctrl+Shift+Z", "Redo"], ["Delete", "Take away the clue chosen on the map"], ["Esc", "Put the tool down"], ["?", "These keys"]]
  };
  UX.keysBtn = name => `<button type="button" class="ux-keysb" data-ux-keys="${esc(name)}" title="The keys (?)" aria-label="The keys of this editor">?</button>`;
  UX.keys = (name, anchor) => {
    const L = UX.KEYS[name]; if (!L) return;
    pop(`<h4>The keys</h4><table>${L.map(([k, w]) => `<tr><th><kbd>${esc(k)}</kbd></th><td>${esc(w)}</td></tr>`).join("")}</table><p class="kn">The same in every editor of Atlas.</p>`, anchor || { x: innerWidth / 2 - 160, y: 90 }, "ux-keys");
  };
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-ux-keys]"); if (!b) return; e.preventDefault(); if (POP && POP.el.classList.contains("ux-keys")) closePop(); else UX.keys(b.dataset.uxKeys, b); });
  // "?" pressed in an editor: its card (each editor says which it is)
  UX.isHelpKey = e => e.key === "?" && UX.keyFree(e) && !e.ctrlKey && !e.metaKey;
  // the tool for a number key (1 to 9), from an editor's list of tools in their order
  UX.numKey = (e, list) => { if (!UX.keyFree(e) || e.ctrlKey || e.metaKey || !/^[1-9]$/.test(e.key)) return null; const k = list[+e.key - 1]; return k == null ? null : k; };
  UX.isUndo = e => (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "z" && !e.shiftKey;
  UX.isRedo = e => (e.ctrlKey || e.metaKey) && !e.altKey && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey));

  /* ---- the right-click menu, and a long press for it on a touch screen */
  UX.menu = (ev, items, title) => {
    items = (items || []).filter(Boolean); if (!items.some(x => x !== "-")) return false;
    if (ev.preventDefault) ev.preventDefault();
    const el = pop(`${title ? `<div class="ux-mt">${esc(title)}</div>` : ""}<div role="menu" aria-label="${esc(title || "What can be done here")}">${items.map((it, i) => it === "-" ? `<hr>` : `<button type="button" role="menuitem" data-ux-mi="${i}"${it.off ? " disabled" : ""}${it.danger ? ` class="ux-danger"` : ""}>${esc(it.label)}${it.hint ? ` <span class="kn">${esc(it.hint)}</span>` : ""}</button>`).join("")}</div>`, { x: ev.clientX + 2, y: ev.clientY + 2, inside: ev.target }, "ux-menu");
    el.addEventListener("click", e => { const b = e.target.closest("[data-ux-mi]"); if (!b || b.disabled) return; const it = items[+b.dataset.uxMi]; closePop(true); if (it && it.run) setTimeout(() => it.run(), 0); });
    el.addEventListener("keydown", e => {
      const L = [...el.querySelectorAll("button:not([disabled])")], i = L.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (L[(i + 1) % L.length] || L[0]).focus(); } else if (e.key === "ArrowUp") { e.preventDefault(); (L[(i - 1 + L.length) % L.length] || L[0]).focus(); }
    });
    const f = el.querySelector("button:not([disabled])"); if (f) f.focus({ preventScroll: true });
    return true;
  };
  UX.longPress = (el, fn) => {
    if (!el || el.__uxlp) return; el.__uxlp = 1; let t = null, s = null;
    const stop = () => { clearTimeout(t); t = null; };
    el.addEventListener("pointerdown", e => { if (e.pointerType !== "touch") return; s = [e.clientX, e.clientY]; const tg = e.target; stop(); t = setTimeout(() => { t = null; el.__lpAt = Date.now(); fn({ clientX: s[0], clientY: s[1], target: tg, preventDefault() {}, stopPropagation() {}, longPress: true }); }, 560); });
    el.addEventListener("pointermove", e => { if (t && s && Math.hypot(e.clientX - s[0], e.clientY - s[1]) > 10) stop(); });
    el.addEventListener("pointerup", stop); el.addEventListener("pointercancel", stop);
    el.addEventListener("click", e => { if (el.__lpAt && Date.now() - el.__lpAt < 800) { e.stopPropagation(); e.preventDefault(); } }, true);
  };
  // (whether a pointer's release just ended a long press: the map should not take it as a click too)
  UX.justPressed = el => !!(el && el.__lpAt && Date.now() - el.__lpAt < 800);

  /* ---- undo kept after a reload: the last twenty changes each way, in this browser */
  UX.keepHist = name => ({
    load(H, R) { try { const d = JSON.parse(ls.get("hist-" + name) || "null"); if (d && Array.isArray(d.h)) { H.push(...d.h); R.push(...(d.r || [])); return d.h.length + (d.r || []).length; } } catch (e) {} return 0; },
    save(H, R) {
      const fit = a => a.slice(-20).filter(x => { try { return JSON.stringify(x).length < 150000; } catch (e) { return false; } });
      const d = { h: fit(H), r: fit(R), t: Date.now() }; let s = JSON.stringify(d);
      while (s.length > 900000 && (d.h.length || d.r.length)) { if (d.h.length) d.h.shift(); else d.r.shift(); s = JSON.stringify(d); }
      ls.set("hist-" + name, d.h.length || d.r.length ? s : null);
    }
  });

  /* ---- the hand mark: what the game master made or changed, which the generators never redraw */
  const PEN = `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M3 17.3V21h3.7l11-11-3.7-3.7-11 11Zm17.7-10.2a1 1 0 0 0 0-1.4l-2.4-2.4a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7 1.9-1.7Z"/></svg>`;
  UX.hand = (words, title) => `<span class="ux-hand" title="${esc(title || "You made or changed this: nothing Atlas makes again draws over it")}">${PEN}${esc(words || "Made by hand: never redrawn")}</span>`;

  /* ---- earlier versions of a map, kept in the page's database beside it (the last five) */
  UX.versions = (store, coll, keepN) => {
    if (store && !store["__v_" + coll]) { store["__v_" + coll] = 1; try { store.watch(coll, () => {}); } catch (e) {} }
    const api = {
      list(id) { return Object.entries((store && store.get(coll)) || {}).filter(([, v]) => v && v.id === id).map(([vid, v]) => Object.assign({ vid }, v)).sort((a, b) => b.t - a.t); },
      add(id, data, label) {
        if (!store || data == null) return; const t = Date.now();
        const p = store.set(coll, id + "~" + t, { id, t, label: label || "", data }); UX.track(p);
        for (const v of api.list(id).slice(keepN || 5)) store.set(coll, v.vid, null);
        return p;
      },
      get(vid) { return ((store && store.get(coll)) || {})[vid] || null; }
    };
    return api;
  };
  UX.when = t => { const d = new Date(t), now = new Date(), same = d.toDateString() === now.toDateString(); return same ? "today, " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString([], { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };

  /* ---- what Claude is doing now, and what it has made for you to look at */
  const AI = { runs: [], tray: [], seq: 0 };
  const KIND = { reading: "Reading", writing: "Writing", suggesting: "Suggesting a change", making: "Making", answering: "Answering", checking: "Checking" };
  const where = () => ({ view: ((document.getElementById("app") || {}).dataset || {}).view || "", tab: A.tableUI && A.tableUI.api && A.tableUI.api.tab ? A.tableUI.api.tab() : "", nav: A.nav && A.nav.snapshot ? A.nav.snapshot() : null });
  const tabName = k => { try { const b = document.querySelector(`.tv-nav [data-tab="${k}"] .tvn-l`); return b ? b.textContent : ""; } catch (e) { return ""; } };
  function lineEl() {
    let el = document.getElementById("uxAi");
    if (!el) { el = document.createElement("div"); el.id = "uxAi"; el.className = "ux-ai"; el.hidden = true; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
    return el;
  }
  function paintAI() {
    const el = lineEl(), r = AI.runs[0], n = AI.tray.length;
    if (!r && !n) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    let h = "";
    if (r) {
      const left = r.f > .02 && r.f < 1 ? (() => { const s = (Date.now() - r.t0) / 1000 * (1 - r.f) / r.f; return s > 90 ? `about ${Math.round(s / 60)} min left` : s > 5 ? `about ${Math.round(s / 5) * 5} s left` : "almost done"; })() : "";
      h += `<span class="ux-dot" aria-hidden="true"></span><b>${esc(r.who)}</b> <span class="ux-k">${esc(KIND[r.kind] || r.kind || "Working")}</span> <span class="ux-w">${esc(r.what)}</span>${r.uses.length ? ` <span class="ux-u">from ${esc(r.uses.join(", "))}</span>` : ""}${r.f != null ? ` <span class="ux-pg"><i style="width:${Math.round(Math.max(0, Math.min(1, r.f)) * 100)}%"></i></span> <span class="ux-u">${Math.round(r.f * 100)}%${left ? " · " + left : ""}</span>` : ""}${r.stop && r.canStop !== false ? ` <button type="button" class="ux-ab" data-ux-ai="stop" data-r="${r.id}">Stop</button>` : ""}${AI.runs.length > 1 ? ` <span class="ux-u">and ${AI.runs.length - 1} more</span>` : ""}`;
    }
    if (n) h += `${r ? `<span class="ux-sep" aria-hidden="true"></span>` : ""}<button type="button" class="ux-ab ux-tray" data-ux-ai="tray" aria-label="What Claude and Atlas made while you were elsewhere">${n === 1 ? "1 thing" : n + " things"} to look at ▾</button>`;
    el.innerHTML = h;
  }
  setInterval(() => { if (AI.runs.some(r => r.f != null)) paintAI(); }, 1000);
  function trayHTML() {
    return `<h4>Made while you were elsewhere</h4><ul>${AI.tray.map((t, i) => `<li><span><b>${esc(t.what)}</b> <span class="kn">${esc(t.done)} · ${esc(UX.when(t.t))}</span></span><button type="button" class="t-mini" data-ux-ai="go" data-i="${i}">Open</button></li>`).join("")}</ul><div class="t-row"><button type="button" class="t-mini" data-ux-ai="clear">Clear the list</button></div>`;
  }
  function away(o) {
    if (!o) return false; const now = where();
    if (o.dlg) return !o.dlg.isConnected || !o.dlg.open ? null : false;   // a dialog closed: what it made went with it
    if (o.el && (!o.el.isConnected || !o.el.offsetParent)) return true;
    return now.view !== o.view || (o.view === "table" && now.tab !== o.tab) || document.hidden;
  }
  function goTo(t) {
    if (t.go) { try { t.go(); } catch (e) { console.warn(e); } return; }
    const o = t.origin || {};
    if (A.nav && A.nav.restore && o.nav) A.nav.restore(o.nav);
    else if (o.view === "table" && A.tableUI) A.tableUI.api.open(o.tab);
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-ux-ai]"); if (!b) return;
    const k = b.dataset.uxAi;
    if (k === "stop") { const r = AI.runs.find(x => x.id === +b.dataset.r); if (r && r.stop) r.stop(); return; }
    if (k === "tray") { if (POP && POP.el.classList.contains("ux-trayp")) closePop(); else pop(trayHTML(), b, "ux-trayp"); return; }
    if (k === "go") { const t = AI.tray.splice(+b.dataset.i, 1)[0]; closePop(true); paintAI(); if (t) goTo(t); return; }
    if (k === "clear") { AI.tray.length = 0; closePop(true); paintAI(); }
  });
  // (a result seen where it was made is not waiting any more)
  UX.seenHere = () => { const n = AI.tray.length; AI.tray = AI.tray.filter(t => { const a = away(t.origin); return a !== false; }); if (n !== AI.tray.length) paintAI(); };
  UX.aiBegin = (meta, signal) => {
    meta = meta || {};
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    if (signal && ctrl) { if (signal.aborted) ctrl.abort(); else signal.addEventListener("abort", () => ctrl.abort()); }
    const o = Object.assign(where(), { dlg: document.querySelector("dialog[open]") || null, el: meta.el || null });
    const run = { id: ++AI.seq, who: meta.who || "Claude", kind: meta.kind || "writing", what: meta.what || (o.view === "table" && tabName(o.tab) ? "for " + tabName(o.tab) : "for you"), uses: [].concat(meta.uses || []).filter(Boolean).slice(0, 4), t0: Date.now(), origin: o, signal: ctrl ? ctrl.signal : signal, f: meta.progress ? 0 : null, go: meta.go || null, canStop: meta.canStop };
    run.stopped = new Promise((_, rej) => { run.stop = () => { if (ctrl) ctrl.abort(); const e = new Error("Stopped."); e.code = "stopped"; rej(e); end(run, false); }; });
    run.stopped.catch(() => {});
    AI.runs.push(run); paintAI(); return run;
  };
  function end(run, ok, words) {
    if (!AI.runs.includes(run)) return; AI.runs = AI.runs.filter(r => r !== run);
    if (ok && away(run.origin)) AI.tray.push({ what: run.done || run.what.replace(/^./, c => c.toUpperCase()), done: words || "ready to look at", origin: run.origin, go: run.go, t: Date.now() });
    if (AI.tray.length > 12) AI.tray.shift();
    paintAI();
  }
  UX.aiEnd = (run, ok, words) => { if (run) end(run, ok, words); };
  // long work of Atlas's own: how far it has got, and the tray when it is done (a planet's surface: a few minutes)
  UX.work = meta => {
    const run = UX.aiBegin(Object.assign({ who: "Atlas", kind: "making", progress: true, canStop: false }, meta || {}));
    run.stop = null;
    return { progress(f, words) { run.f = Math.max(0, Math.min(1, +f || 0)); if (words) run.what = words; paintAI(); }, end(ok, words, go) { if (go) run.go = go; end(run, ok, words); }, run };
  };
  UX.runs = () => AI.runs.map(r => ({ who: r.who, kind: r.kind, what: r.what, f: r.f }));
  UX.tray = () => AI.tray.map(t => ({ what: t.what, done: t.done }));

  /* ---- the card for what Claude suggests: the same for every change it would make */
  const CARDS = {};
  const sigOf = spec => (spec.parts || []).map(p => p.id).join("|");
  UX.card = spec => {
    const old = CARDS[spec.id], st = old && old.sig === sigOf(spec) ? old.st : { tick: {}, edit: false, text: {}, again: {}, busy: {}, wish: {} };
    for (const p of spec.parts || []) if (!(p.id in st.tick)) st.tick[p.id] = spec.strict ? false : p.on !== false;
    CARDS[spec.id] = { spec, st, sig: sigOf(spec) };
    return cardHTML(spec.id);
  };
  UX.cardDrop = id => { delete CARDS[id]; };
  const list = a => [].concat(a || []).filter(Boolean);
  // the head of every card: who suggests, what, from what, what it would change and what stays (also for the tools whose
  // own review is richer than a list of parts: Auto-Connect, the next clues, the council)
  UX.cardTop = spec => { const row = (k, v) => list(v).length ? `<div><dt>${k}</dt><dd>${list(v).map(esc).join(" · ")}</dd></div>` : ""; return `<div class="ux-ch"><span class="ux-ck">${esc(spec.who || "Claude suggests")}</span><h4>${esc(spec.title || "")}</h4></div>${spec.intro ? `<p class="t-small">${esc(spec.intro)}</p>` : ""}<dl class="ux-cm">${row("Made from", spec.made)}${row("It would change", spec.touches)}${row("Stays as it is", spec.keeps)}</dl>`; };
  function cardHTML(id) {
    const C = CARDS[id]; if (!C) return ""; const { spec, st } = C, parts = spec.parts || [], ticks = spec.strict || parts.length > 1, n = parts.filter(p => st.tick[p.id]).length, all = n === parts.length;
    const anyText = parts.some(p => p.text != null), busyAll = st.busy.__all;
    const row = (k, v) => list(v).length ? `<div><dt>${k}</dt><dd>${list(v).map(esc).join(" · ")}</dd></div>` : "";
    return `<section class="ux-card${busyAll ? " busy" : ""}" data-uxcard="${esc(id)}" aria-label="${esc(spec.title || "What Claude suggests")}">
      <div class="ux-ch"><span class="ux-ck">${esc(spec.who || "Claude suggests")}</span><h4>${esc(spec.title || "")}</h4></div>
      ${spec.intro ? `<p class="t-small">${esc(spec.intro)}</p>` : ""}
      <dl class="ux-cm">${row("Made from", spec.made)}${row("It would change", spec.touches)}${row("Stays as it is", spec.keeps)}</dl>
      ${parts.length ? `<ol class="ux-parts">${parts.map(p => { const on = !!st.tick[p.id], b = !!st.busy[p.id];
        return `<li class="ux-part${on ? " on" : ""}${b ? " busy" : ""}">${ticks ? `<label class="ux-tk"><input type="checkbox" data-uxc="tick" data-c="${esc(id)}" data-p="${esc(p.id)}"${on ? " checked" : ""}${b || busyAll ? " disabled" : ""} aria-label="Keep ${esc(p.label || "this")}"></label>` : ""}
          <div class="ux-pb">${p.label ? `<b class="ux-pl">${esc(p.label)}</b>` : ""}${st.edit && p.text != null ? `<textarea class="t-in" data-uxc="text" data-c="${esc(id)}" data-p="${esc(p.id)}" rows="${Math.min(10, Math.max(2, Math.ceil(String(st.text[p.id] != null ? st.text[p.id] : p.text).length / 70)))}">${esc(st.text[p.id] != null ? st.text[p.id] : p.text)}</textarea>` : (p.html || (p.text != null ? `<p>${esc(st.text[p.id] != null ? st.text[p.id] : p.text)}</p>` : ""))}
            ${st.again[p.id] && !b ? `<form class="ux-again" data-uxc="askf" data-c="${esc(id)}" data-p="${esc(p.id)}"><input class="t-in" name="wish" maxlength="300" placeholder="What should be different? (you may leave it empty)" aria-label="What should be different"><button class="t-mini">Ask</button><button type="button" class="t-mini" data-uxc="noask" data-c="${esc(id)}" data-p="${esc(p.id)}">Cancel</button></form>` : ""}
            ${b ? `<p class="kn">Asking again…</p>` : ""}</div>
          ${spec.onAgain && !b && !st.again[p.id] && !busyAll ? `<button type="button" class="t-mini ux-pa" data-uxc="again" data-c="${esc(id)}" data-p="${esc(p.id)}" title="Ask Claude again for this part only; the rest stays">Ask again</button>` : ""}</li>`; }).join("")}</ol>` : ""}
      ${busyAll ? `<p class="kn">Asking again…</p>` : ""}
      ${st.err ? `<p class="t-small ux-err">${esc(st.err)}</p>` : ""}
      <div class="t-row ux-cact">
        <button type="button" class="t-btn prim" data-uxc="keep" data-c="${esc(id)}"${(ticks && !n) || busyAll ? " disabled" : ""}>${esc(!ticks ? spec.keepLabel || "Keep it" : all && !spec.strict ? spec.keepAllLabel || "Keep all" : `Keep the ticked (${n} of ${parts.length})`)}</button>
        ${anyText && !spec.noEdit ? `<button type="button" class="t-btn" data-uxc="edit" data-c="${esc(id)}"${busyAll ? " disabled" : ""}>${st.edit ? "Done editing" : "Edit before keeping"}</button>` : ""}
        ${spec.onAgainAll ? `<button type="button" class="t-btn" data-uxc="againall" data-c="${esc(id)}"${busyAll ? " disabled" : ""}>Ask again</button>` : ""}
        <button type="button" class="t-btn" data-uxc="drop" data-c="${esc(id)}"${busyAll ? " disabled" : ""}>${esc(spec.dropLabel || "Throw it away")}</button>
      </div>${spec.foot ? `<p class="t-small kn">${esc(spec.foot)}</p>` : ""}</section>`;
  }
  function repaint(id) {
    const a = document.activeElement, fk = a && a.dataset && a.dataset.uxc ? [a.dataset.uxc, a.dataset.p || ""] : null;
    document.querySelectorAll(`[data-uxcard="${CSS.escape(id)}"]`).forEach(el => { el.outerHTML = cardHTML(id); });
    if (fk) { const b = document.querySelector(`[data-uxcard="${CSS.escape(id)}"] [data-uxc="${fk[0]}"]${fk[1] ? `[data-p="${CSS.escape(fk[1])}"]` : ""}`); if (b) b.focus({ preventScroll: true }); }
    const f = document.querySelector(`[data-uxcard="${CSS.escape(id)}"] .ux-again input`); if (f && !fk) f.focus({ preventScroll: true });
  }
  UX.repaintCard = repaint;
  async function again(id, pid, wish) {
    const C = CARDS[id]; if (!C) return; const { spec, st } = C;
    st.again[pid] = false; st.busy[pid] = true; st.err = ""; repaint(id);
    try {
      const np = await spec.onAgain(pid, wish || "");
      if (np) { const i = spec.parts.findIndex(p => p.id === pid); if (i >= 0) { spec.parts[i] = Object.assign({}, np, { id: pid }); delete st.text[pid]; st.tick[pid] = spec.strict ? false : true; } }
      else st.err = "Claude gave nothing new for that part: it is as it was.";
    } catch (e) { st.err = (e && e.code === "stopped") ? "Stopped: that part is as it was." : "That part could not be asked again: " + ((e && e.message) || e); }
    st.busy[pid] = false; if (CARDS[id]) repaint(id);
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-uxc]"); if (!b || b.tagName === "INPUT" || b.tagName === "TEXTAREA" || b.tagName === "FORM") return;
    const id = b.dataset.c, C = CARDS[id]; if (!C) return; const { spec, st } = C, k = b.dataset.uxc, pid = b.dataset.p;
    if (k === "edit") { st.edit = !st.edit; repaint(id); }
    else if (k === "again") { st.again[pid] = true; repaint(id); }
    else if (k === "noask") { st.again[pid] = false; repaint(id); }
    else if (k === "drop") { delete CARDS[id]; if (spec.onDrop) spec.onDrop(); else document.querySelectorAll(`[data-uxcard="${CSS.escape(id)}"]`).forEach(el => el.remove()); }
    else if (k === "againall") { st.busy.__all = true; st.err = ""; repaint(id); Promise.resolve().then(() => spec.onAgainAll()).catch(err => { st.err = "Could not ask again: " + ((err && err.message) || err); }).then(() => { st.busy.__all = false; if (CARDS[id]) repaint(id); }); }
    else if (k === "keep") {
      const ticks = spec.strict || (spec.parts || []).length > 1;
      const sel = (spec.parts || []).filter(p => !ticks || st.tick[p.id]).map(p => Object.assign({}, p, st.text[p.id] != null ? { text: st.text[p.id] } : {}));
      delete CARDS[id]; spec.onKeep(sel, spec.parts || []);
    }
  });
  document.addEventListener("change", e => { const t = e.target; if (!t.dataset || t.dataset.uxc !== "tick") return; const C = CARDS[t.dataset.c]; if (!C) return; C.st.tick[t.dataset.p] = t.checked; repaint(t.dataset.c); });
  document.addEventListener("input", e => { const t = e.target; if (!t.dataset || t.dataset.uxc !== "text") return; const C = CARDS[t.dataset.c]; if (C) C.st.text[t.dataset.p] = t.value; });
  document.addEventListener("submit", e => { const f = e.target; if (!f.dataset || f.dataset.uxc !== "askf") return; e.preventDefault(); again(f.dataset.c, f.dataset.p, f.elements.wish.value.trim()); });
})(typeof ATLAS !== "undefined" ? ATLAS : null);
