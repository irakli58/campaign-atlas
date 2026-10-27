/* Help and tutorials (the user asked, 27 Oct 2026, for an animated, interactive way to learn Atlas, which grows with it).
   The lessons are atlas-tutorial-data.js; this file plays them on the page itself, with its real buttons:
   - "Show me": a pointer moves to each control, a light falls on it, the words appear beside it (and are read aloud if
     asked), and the pointer does what the lesson does;
   - "Let me try": the light falls on the control and the guide waits for the person to do it ("Do it for me" if not).
   Either can be paused, gone back, skipped, replayed or switched to the other; a lesson finished is ticked, and the place
   left off is kept (this browser). The library (Help, in the masthead) lists every chapter and lesson, finds a feature by
   a word, and resumes; a small ? beside a tool opens its lesson. With #tour=a,b&video=1 the page plays those lessons by
   itself, for the tutorial video (dev/tutorial-video.js). It needs nothing of the rest of the page but its buttons, so
   the Atlas app's own pages can use it too. */
(function (A) {
  "use strict";
  const D = A.tutorialData; if (!D || typeof document === "undefined") return;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const KEY = ((A.config && A.config.storageKey) || "atlas") + "-tour";
  const load = () => { try { return Object.assign({ done: {}, last: null, voice: false, seen: false }, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { return { done: {}, last: null, voice: false, seen: false }; } };
  let P = load(); const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const params = new URLSearchParams((location.hash || "").replace(/^#/, "") + "&" + location.search.slice(1));
  const VIDEO = params.get("video") === "1";

  /* ---- the lessons this page can teach (a lesson whose feature the page lacks is left out) */
  const ok = l => { try { return !l.needs || l.needs(); } catch (e) { return false; } };
  const all = () => D.chapters.flatMap(c => c.lessons.map(l => Object.assign({ chapter: c }, l)));
  const avail = () => all().filter(ok);
  const byId = id => all().find(l => l.id === id);

  /* ---- the look: one set of styles for every lesson, in the page's own colours where it has them */
  const css = `
.tu-spot{position:fixed;z-index:2147483000;border-radius:10px;pointer-events:none;box-shadow:0 0 0 3px #e2b54a,0 0 24px 6px rgba(226,181,74,.35),0 0 0 9999px rgba(6,5,4,.66);transition:left .45s cubic-bezier(.3,.7,.2,1),top .45s cubic-bezier(.3,.7,.2,1),width .45s,height .45s,opacity .35s;opacity:0}
.tu-spot.on{opacity:1}
.tu-spot.pulse{animation:tupulse 1.6s ease-in-out infinite}
@keyframes tupulse{50%{box-shadow:0 0 0 6px #e2b54a,0 0 30px 10px rgba(226,181,74,.45),0 0 0 9999px rgba(6,5,4,.66)}}
.tu-cur{position:fixed;z-index:2147483002;width:26px;height:26px;pointer-events:none;transition:left .75s cubic-bezier(.3,.7,.2,1),top .75s cubic-bezier(.3,.7,.2,1),opacity .3s;opacity:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
.tu-cur.on{opacity:1}
.tu-rip{position:fixed;z-index:2147483001;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid #e2b54a;pointer-events:none;animation:turip .6s ease-out forwards}
@keyframes turip{to{transform:scale(3.2);opacity:0}}
.tu-card{position:fixed;z-index:2147483003;max-width:min(380px,calc(100vw - 24px));background:var(--panel,#1b1a17);color:var(--ink,#ece5d6);border:1px solid var(--rule,#3a352d);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.45);padding:14px 16px 12px;font:15px/1.5 var(--f-body,Georgia,serif);transition:left .5s cubic-bezier(.3,.7,.2,1),top .5s cubic-bezier(.3,.7,.2,1),opacity .3s;opacity:0}
.tu-card.on{opacity:1}
.tu-card .tu-k{font:600 10.5px/1 var(--f-mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:#e2b54a;margin-bottom:6px;display:flex;gap:8px}
.tu-card .tu-k span:last-child{margin-left:auto;color:var(--muted,#9a9184)}
.tu-card p{margin:0 0 10px}
.tu-card .tu-try{margin:-4px 0 10px;font-style:italic;color:#e2b54a}
.tu-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.tu-bar button,.tu-lib button{font:600 11px/1 var(--f-mono,monospace);letter-spacing:.06em;text-transform:uppercase;border:1px solid var(--rule,#3a352d);background:transparent;color:inherit;border-radius:999px;padding:6px 10px;cursor:pointer}
.tu-bar button:hover,.tu-lib button:hover{border-color:#e2b54a}
.tu-bar .tu-p,.tu-lib .tu-p{background:#e2b54a;color:#1b1a17;border-color:#e2b54a}
.tu-bar .tu-sp{flex:1}
.tu-prog{height:3px;background:var(--rule,#3a352d);border-radius:2px;margin:0 0 10px;overflow:hidden}.tu-prog i{display:block;height:100%;background:#e2b54a;transition:width .5s}
.tu-lib{width:min(820px,calc(100vw - 24px));max-height:min(88vh,900px);border:1px solid var(--rule,#3a352d);border-radius:14px;padding:0;background:var(--panel,#1b1a17);color:var(--ink,#ece5d6);font:15px/1.5 var(--f-body,Georgia,serif)}
.tu-lib::backdrop{background:rgba(10,8,6,.55)}
.tu-lh{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--rule,#3a352d);position:sticky;top:0;background:inherit;z-index:1}
.tu-lh h2{margin:0;font:400 24px/1.1 var(--f-display,Georgia,serif);flex:1}
.tu-lb{padding:14px 18px 20px;overflow:auto}
.tu-hero{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-bottom:14px}
.tu-hero > div{border:1px solid var(--rule,#3a352d);border-radius:10px;padding:12px}
.tu-hero h3{margin:0 0 4px;font:400 18px/1.2 var(--f-display,Georgia,serif)}
.tu-hero p{margin:0 0 10px;font-size:14px;color:var(--muted,#9a9184)}
.tu-q{width:100%;box-sizing:border-box;font:inherit;padding:8px 12px;border-radius:8px;border:1px solid var(--rule,#3a352d);background:var(--bg,#121110);color:inherit;margin-bottom:12px}
.tu-ch{margin:16px 0 6px;font:600 11px/1 var(--f-mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:#e2b54a;display:flex;gap:10px}
.tu-ch span{color:var(--muted,#9a9184)}
.tu-ls{display:grid;gap:6px}
.tu-l{display:flex;gap:10px;align-items:center;border:1px solid var(--rule,#3a352d);border-radius:8px;padding:8px 10px}
.tu-l.hl{border-color:#e2b54a;box-shadow:0 0 0 2px rgba(226,181,74,.3)}
.tu-l b{font-weight:600}.tu-l small{display:block;color:var(--muted,#9a9184);font-size:13px}
.tu-l .tu-ok{width:20px;text-align:center;color:#6fbf73}
.tu-l > div{flex:1}
.tu-feats{columns:2 220px;font-size:14px;margin-top:6px}.tu-feats a{color:inherit;cursor:pointer;text-decoration:underline dotted;display:inline-block;margin:1px 0}
.tu-helpbtn{font:600 11px/1 var(--f-mono,monospace)!important;letter-spacing:.06em;text-transform:uppercase}
.tu-qb{display:inline-grid;place-items:center;width:20px;height:20px;margin-left:6px;border-radius:50%;border:1px solid currentColor;background:transparent;color:#e2b54a;font:700 11px/1 var(--f-mono,monospace);cursor:pointer;vertical-align:middle;opacity:.75}
.tu-qb:hover{opacity:1}
.tu-toast{position:fixed;left:16px;bottom:16px;z-index:2147482999;max-width:360px;background:var(--panel,#1b1a17);color:var(--ink,#ece5d6);border:1px solid #e2b54a;border-radius:12px;padding:12px 14px;box-shadow:0 12px 36px rgba(0,0,0,.4);font:14.5px/1.45 var(--f-body,Georgia,serif);animation:tuin .5s ease-out}
.tu-toast p{margin:0 0 8px}
@keyframes tuin{from{transform:translateY(16px);opacity:0}}
.tu-video .tu-bar,.tu-video .tu-k span:last-child{display:none}
.tu-card.tu-video{font-size:21px;line-height:1.45;max-width:min(560px,calc(100vw - 24px));padding:18px 22px 16px}.tu-card.tu-video .tu-k{font-size:13px}
@media (prefers-reduced-motion:reduce){.tu-spot,.tu-cur,.tu-card{transition:none}.tu-spot.pulse{animation:none}}`;
  const style = document.createElement("style"); style.textContent = css; (document.head || document.documentElement).appendChild(style);

  /* ---- the light, the pointer and the words */
  const spot = document.createElement("div"); spot.className = "tu-spot";
  const cur = document.createElement("div"); cur.className = "tu-cur"; cur.innerHTML = `<svg viewBox="0 0 26 26" width="26" height="26"><path d="M4 2l16 12-7 1.2 4.4 8-3.2 1.6-4.3-8.1L4 22Z" fill="#fff" stroke="#1b1a17" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const card = document.createElement("div"); card.className = "tu-card" + (VIDEO ? " tu-video" : ""); card.setAttribute("role", "dialog"); card.setAttribute("aria-live", "polite");
  const mount = () => { if (!spot.isConnected) document.body.append(spot, cur, card); };
  const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  async function find(sel, ms) { const list = [].concat(sel); const t0 = Date.now(); while (Date.now() - t0 < (ms || 3500)) { for (const s of list) { let el = null; try { el = [...document.querySelectorAll(s)].find(visible); } catch (e) { el = null; } if (el) return el; } await sleep(120); } return null; }
  function light(el) {
    const r = el.getBoundingClientRect(), pad = 6;
    Object.assign(spot.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" }); spot.classList.add("on");
  }
  function place(el) {
    const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 190, top: innerHeight / 2 - 80, bottom: innerHeight / 2 - 80, width: 0, height: 0 };
    const cw = card.offsetWidth || 360, ch = card.offsetHeight || 160, m = 14;
    let top = r.bottom + m; if (top + ch > innerHeight - 8) top = Math.max(8, r.top - ch - m);
    if (r.height > innerHeight * .6) top = Math.min(innerHeight - ch - 12, Math.max(12, r.top + 12));
    const left = Math.min(innerWidth - cw - 12, Math.max(12, r.left + (r.width || 0) / 2 - cw / 2));
    Object.assign(card.style, { left: left + "px", top: top + "px" }); card.classList.add("on");
  }
  async function pointAt(el) {
    const r = el.getBoundingClientRect(); cur.classList.add("on");
    Object.assign(cur.style, { left: r.left + Math.min(r.width * .5, 60) + "px", top: r.top + Math.min(r.height * .55, 30) + "px" });
    await sleep(800);
  }
  function ripple() { const r = cur.getBoundingClientRect(), d = document.createElement("div"); d.className = "tu-rip"; Object.assign(d.style, { left: r.left + 4 + "px", top: r.top + 3 + "px" }); document.body.appendChild(d); setTimeout(() => d.remove(), 700); }
  function say(t) { if (!P.voice || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.rate = 1; speechSynthesis.speak(u); } catch (e) {} }
  // the light and the words follow their control while a step is shown (a smooth scroll, a panel opening, the page
  // laid out again after a click): looked at again five times a second
  let target = null;
  setInterval(() => { if (!target || !spot.classList.contains("on")) return; if (!target.isConnected) { target = null; return; } const r = target.getBoundingClientRect(), k = r.left + "," + r.top + "," + r.width + "," + r.height; if (k !== target.__k) { target.__k = k; light(target); place(target); if (cur.classList.contains("on")) Object.assign(cur.style, { left: r.left + Math.min(r.width * .5, 60) + "px", top: r.top + Math.min(r.height * .55, 30) + "px" }); } }, 200);
  function hide() { target = null; spot.classList.remove("on", "pulse"); cur.classList.remove("on"); card.classList.remove("on"); try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }

  /* ---- doing a step */
  async function perform(s, el) {
    if (s.act === "click") { ripple(); await sleep(180); if (!s.sim) el.click(); }
    else if (s.act === "type") { el.focus(); const v = String(s.value || ""); if (!v) { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); } else { el.value = ""; for (const ch of v) { el.value += ch; el.dispatchEvent(new Event("input", { bubbles: true })); await sleep(90); } } }
    else if (s.act === "hover") el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  }
  // what the person does in "Let me try": the click, or some typing, on the lit control
  function userDoes(s, el, token) {
    return new Promise(res => {
      const done = () => { off(); res(true); };
      const onClick = e => { if (el.contains(e.target) || e.target === el) setTimeout(done, 60); };
      const onInput = e => { if (e.target === el) { clearTimeout(onInput.t); onInput.t = setTimeout(done, 900); } };
      const off = () => { document.removeEventListener("click", onClick, true); document.removeEventListener("input", onInput, true); clearInterval(watch); };
      document.addEventListener("click", onClick, true); document.addEventListener("input", onInput, true);
      const watch = setInterval(() => { if (token !== R.token) { off(); res(false); } }, 200);
      R.doIt = async () => { off(); await perform(s, el); res(true); };
    });
  }

  /* ---- the runner: a list of lessons, a step at a time */
  const R = { list: [], li: 0, si: 0, mode: "show", token: 0, paused: false, next: null, doIt: null, marks: [] };
  const steps = () => (R.list[R.li] || { steps: [] }).steps;
  function cardHTML(L, s, n, of, el) {
    const total = R.list.reduce((a, l) => a + l.steps.length, 0), before = R.list.slice(0, R.li).reduce((a, l) => a + l.steps.length, 0), pct = Math.round((before + n) / Math.max(1, total) * 100);
    const tryMode = R.mode === "try" && !s.auto && s.act !== "look";
    return `<div class="tu-prog"><i style="width:${pct}%"></i></div><div class="tu-k"><span>${esc(L.chapter.title)} · ${esc(L.title)}</span><span>${n} of ${of}</span></div><p>${esc(s.say)}</p>${tryMode ? `<p class="tu-try">${esc(s.try || "Do it on the page.")}</p>` : ""}${!el ? `<p class="tu-try">This part is not on this page: on to the next.</p>` : ""}
      <div class="tu-bar"><button type="button" data-tu="back" title="Back a step">◀</button>${R.mode === "show" ? `<button type="button" data-tu="pause">${R.paused ? "▶ Play" : "❚❚ Pause"}</button>` : ""}<button type="button" data-tu="replay" title="This step again">↺</button>${tryMode ? `<button type="button" class="tu-p" data-tu="doit">Do it for me</button>` : R.mode === "try" ? `<button type="button" class="tu-p" data-tu="next">Next</button>` : `<button type="button" data-tu="next" title="Skip ahead">▶▶</button>`}<span class="tu-sp"></span><button type="button" data-tu="mode" title="Watch it done, or do it yourself">${R.mode === "show" ? "Let me try" : "Show me"}</button><button type="button" data-tu="voice" aria-pressed="${!!P.voice}" title="Read the words aloud">${P.voice ? "Voice on" : "Voice off"}</button><button type="button" data-tu="exit" title="Leave the tutorial">✕</button></div>`;
  }
  async function play() {
    const token = ++R.token; mount();
    while (R.li < R.list.length) {
      const L = R.list[R.li], S = L.steps;
      while (R.si < S.length) {
        if (token !== R.token) return;
        const s = S[R.si], n = R.si + 1;
        P.last = { lesson: L.id, step: R.si, mode: R.mode, list: R.list.map(l => l.id), li: R.li }; save();
        R.marks.push({ t: performance.now(), lesson: L.id, step: R.si, say: s.say });
        const el = await find(s.sel, s.auto ? 2500 : 3500); if (token !== R.token) return;
        // (a step with nothing to say is done quietly: putting back what the lesson changed)
        if (!s.say) { if (el) await perform(s, el); R.si++; continue; }
        target = el || null;
        if (el) { el.scrollIntoView({ block: "center", inline: "nearest", behavior: VIDEO ? "auto" : "smooth" }); await sleep(VIDEO ? 120 : 380); if (token !== R.token) return; light(el); }
        else spot.classList.remove("on");
        card.innerHTML = cardHTML(L, s, n, S.length, el); place(el); say(s.say);
        if (!el) { R.marks[R.marks.length - 1].missing = true; await sleep(1400); R.si++; continue; }
        const read = Math.max(1800, s.say.split(/\s+/).length * 240);
        if (R.mode === "show" || s.auto) {
          await pointAt(el); if (token !== R.token) return;
          await sleep(Math.max(400, read - 800)); if (token !== R.token) return;
          while (R.paused && token === R.token) await sleep(150); if (token !== R.token) return;
          await perform(s, el);
        } else if (s.act === "look") {
          cur.classList.remove("on"); spot.classList.add("pulse");
          await new Promise(res => { R.next = res; }); spot.classList.remove("pulse"); if (token !== R.token) return;
        } else {
          cur.classList.remove("on"); spot.classList.add("pulse");
          const did = await userDoes(s, el, token); spot.classList.remove("pulse"); if (!did || token !== R.token) return;
        }
        await sleep(s.wait || 450); if (token !== R.token) return;
        R.si++;
      }
      P.done[L.id] = Date.now(); save(); R.li++; R.si = 0;
    }
    finish();
  }
  function finish() {
    const one = R.list.length === 1 ? R.list[0] : null; R.token++;
    card.innerHTML = `<div class="tu-k"><span>${one ? esc(one.title) : "The tour"}</span></div><p>${one ? "That's this lesson." : "That's the tour."} Help and tutorials has every lesson, whenever you want one.</p><div class="tu-bar"><button type="button" class="tu-p" data-tu="lib">Help and tutorials</button><button type="button" data-tu="exit">Close</button></div>`;
    spot.classList.remove("on"); cur.classList.remove("on"); place(null); P.last = null; save();
    window.__tourDone = true;
    if (VIDEO) setTimeout(hide, 2500);
  }
  function start(ids, mode, at) {
    const list = [].concat(ids).map(byId).filter(Boolean).filter(ok); if (!list.length) return;
    closeLib(); R.list = list; R.li = at ? at.li || 0 : 0; R.si = at ? at.step || 0 : 0; R.mode = mode || "show"; R.paused = false; R.marks = []; window.__tourDone = false;
    play();
  }
  function exit() { R.token++; hide(); }
  card.addEventListener("click", e => {
    const b = e.target.closest("[data-tu]"); if (!b) return; const k = b.dataset.tu;
    if (k === "exit") exit();
    else if (k === "lib") { exit(); openLib(); }
    else if (k === "pause") { R.paused = !R.paused; b.textContent = R.paused ? "▶ Play" : "❚❚ Pause"; }
    else if (k === "next") { if (R.next) { const f = R.next; R.next = null; f(); } else { R.si++; if (R.si >= steps().length) { P.done[R.list[R.li].id] = Date.now(); save(); R.li++; R.si = 0; } if (R.li >= R.list.length) finish(); else play(); } }
    else if (k === "back") { if (R.si > 0) R.si--; else if (R.li > 0) { R.li--; R.si = Math.max(0, steps().length - 1); } play(); }
    else if (k === "replay") play();
    else if (k === "mode") { R.mode = R.mode === "show" ? "try" : "show"; R.paused = false; play(); }
    else if (k === "voice") { P.voice = !P.voice; save(); b.textContent = P.voice ? "Voice on" : "Voice off"; if (P.voice) { const s = steps()[R.si]; if (s) say(s.say); } else { try { speechSynthesis.cancel(); } catch (x) {} } }
    else if (k === "doit" && R.doIt) R.doIt();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && card.classList.contains("on") && !document.querySelector("dialog[open]")) exit(); });
  addEventListener("resize", () => { const s = steps()[R.si]; if (!card.classList.contains("on") || !s) return; find(s.sel, 200).then(el => { if (el) { light(el); place(el); } }); });

  /* ---- the library: every chapter and lesson, a search, where one left off */
  let lib = null;
  function libHTML(q) {
    q = String(q || "").toLowerCase().trim();
    const L = avail(), matches = l => !q || (l.title + " " + l.summary + " " + (l.features || []).map(f => (D.FEATURES[f] || [f, ""]).join(" ")).join(" ")).toLowerCase().includes(q);
    const last = P.last && byId(P.last.lesson), doneN = L.filter(l => P.done[l.id]).length, beginner = L.filter(l => (D.welcome || ["tour", "place", "screen", "dock"]).includes(l.id)).map(l => l.id);
    const row = l => `<div class="tu-l" data-tul="${esc(l.id)}"><span class="tu-ok" aria-label="${P.done[l.id] ? "Done" : "Not yet"}">${P.done[l.id] ? "✓" : "○"}</span><div><b>${esc(l.title)}</b><small>${esc(l.summary)}</small></div><button type="button" data-tus="show" data-id="${esc(l.id)}">Show me</button><button type="button" class="tu-p" data-tus="try" data-id="${esc(l.id)}">Let me try</button></div>`;
    const chs = D.chapters.map(c => { const ls = c.lessons.filter(ok).filter(matches); if (!ls.length) return ""; const d = ls.filter(l => P.done[l.id]).length; return `<div class="tu-ch">${esc(c.title)} <span>${d} of ${ls.length} done</span></div><div class="tu-ls">${ls.map(l => row(Object.assign({ chapter: c }, l))).join("")}</div>`; }).join("");
    const feats = Object.entries(D.FEATURES).filter(([k, [n, kw]]) => (!q || (n + " " + kw).toLowerCase().includes(q)) && L.some(l => (l.features || []).includes(k))).sort((a, b) => a[1][0].localeCompare(b[1][0]));
    return `<div class="tu-hero"><div><h3>New to Atlas?</h3><p>The beginner tour: the page, a place and its maps, the players' screen and the quick tools. A few minutes.</p><div class="tu-bar"><button type="button" data-tus="show" data-id="${esc(beginner.join(","))}">Show me</button><button type="button" class="tu-p" data-tus="try" data-id="${esc(beginner.join(","))}">Let me try</button></div></div>
      ${last ? `<div><h3>Carry on</h3><p>${esc(last.title)}, where you left off.</p><div class="tu-bar"><button type="button" class="tu-p" data-tus="resume">Resume</button></div></div>` : `<div><h3>Everything, in order</h3><p>Every lesson of every chapter, one after another.</p><div class="tu-bar"><button type="button" data-tus="show" data-id="${esc(L.map(l => l.id).join(","))}">Show me all</button></div></div>`}
      <div><h3>${doneN} of ${L.length} lessons done</h3><p>Words read aloud as you go, if you like.</p><div class="tu-bar"><button type="button" data-tus="voice" aria-pressed="${!!P.voice}">${P.voice ? "Reading aloud: on" : "Read aloud: off"}</button>${doneN ? `<button type="button" data-tus="reset">Start over</button>` : ""}</div></div></div>
      <input class="tu-q" type="search" placeholder="Find a feature: fog, copilot, caves, handouts, world map…" value="${esc(q)}" aria-label="Find a feature">
      ${chs || `<p>Nothing matches "${esc(q)}".</p>`}
      ${feats.length ? `<div class="tu-ch">Every feature <span>${feats.length}</span></div><div class="tu-feats">${feats.map(([k, [n]]) => `<div><a data-tuf="${esc(k)}">${esc(n)}</a></div>`).join("")}</div>` : ""}`;
  }
  function openLib(q, focus) {
    if (!lib) {
      lib = document.createElement("dialog"); lib.className = "tu-lib"; lib.setAttribute("aria-label", "Help and tutorials");
      lib.innerHTML = `<div class="tu-lh"><h2>Help and tutorials</h2><button type="button" data-tus="close" aria-label="Close">✕</button></div><div class="tu-lb"></div>`;
      document.body.appendChild(lib);
      lib.addEventListener("click", e => {
        if (e.target === lib) { lib.close(); return; }
        const f = e.target.closest("[data-tuf]"); if (f) { const l = avail().find(x => (x.features || []).includes(f.dataset.tuf)); if (l) { paintLib("", l.id); } return; }
        const b = e.target.closest("[data-tus]"); if (!b) return; const k = b.dataset.tus;
        if (k === "close") lib.close();
        else if (k === "show" || k === "try") start(b.dataset.id.split(","), k);
        else if (k === "resume" && P.last) start(P.last.list || [P.last.lesson], P.last.mode || "show", { li: P.last.li || 0, step: P.last.step || 0 });
        else if (k === "voice") { P.voice = !P.voice; save(); paintLib(lib.querySelector(".tu-q").value); }
        else if (k === "reset") { P.done = {}; P.last = null; save(); paintLib(""); }
      });
      lib.addEventListener("input", e => { if (e.target.matches(".tu-q")) { const v = e.target.value, pos = e.target.selectionStart; paintLib(v); const q2 = lib.querySelector(".tu-q"); q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (x) {} } });
    }
    paintLib(q || "", focus);
    if (!lib.open) lib.showModal();
  }
  function paintLib(q, focus) { lib.querySelector(".tu-lb").innerHTML = libHTML(q); if (focus) { const el = lib.querySelector(`[data-tul="${CSS.escape(focus)}"]`); if (el) { el.classList.add("hl"); el.scrollIntoView({ block: "center" }); } } }
  const closeLib = () => { if (lib && lib.open) lib.close(); };

  /* ---- the ways in: Help in the masthead, a ? beside a tool, and a word on the first visit */
  function helpButton() {
    if (document.querySelector(".tu-helpbtn") || VIDEO) return;
    const host = document.querySelector(".mode") || document.querySelector("header nav") || document.querySelector("header");
    if (!host) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "tu-helpbtn"; b.textContent = "Help"; b.title = "Help and tutorials: every lesson, a search, where you left off";
    b.addEventListener("click", () => openLib());
    host.after ? host.after(b) : host.appendChild(b);
    if (host.classList && host.classList.contains("mode")) { b.style.marginLeft = "8px"; b.style.padding = "6px 12px"; b.style.borderRadius = "999px"; b.style.border = "1px solid var(--rule)"; b.style.background = "transparent"; b.style.color = "inherit"; b.style.cursor = "pointer"; }
  }
  function anchors() {
    if (VIDEO) return;
    for (const [sel, feat] of D.ANCHORS || []) for (const el of document.querySelectorAll(sel)) {
      if (el.querySelector(":scope > .tu-qb")) continue;
      const l = avail().find(x => (x.features || []).includes(feat)); if (!l) continue;
      const b = document.createElement("button"); b.type = "button"; b.className = "tu-qb"; b.textContent = "?"; b.title = `How this works: ${(D.FEATURES[feat] || [feat])[0]}`; b.setAttribute("aria-label", b.title);
      b.addEventListener("click", e => { e.stopPropagation(); e.preventDefault(); openLib("", l.id); });
      el.appendChild(b);
    }
  }
  function welcome() {
    if (P.seen || VIDEO || !(document.querySelector(".mode") || D.welcome)) return;
    P.seen = true; save();
    const t = document.createElement("div"); t.className = "tu-toast"; t.setAttribute("role", "note");
    t.innerHTML = `<p><b>New to Atlas?</b> A few minutes' tour: watch it done, or try it yourself.</p><div class="tu-bar"><button type="button" data-tw="show">Show me</button><button type="button" class="tu-p" data-tw="try">Let me try</button><button type="button" data-tw="no">Not now</button></div>`;
    t.addEventListener("click", e => { const b = e.target.closest("[data-tw]"); if (!b) return; t.remove(); if (b.dataset.tw !== "no") start(D.welcome || ["tour", "place", "screen", "dock"], b.dataset.tw); });
    document.body.appendChild(t); setTimeout(() => t.isConnected && t.remove(), 30000);
  }
  let pend = 0; const mo = new MutationObserver(() => { clearTimeout(pend); pend = setTimeout(() => { helpButton(); anchors(); }, 250); });
  function boot() {
    helpButton(); anchors(); mo.observe(document.body, { childList: true, subtree: true });
    if (VIDEO && params.get("tour")) setTimeout(() => start(params.get("tour").split(","), "show"), 1500);
    else setTimeout(welcome, 2500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else setTimeout(boot, 0);

  A.tutorial = { open: openLib, start, exit, lessons: avail, marks: () => R.marks };
})(window.ATLAS || (window.ATLAS = {}));
