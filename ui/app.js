/* Campaign Atlas, the app's page: choose who does the work, paste a story, watch the campaign being made, open it.
   The usual way is the game master's own subscription: their Claude Code (or Codex) opens in a window of its own and
   does the work there, at no extra cost. Paying per use with an API key is the other way, for anyone without one. */
(function () {
  "use strict";
  const TOKEN = document.querySelector('meta[name="atlas-token"]').content;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => "$" + (n || 0).toFixed(2);
  const store = { get(k) { try { return localStorage.getItem("atlas-app-" + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem("atlas-app-" + k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem("atlas-app-" + k); } catch (e) {} } };

  async function api(path, body) {
    const opt = body === undefined ? { headers: { "x-atlas-token": TOKEN } } : { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify(body) };
    let r;
    try { r = await fetch(path, opt); } catch (e) { stillThere(); throw new Error("The app is not answering."); }
    const d = await r.json().catch(() => ({}));
    if (r.status === 403 && /Reload/.test(d.error || "")) { location.reload(); throw new Error("Reloading…"); }   // the app was started again
    if (!r.ok) throw new Error(d.error || "Something went wrong (" + r.status + ").");
    return d;
  }

  let S = null;
  // who does the work: the game master's own subscription (own-claude, own-codex), or an API key (claude, openai)
  const isOwn = p => String(p).startsWith("own-"), toolOf = p => String(p).slice(4);
  const TOOL = { claude: "Claude Code", codex: "Codex" };
  const PROV = { "own-claude": "Claude, with your subscription", "own-codex": "ChatGPT, with your subscription", claude: "Claude, pay per use", openai: "OpenAI, pay per use" };
  const provOf = j => j.provider === "own" ? "own-" + (j.tool || "claude") : j.provider;
  const STATUS = { working: "working", "working-own": "working", waiting: "not started", stopped: "stopped", capped: "cap reached", failed: "stopped by an error", finished: "finished" };
  // rough costs when paying per use with Claude: the first campaign made will tell better
  const GUESS = { "claude-opus-5-5": { oneshot: "$8–15", campaign: "$25–40", epic: "$60–120", unlimited: "$3–5 a place" }, "claude-sonnet-5-5": { oneshot: "$4–8", campaign: "$12–20", epic: "$30–60", unlimited: "$1.50–2.50 a place" } };
  const DRAFT = ["title", "story", "system", "core", "notes", "places"];
  // the game master's own places, one a line (blank lines and repeats do not count)
  const placeCount = () => new Set(String(form.places.value).split(/\r?\n/).map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").replace(/(?:\s+[-–—]\s+|:\s+).*$/, "").trim().toLowerCase()).filter(Boolean)).size;
  // the two sliders: how much the council may change the story, and how long the story should be
  function paintSliders() {
    const f = S.freedom[form.freedom.value], l = S.lengths[form.storylen.value];
    if (f) $("#sv-freedom").innerHTML = `<b>${esc(f.label)}.</b> ${esc(f.says)}`;
    if (l) $("#sv-storylen").innerHTML = `<b>${esc(l.label)}:</b> about ${l.pages} pages (${l.words.toLocaleString("en")} words)${l.more ? " or more" : ""}. The story you read like a detective novel, to know everything that happens: the longer it is, the more detail.${form.storylen.value >= 4 ? " It takes longer to write." : ""}`;
  }
  function paintPlaces() {
    const on = sizeNow() === "unlimited", n = on ? placeCount() : 0;
    $("#f-places").hidden = !on;
    if (on) $("#nplaces").textContent = (n ? n + " place" + (n > 1 ? "s" : "") + " · " : "") + "one per line; a few words after a dash if you like";
  }
  const copyBtn = text => `<button type="button" class="btn ghost" data-copy="${esc(text)}">Copy</button>`;

  /* ---------------------------------------------------------------- views */
  function route() {
    if (!S) return;
    let h = location.hash.slice(1);
    if (!h) h = S.campaigns.length ? "campaigns" : "new";
    const job = h.startsWith("c/") ? h.slice(2) : null;
    $$(".view").forEach(v => v.hidden = true);
    $$(".tabs a").forEach(a => a.setAttribute("aria-current", a.dataset.tab === (job ? "campaigns" : h) ? "page" : "false"));
    if (job) { $("#v-job").hidden = false; openJob(job); return; }
    closeJob(); launchNote = null;
    const v = $("#v-" + h) || $("#v-new"); v.hidden = false;
    if (h === "campaigns") paintList();
    if (h === "connections") paintConns();
    if (h === "new" || !$("#v-" + h)) paintNew();
  }
  window.addEventListener("hashchange", route);

  function setS(s) {
    S = s;
    $("#ver").textContent = S.version;
    $("#ncamp").textContent = S.campaigns.length ? "(" + S.campaigns.length + ")" : "";
  }
  async function refresh(fresh) { setS(await api("/api/state" + (fresh ? "?fresh=1" : ""))); }

  // copy buttons, anywhere on the page
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-copy]"); if (!b) return;
    navigator.clipboard.writeText(b.dataset.copy).then(() => { b.textContent = "Copied"; setTimeout(() => b.textContent = "Copy", 1500); }).catch(() => {});
  });

  /* ---------------------------------------------------------------- putting Claude Code or Codex on this computer */
  function installHelp(tool) {
    const t = S.tools[tool], ins = t.install || {}, win = S.platform === "win32", mac = S.platform === "darwin";
    const where = ins.shell === "PowerShell" ? "Open <b>PowerShell</b> (press the Windows key, type PowerShell, press Enter)" : mac ? "Open <b>Terminal</b> (in Applications, then Utilities)" : "Open a terminal";
    const what = tool === "claude"
      ? `Claude Code is Anthropic's program that lets your own Claude subscription do work like this. It needs a Claude Pro or Max plan (the free plan does not include it).`
      : `Codex is OpenAI's program that lets your own ChatGPT subscription do work like this. It needs a ChatGPT Plus or Pro plan.`;
    const signin = tool === "claude" ? "type <code>claude</code> and press Enter, sign in with your Claude account when it asks, then close it" : "type <code>codex</code> and press Enter, choose to sign in with ChatGPT, then close it";
    const guide = tool === "claude" ? `<a href="https://code.claude.com/docs/en/setup" target="_blank" rel="noopener">Anthropic's own guide</a>` : `<a href="https://github.com/openai/codex" target="_blank" rel="noopener">OpenAI's own guide</a>`;
    return `<div class="connect install"><h3>First, put ${esc(t.label)} on this computer</h3><p>${what} Once only:</p>
      <ol><li>${where} and paste this line, then press Enter:<div class="code"><code>${esc(ins.line)}</code>${copyBtn(ins.line)}</div></li>
      <li>When it has finished, open a new ${win ? "PowerShell" : "terminal"} window, ${signin}.</li>
      <li><button type="button" class="btn" data-recheck>Check again</button> <span class="rmsg hint" role="status"></span></li></ol>
      <p class="hint">Stuck? Follow ${guide}.</p></div>`;
  }
  function bindRecheck(box, after) {
    for (const b of $$("[data-recheck]", box)) b.onclick = async () => {
      const msg = $(".rmsg", box); b.disabled = true; msg.textContent = "Looking…";
      try { await refresh(true); after(); } catch (e) { msg.textContent = e.message; b.disabled = false; }
    };
  }

  /* ---------------------------------------------------------------- new campaign */
  const form = $("#newform");
  const prov = () => (form.querySelector("input[name=provider]:checked") || {}).value || "own-claude";
  const sizeNow = () => (form.querySelector("input[name=size]:checked") || {}).value || "campaign";
  let capTouched = false;

  function paintNew() {
    for (const k of ["claude", "codex"]) {
      const t = S.tools[k], el = $("#st-own-" + k);
      el.textContent = t.found ? t.label + " is ready" : t.label + " is not installed yet";
      el.className = "cs " + (t.found ? "ok" : "no");
    }
    for (const p of ["claude", "openai"]) {
      const c = S.connectors[p], el = $("#st-" + p);
      el.textContent = c.connected ? "connected" + (c.name && p === "claude" ? " · " + c.name : "") : "not connected";
      el.className = "cs" + (c.connected ? " ok" : "");
    }
    // the last choice made, if there was one
    const last = store.get("provider"), pick = last && form.querySelector(`input[name=provider][value="${last}"]`);
    if (pick && !form.dataset.picked) { pick.checked = true; form.dataset.picked = 1; }
    if (!isOwn(prov())) $("#paid").open = true;
    // the sizes
    const sz = $(".sizes");
    if (!sz.children.length) {
      const p = store.get("size") || "campaign";
      sz.innerHTML = Object.entries(S.sizes).map(([k, s]) => `<label class="card pick"><input type="radio" name="size" value="${k}"${k === p ? " checked" : ""}><span class="ct">${esc(s.label)}</span><span class="cd">${esc(s.says.replace(/^[^:]+: /, ""))}</span><span class="cost" data-cost="${k}"></span></label>`).join("");
      // the sliders start where they were last left, or at the app's defaults
      form.freedom.value = store.get("freedom") || S.defaults2.freedom;
      form.storylen.value = store.get("storylen") || S.defaults2.length;
    }
    paintSliders();
    paintChoices();
    paintConnect();
    // a draft survives a reload
    for (const n of DRAFT) { const v = store.get("draft-" + n); if (v && !form[n].value) form[n].value = v; }
    words();
  }

  function paintChoices() {
    const p = prov(), own = isOwn(p), models = own ? {} : S.models[p] || {}, sel = form.model;
    $("#f-model").hidden = own || Object.keys(models).length < 2;
    if (!own && sel.dataset.for !== p) {
      const want = (S.connectors[p] && S.connectors[p].model) || S.defaults[p];
      sel.innerHTML = Object.entries(models).map(([id, m]) => `<option value="${id}"${id === want ? " selected" : ""}>${esc(m.label)}: ${esc(m.note)}</option>`).join(""); sel.dataset.for = p;
    }
    $("#f-cap").hidden = p !== "claude";
    for (const el of $$("[data-cost]")) el.textContent = own ? "uses your plan" : p === "claude" ? "roughly " + (GUESS[sel.value] || GUESS["claude-opus-5-5"])[el.dataset.cost] : "priced by OpenAI";
    const sz = S.sizes[sizeNow()] || {}, half = sel.value === "claude-sonnet-5-5" ? .5 : 1;
    if (p === "claude" && !capTouched) form.budget.value = Math.max(4, Math.round(sz.cap * half * (sz.perPlace ? Math.max(1, placeCount()) : 1))) || 40;
    paintPlaces();
    let hint;
    if (own) { const t = S.tools[toolOf(p)]; hint = !t.found ? "Put " + t.label + " on this computer first (above)." : t.label + " opens in a window of its own and does the work there, on your plan. A big campaign is a lot of writing: if your plan's limit stops it partway, press Carry on once the limit resets, and nothing is lost."; }
    else hint = !S.connectors[p].connected ? "Connect " + PROV[p] + " first (above)." : "It works on its own for an hour or more; you can close this page and come back.";
    $("#gohint").textContent = hint;
  }

  function paintConnect() {
    const p = prov(), box = $("#connect-here");
    if (isOwn(p)) {
      const t = S.tools[toolOf(p)];
      box.innerHTML = t.found ? "" : installHelp(toolOf(p));
      bindRecheck(box, () => { paintNew(); });
      return;
    }
    if (S.connectors[p].connected) { box.innerHTML = ""; return; }
    box.innerHTML = connectForm(p);
    bindConnect(box, p);
  }

  function connectForm(p, change) {
    const c = S.connectors[p];
    const where = p === "claude" ? `<a href="https://platform.claude.com/" target="_blank" rel="noopener">platform.claude.com</a>, under API keys` : `<a href="https://platform.openai.com/" target="_blank" rel="noopener">platform.openai.com</a>, under API keys`;
    const models = Object.entries(S.models[p] || {});
    return `<div class="connect"><h3>${change ? "Change the key for" : "Connect"} ${esc(PROV[p])}</h3>
      <p>Paste an API key from your account at ${where}. It is kept on this computer only, and the app uses it for nothing but your campaigns.${c.installed ? "" : ` The first time, the app also fetches the connector (${esc(c.size)}, once), which takes a minute or two.`}</p>
      <div class="row"><input type="password" class="ckey" placeholder="${p === "claude" ? "sk-ant-…" : "sk-…"}" aria-label="API key" autocomplete="off" spellcheck="false">
      ${models.length > 1 ? `<select class="cmodel" aria-label="Model">${models.map(([id, m]) => `<option value="${id}"${id === (c.model || S.defaults[p]) ? " selected" : ""}>${esc(m.label)}</option>`).join("")}</select>` : ""}
      <button type="button" class="btn cgo">Connect</button></div>
      <p class="cmsg" role="status" aria-live="polite"></p></div>`;
  }
  function bindConnect(box, p, done) {
    const go = $(".cgo", box), msg = $(".cmsg", box), key = $(".ckey", box);
    key.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go.click(); } });
    go.addEventListener("click", async () => {
      if (!key.value.trim()) { msg.textContent = "Paste the key first."; return; }
      go.disabled = true; msg.className = "cmsg busy";
      msg.textContent = S.connectors[p].installed ? "Checking the key…" : "Fetching the connector and checking the key… (a minute or two, once)";
      try {
        setS(await api("/api/connect", { provider: p, key: key.value.trim(), model: ($(".cmodel", box) || {}).value }));
        key.value = ""; msg.className = "cmsg ok-t"; msg.textContent = "Connected.";
        setTimeout(() => done ? done() : route(), 600);
      } catch (e) { msg.className = "cmsg err"; msg.textContent = e.message; go.disabled = false; }
    });
  }

  function words() {
    const t = form.story.value.trim(), n = t ? t.split(/\s+/).length : 0;
    $("#words").textContent = n ? n.toLocaleString("en") + " words" : "";
  }
  form.addEventListener("change", e => {
    if (e.target.name === "provider") { store.set("provider", e.target.value); paintChoices(); paintConnect(); }
    if (e.target.name === "size") { store.set("size", e.target.value); paintChoices(); }
    if (e.target.name === "model") paintChoices();
    if (e.target.name === "freedom" || e.target.name === "storylen") { store.set(e.target.name, e.target.value); paintSliders(); }
    // choosing from the lists of sets means choosing a set
    if (e.target.name === "bset" || e.target.name === "bregion") form.querySelector("input[name=buildings][value=set]").checked = true;
    if (e.target.name === "drawing") readDrawing(e.target.files[0]);
  });
  // the game master's own map: made no bigger than 2400 pixels along its longer side (a phone photo is turned upright
  // as the browser shows it), and sent with the story
  let DRAWING = null;
  function readDrawing(f) {
    const note = $("#dnote"); DRAWING = null; note.textContent = "";
    if (!f) return;
    if (!/^image\//.test(f.type)) { note.textContent = "That is not a picture: choose a PNG, JPEG, WebP or GIF."; return; }
    form.querySelector("input[name=world][value=drawing]").checked = true;
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
      DRAWING = cv.toDataURL("image/jpeg", .9); URL.revokeObjectURL(url);
      note.textContent = ` Ready: ${w} by ${h} pixels.`;
    };
    img.onerror = () => { note.textContent = "That picture could not be read."; URL.revokeObjectURL(url); };
    img.src = url;
  }
  form.addEventListener("input", e => {
    if (e.target.name === "budget") capTouched = true;
    if (e.target.name === "freedom" || e.target.name === "storylen") paintSliders();
    if (e.target.name === "places") paintPlaces();
    if (e.target.name === "worldplace" && e.target.value.trim()) form.querySelector("input[name=world][value=real]").checked = true;
    if (DRAFT.includes(e.target.name)) { store.set("draft-" + e.target.name, e.target.value); if (e.target.name === "story") words(); }
  });
  $("#storyfile").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 3e6) { $("#newerr").textContent = "That file is too large for a story (over 3 MB)."; return; }
    const r = new FileReader();
    r.onload = () => { form.story.value = String(r.result); store.set("draft-story", form.story.value); if (!form.title.value.trim()) { form.title.value = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "); store.set("draft-title", form.title.value); } words(); };
    r.readAsText(f); e.target.value = "";
  });
  let launchNote = null;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const p = prov(), own = isOwn(p), err = $("#newerr"); err.textContent = "";
    if (own && !S.tools[toolOf(p)].found) { err.textContent = "Put " + S.tools[toolOf(p)].label + " on this computer first: the steps are above."; return; }
    if (!own && !S.connectors[p].connected) { err.textContent = "Connect " + PROV[p] + " first: paste your key above."; $(".ckey") && $(".ckey").focus(); return; }
    const o = { provider: own ? "own" : p, tool: own ? toolOf(p) : undefined, title: form.title.value, story: form.story.value, size: sizeNow(), places: sizeNow() === "unlimited" ? form.places.value : undefined, freedom: +form.freedom.value, length: +form.storylen.value, buildings: (form.querySelector("input[name=buildings]:checked") || {}).value || "auto", bset: form.bset.value, bregion: form.bregion.value, system: form.system.value, core: form.core.value, pcs: form.pcs.value, notes: form.notes.value, model: form.model.value, budget: +form.budget.value };
    o.world = (form.querySelector("input[name=world]:checked") || {}).value || "auto";
    if (o.world === "drawing") { if (!DRAWING) { err.textContent = "Choose the picture of your map (World map, From my own map)."; return; } o.drawing = DRAWING; }
    if (o.world === "real") { o.worldplace = form.worldplace.value.trim(); if (!o.worldplace) { err.textContent = "Say which part of the real world the map should show."; form.worldplace.focus(); return; } }
    const btn = $("#gobtn"); btn.disabled = true;
    try {
      const r = await api("/api/campaigns", o); setS(r.state);
      for (const n of DRAFT) { store.del("draft-" + n); form[n].value = ""; }
      DRAWING = null; form.drawing.value = ""; $("#dnote").textContent = "";
      capTouched = false; words();
      // the game master's own Claude Code or Codex opens at once, with the request typed
      if (own) { try { await api(`/api/campaigns/${r.job.slug}/launch`, { tool: o.tool }); } catch (x) { launchNote = x.message; } }
      location.hash = "c/" + r.job.slug;
    } catch (x) { err.textContent = x.message; }
    btn.disabled = false;
  });

  /* ---------------------------------------------------------------- the library */
  function paintList() {
    const L = $("#list");
    if (!S.campaigns.length) { L.innerHTML = `<p class="empty">No campaigns yet. Start one under <a href="#new">New campaign</a>.</p>`; return; }
    L.innerHTML = S.campaigns.map(j => {
      const c = j.progress && j.progress.counts;
      const made = c && c.places ? `${c.mapped} of ${c.places} places mapped · ${c.rooms} rooms` : "";
      const spent = j.provider === "claude" ? money(j.cost + (j.runCost || 0)) + " spent" : j.provider === "openai" && j.tokens ? (j.tokens / 1e6).toFixed(1) + "M tokens" : "";
      return `<a class="card camp" href="#c/${esc(j.slug)}"><h3>${esc(j.title)}</h3>
        <div><span class="pill ${esc(j.status)}">${esc(STATUS[j.status] || j.status)}</span></div>
        <div class="meta">${esc(PROV[provOf(j)] || "")}${made ? " · " + esc(made) : ""}${spent ? " · " + esc(spent) : ""}</div>
        <div class="meta">${esc(new Date(j.created).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }))}</div></a>`;
    }).join("");
  }

  /* ---------------------------------------------------------------- one campaign */
  let ES = null, J = null, LIVE = null;
  function closeJob() { if (ES) { ES.close(); ES = null; } clearInterval(LIVE); J = null; }
  function openJob(slug) {
    if (J && J.slug === slug && ES) return;
    closeJob();
    J = { slug, job: null, log: [], progress: null, cost: null };
    LIVE = setInterval(paintLive, 1000);
    $("#job").innerHTML = `<p class="busy">Opening…</p>`;
    ES = new EventSource(`/api/campaigns/${encodeURIComponent(slug)}/events?t=${TOKEN}`);
    ES.onmessage = ev => {
      if (!J || J.slug !== slug) return;
      const m = JSON.parse(ev.data);
      if (m.type === "hello") { J.job = m.job; J.log = m.log || []; J.progress = m.progress; paintJob(true); }
      else if (m.type === "job") { J.job = m.job; paintJob(false); }
      else if (m.type === "progress") { J.progress = m.progress; paintJob(false); }
      else if (m.type === "log") { J.log.push(m.entry); addLine(m.entry); }
      else if (m.type === "cost") { J.cost = m.usd; paintMeter(); }
      else if (m.type === "tokens") { J.tokens = m.tokens; paintMeter(); }
    };
    ES.onerror = () => { stillThere(); if (J && !J.job) $("#job").innerHTML = `<p class="err">This campaign could not be opened. <a href="#campaigns">Back to your campaigns</a>.</p>`; };
  }

  function paintJob(all) {
    const j = J.job, P = J.progress, box = $("#job");
    if (!j) return;
    if (all || !$(".jhead", box)) {
      box.innerHTML = `<div class="jhead"></div><div class="jnote"></div><div class="jown"></div><div class="meter"></div>
        <div class="cols"><div><h3 class="h3">The work</h3><ol class="steps"></ol><div class="jplan"></div><div class="jplaces"></div></div>
        <div><h3 class="h3">As it happens</h3><p class="live" role="status"></p><div class="scene" aria-hidden="true"></div><div class="feed" aria-live="off"></div></div></div><div class="jreport"></div>`;
      const feed = $(".feed", box); feed.innerHTML = feedHTML(J.log) || `<p class="empty">Nothing yet.</p>`; feed.scrollTop = feed.scrollHeight;
    }
    const own = j.provider === "own", tool = TOOL[j.tool || "claude"];
    const working = j.status === "working", page = P && P.page;
    const begun = P && P.steps.some(s => s.id !== "story" && (s.done || s.active));
    const model = !own && j.model && S.models[j.provider] && S.models[j.provider][j.model] ? S.models[j.provider][j.model].label : "";
    let main = "";
    if (own) main = j.status === "finished" ? `<button class="btn ghost" data-act="launch">Work on it more in ${esc(tool)}</button>` : `<button class="btn${page ? "" : " big"}" data-act="launch">${begun ? "Carry on" : "Start"} in ${esc(tool)}</button>`;
    else if (working) main = `<button class="btn warn" data-act="stop">Stop</button>`;
    else main = j.status === "finished" ? `<button class="btn ghost" data-act="more">Work on it more</button>` : `<button class="btn" data-act="more">Continue</button>`;
    $(".jhead", box).innerHTML = `<div><div class="kicker">${esc(PROV[provOf(j)])}${model ? " · " + esc(model) : ""}</div><h2>${esc(j.title)}</h2>
      <span class="pill ${esc(j.status)}">${esc(STATUS[j.status] || j.status)}</span></div>
      <div class="acts">
        ${page ? `<a class="btn big" href="/play/${esc(j.slug)}/" target="_blank" rel="noopener">Open the campaign</a>` : ""}
        ${main}
        ${page ? `<a class="btn ghost" href="/play/${esc(j.slug)}/download">Download the page</a>` : ""}
        <button class="btn ghost" data-act="open">Open its folder</button>
      </div>`;
    let notes = "";
    if (launchNote) { notes += `<p class="note bad">${esc(launchNote)}</p>`; }
    if (j.error) notes += `<p class="note bad">${esc(j.error)}</p>`;
    const win = `the window called “Campaign Atlas: ${esc(j.title)}”`;
    // once it has finished, Claude Code sitting idle in its window is not waiting for anything
    if (own && j.waiting && j.status !== "finished") notes += `<p class="note bad"><b>${esc(tool)} is waiting for you</b> in ${win}${j.waiting.msg ? `: ${esc(j.waiting.msg)}` : ""}. Answer it there and the work carries on.</p>`;
    else if (own && j.status === "working-own") notes += `<p class="note">${esc(tool)} is working in ${win}: watch it there, or here. If it stops before the end (at your plan's limit, say), press <b>Carry on in ${esc(tool)}</b> once the limit resets; nothing is lost. If it asks whether to trust the folder, say yes.</p>`;
    else if (own && j.status === "stopped" && j.paused) notes += `<p class="note">${esc(tool)} has stopped for now${j.paused.err ? ` with an error (${esc(j.paused.err)})` : ""}.${j.paused.last ? ` Its last words: <i>“${esc(j.paused.last.slice(-400))}”</i>` : ""} Press <b>Carry on in ${esc(tool)}</b> to finish it, or answer it in its window; it picks up from what is already written.</p>`;
    else if (own && j.status === "stopped") notes += `<p class="note">Nothing in this campaign has changed for a while, so ${esc(tool)} has probably stopped: its window was closed, or your plan's limit was reached. Press <b>Carry on in ${esc(tool)}</b> to finish it; it picks up from what is already written.</p>`;
    else if (!own && j.note) notes += `<p class="note">${esc(j.note)}</p>`;
    if (!own && j.provider === "claude" && ["capped", "failed", "stopped"].includes(j.status)) notes += `<p class="row"><label class="field narrow" style="margin:0"><span>Spending cap</span><span class="money"><span>$</span><input type="number" class="newcap" min="1" step="1" value="${Math.ceil(Math.max(j.budget, j.cost + 10))}"></span></label></p>`;
    $(".jnote", box).innerHTML = notes;
    $(".jown", box).innerHTML = own && j.status !== "finished" ? `<details class="own"><summary>Or start it yourself</summary>${ownHelp(j, begun)}</details>` : "";
    paintMeter();
    // the steps
    const steps = (P && P.steps) || [];
    const moving = working || j.status === "working-own";
    // the little scene under the live line (scene.js): the step being worked on, or how things stand
    if (window.AtlasScene) AtlasScene.show($(".scene", box), sceneOf(j, steps, moving), moving);
    $(".steps", box).innerHTML = steps.map(s => `<li class="stp${s.done ? " done" : ""}${s.current ? " cur" : ""}${s.current && !moving ? " idle" : ""}"><span class="dot" aria-hidden="true"></span>
      <span class="t">${esc(s.label)}${s.who ? `<span class="who">${esc(s.who)}</span>` : ""}</span>${s.detail ? `<span class="d">${esc(s.detail)}</span>` : ""}</li>`).join("") || `<li class="busy">Reading the folder…</li>`;
    // the AI's own plan (only when the app runs it)
    const plan = j.plan || [];
    $(".jplan", box).innerHTML = plan.length ? `<h3 class="h3">Its plan</h3><ul class="plan">${plan.map(t => `<li class="${esc(t.status)}">${esc(t.text)}</li>`).join("")}</ul>` : "";
    // the places
    const pl = (P && P.places) || [];
    $(".jplaces", box).innerHTML = pl.length ? `<h3 class="h3">The places</h3><div class="tablewrap"><table class="places"><thead><tr><th>Place</th><th>Tier</th><th>Rooms</th><th>Written</th><th>Clues</th><th>People</th></tr></thead><tbody>
      ${pl.map(x => x.mapped ? `<tr><td>${esc(x.name)}</td><td class="n">${x.tier || ""}</td><td class="n">${x.rooms}</td><td class="n">${x.done}/${x.rooms}</td><td class="n">${x.clues}</td><td class="n">${x.people}</td></tr>` : `<tr class="no"><td>${esc(x.name)}</td><td class="n">${x.tier || ""}</td><td colspan="4">not mapped yet</td></tr>`).join("")}</tbody></table></div>` : "";
    $(".jreport", box).innerHTML = P && P.report && P.report.trim() ? `<div class="report">${md(P.report)}</div>` : "";
    bindJob(j);
    paintLive();
  }

  // which little scene to show: how things stand, or else what the AI did last (the work does not always go in the
  // order of the steps: a campaign carried on may be writing places while an early step is still open), or else the
  // step the list is at
  const DOING = [[/judgement/i, "judge"], [/council's debate|story bible/i, "council"], [/your story|your choices|Starting the campaign folder/i, "story"],
    [/map of the whole|world map|the city |Finding an address|buildings made for this place/i, "map"], [/the place |Drawing a floor|everything written about a place|Taking stock of the places/i, "places"],
    [/Checking the campaign/i, "check"], [/Building the page|Exporting the maps/i, "build"], [/report for you/i, "report"]];
  function sceneOf(j, steps, moving) {
    if (j.status === "finished") return "finished";
    if (j.provider === "own" && j.waiting) return "waiting";
    if (["stopped", "failed", "capped"].includes(j.status)) return "stopped";
    // the same "last step" as the live line above it, counted from the latest sign of work
    const last = moving && J.log.filter(e => e.kind !== "say").pop();
    if (last && Date.now() - Math.max(j.lastActivity || 0, last.t) < 5 * 60 * 1000) {
      if (last.kind === "check") return "check";
      for (const [re, scene] of DOING) if (re.test(last.text)) return scene;
    }
    const cur = steps.find(s => s.current);
    return cur ? cur.id : "story";
  }

  function paintMeter() {
    const j = J && J.job, el = j && $("#job .meter"); if (!el) return;
    if (j.provider === "claude") {
      const used = J.cost != null && j.status === "working" ? J.cost : j.cost + (j.runCost || 0), cap = j.budget || 0;
      el.innerHTML = `<div class="bar"><i style="width:${cap ? Math.min(100, used / cap * 100) : 0}%"></i></div><div class="lbl"><span>${money(used)} spent${j.status === "working" ? " so far (an estimate until it finishes)" : ""}</span><span>cap ${money(cap)}</span></div>`;
    } else if (j.provider === "openai") el.innerHTML = `<div class="lbl"><span>${(((J.tokens != null ? J.tokens : j.tokens) || 0) / 1e6).toFixed(2)} million tokens used</span><span>billed by OpenAI</span></div>`;
    else el.innerHTML = "";
  }

  function ownHelp(j, begun) {
    const tool = j.tool === "codex" ? "codex" : "claude";
    const ask = begun ? `Carry on with the campaign in campaigns/${j.slug}/ where the work left off. Look at what is already written, then finish the playbook of the campaign-atlas skill: whatever is missing of the council and the places, the check until it says all clear, the build, and REPORT.md. Do not stop to ask me anything.`
      : `Make the campaign in campaigns/${j.slug}/ from its story (story/source.md) and my choices (story/brief.md) with the campaign-atlas skill, following the house rules in this folder, all the way to the built page and REPORT.md. Do not stop to ask me anything.`;
    return `<ol><li>Open a terminal in the app's workspace folder: <button class="btn ghost" data-act="ws">Open the folder</button>
        <div class="code"><code>${esc(S.workspace)}</code>${copyBtn(S.workspace)}</div></li>
      <li>Start ${esc(TOOL[tool])} there: type <code>${tool}</code> and press Enter.</li>
      <li>Paste this, and let it work:<div class="code"><code>${esc(ask)}</code>${copyBtn(ask)}</div></li></ol>
      <p class="hint">This page follows the work as the files appear, and shows the campaign when it is built.</p>`;
  }

  function bindJob(j) {
    const box = $("#job");
    for (const b of $$("[data-act]", box)) b.onclick = async () => {
      const a = b.dataset.act;
      try {
        if (a === "open") await api(`/api/campaigns/${j.slug}/open`, {});
        if (a === "ws") await api(`/api/open-workspace`, {});
        if (a === "stop") { b.disabled = true; await api(`/api/campaigns/${j.slug}/stop`, {}); }
        if (a === "more") { b.disabled = true; const cap = $(".newcap", box); await api(`/api/campaigns/${j.slug}/continue`, { budget: cap ? +cap.value : undefined }); }
        if (a === "launch") { b.disabled = true; launchNote = null; await api(`/api/campaigns/${j.slug}/launch`, { tool: j.tool }); b.disabled = false; }
      } catch (e) { launchNote = e.message; paintJob(false); }
    };
  }

  // one line of the feed; the same step done again straight after (four edits to one place) adds "×4" to its line
  const keyOf = e => e.kind + "|" + e.text;
  function line(e, n) {
    const t = new Date(e.t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const k = esc(keyOf(e)), x = `<span class="x">${n > 1 ? "×" + n : ""}</span>`;
    if (e.kind === "say") return `<div class="e say" data-key="${k}" data-n="${n || 1}">${esc(e.text)}</div>`;
    if (e.kind === "check") return `<div class="e check ${e.ok ? "ok" : "bad"}" data-key="${k}" data-n="${n || 1}"><time>${t}</time>Check: ${esc(e.text)} ${x}</div>`;
    return `<div class="e ${esc(e.kind)}" data-key="${k}" data-n="${n || 1}"><time>${t}</time>${esc(e.text)} ${x}</div>`;
  }
  function feedHTML(log) {
    const out = []; let prev = null, n = 0;
    for (const e of log) { if (prev && keyOf(prev) === keyOf(e) && e.kind !== "say") { n++; prev = e; continue; } if (prev) out.push(line(prev, n)); prev = e; n = 1; }
    if (prev) out.push(line(prev, n));
    return out.join("");
  }
  function addLine(e) {
    const feed = $("#job .feed"); if (!feed) return;
    const near = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
    const empty = $(".empty", feed); if (empty) empty.remove();
    const last = feed.lastElementChild;
    if (last && e.kind !== "say" && last.dataset.key === keyOf(e)) {
      const n = (+last.dataset.n || 1) + 1; last.dataset.n = n; $(".x", last).textContent = "×" + n;
      const tm = $("time", last); if (tm) tm.textContent = new Date(e.t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } else feed.insertAdjacentHTML("beforeend", line(e, 1));
    while (feed.children.length > 600) feed.firstElementChild.remove();
    if (near) feed.scrollTop = feed.scrollHeight;
    if (window.AtlasScene && J && J.job) {
      const moving = J.job.status === "working" || J.job.status === "working-own";
      AtlasScene.show($("#job .scene"), sceneOf(J.job, (J.progress && J.progress.steps) || [], moving), moving);
      AtlasScene.poke($("#job .scene"));
    }
    paintLive();
  }

  // the line above the feed, ticking each second: what was done last and how long ago, so a long quiet stretch (a
  // chapter being written) reads as work going on, not as nothing happening
  function paintLive() {
    const j = J && J.job, el = j && $("#job .live"); if (!el) return;
    const moving = j.status === "working" || j.status === "working-own";
    const last = J.log[J.log.length - 1], t = Math.max(j.lastActivity || 0, last ? last.t : 0);
    if (j.waiting && j.provider === "own" && j.status !== "finished") { el.innerHTML = `<span class="pulse wait"></span><b>Waiting for you</b> in the ${esc(TOOL[j.tool || "claude"])} window.`; return; }
    if (!t) { el.innerHTML = moving ? `<span class="pulse"></span><b>Starting.</b>` : ""; return; }
    const s = Math.max(0, Math.round((Date.now() - t) / 1000));
    const ago = s < 60 ? s + " s" : s < 3600 ? Math.floor(s / 60) + " min " + (s % 60) + " s" : Math.floor(s / 3600) + " h " + Math.floor(s % 3600 / 60) + " min";
    const what = !last ? "a file was written" : last.kind === "check" ? "Check: " + last.text : last.kind === "say" ? "“" + last.text.split("\n")[0].slice(0, 150) + (last.text.length > 150 ? "…" : "") + "”" : last.text;
    el.innerHTML = moving
      ? `<span class="pulse"></span><b>Working.</b> Last step ${ago} ago: ${esc(what)}${s > 150 ? `<span class="hint"> Probably writing something long (a chapter, or a whole floor of a place); it shows here when it is done.</span>` : ""}`
      : `Last step ${ago} ago: ${esc(what)}`;
  }

  /* ---------------------------------------------------------------- connections */
  function paintConns() {
    const box = $("#conns");
    const own = ["claude", "codex"].map(k => {
      const t = S.tools[k];
      return `<div class="card conn" data-tool="${k}"><h3>${k === "claude" ? "Claude" : "ChatGPT"}, with your subscription</h3>
        ${t.found ? `<p class="ok-t">${esc(t.label)} is ready on this computer. It runs on your own subscription; nothing extra to pay.</p>` : installHelp(k)}</div>`;
    }).join("");
    const paid = ["claude", "openai"].map(p => {
      const c = S.connectors[p];
      return `<div class="card conn" data-p="${p}"><h3>${esc(PROV[p])}</h3>
        ${c.connected ? `<p class="ok-t">Connected${c.name ? " · " + esc(c.name) : ""}, with the key ${esc(c.hint)}.</p><div class="row"><button class="btn ghost" data-c="change">Change the key or model</button><button class="btn warn" data-c="off">Disconnect</button></div>` :
          `<p class="hint">Not connected.</p><button class="btn ghost" data-c="change">Connect</button>`}
        <div class="cform"></div></div>`;
    }).join("");
    box.innerHTML = `<h2 class="h3">Your subscription</h2>
      <p class="hint">The app opens your own Claude Code or Codex in a window of its own, with the request already typed, and follows the work here. Anthropic and OpenAI do not let other apps sign in to your subscription, so it is always your own program, signed in by you, that does the work.</p>
      ${own}<details class="paid"${["claude", "openai"].some(p => S.connectors[p].connected) ? " open" : ""}><summary>Pay per use with an API key (optional)</summary>${paid}</details>
      <p class="hint">The app's workspace, where campaigns are made: <code>${esc(S.workspace)}</code> <button class="btn ghost" data-c="ws">Open the folder</button></p>`;
    bindRecheck(box, paintConns);
    for (const b of $$("[data-c]", box)) b.onclick = async () => {
      if (b.dataset.c === "ws") { api("/api/open-workspace", {}).catch(() => {}); return; }
      const card = b.closest(".conn"), p = card.dataset.p;
      if (b.dataset.c === "off") { if (!confirm("Disconnect " + PROV[p] + "? The key is removed from this computer.")) return; setS(await api("/api/disconnect", { provider: p })); paintConns(); return; }
      const f = $(".cform", card); f.innerHTML = connectForm(p, S.connectors[p].connected); bindConnect(f, p, () => paintConns()); $(".ckey", f).focus();
    };
  }

  /* ---------------------------------------------------------------- a little markdown, for the report */
  function md(src) {
    const inline = s => esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>").replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const out = [], lines = String(src).replace(/\r\n/g, "\n").split("\n");
    let list = null, para = [], table = null;
    const flush = () => { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } if (list) { out.push(`</${list}>`); list = null; } if (table) { out.push("<table>" + table.join("") + "</table>"); table = null; } };
    for (const l of lines) {
      let m;
      if (!l.trim()) { flush(); continue; }
      if ((m = l.match(/^(#{1,4})\s+(.*)$/))) { flush(); const n = Math.min(3, m[1].length); out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
      if (/^\s*\|/.test(l)) { if (para.length || list) flush(); if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) continue; table = table || []; table.push("<tr>" + l.trim().replace(/^\||\|$/g, "").split("|").map(c => "<td>" + inline(c.trim()) + "</td>").join("") + "</tr>"); continue; }
      if ((m = l.match(/^\s*([-*]|\d+\.)\s+(.*)$/))) { if (para.length || table) { const L = list; list = null; flush(); list = L; } const kind = /\d/.test(m[1]) ? "ol" : "ul"; if (list !== kind) { if (list) out.push(`</${list}>`); out.push(`<${kind}>`); list = kind; } out.push("<li>" + inline(m[2]) + "</li>"); continue; }
      if (list || table) flush();
      para.push(l.trim());
    }
    flush();
    return out.join("\n");
  }

  /* ---------------------------------------------------------------- the app went away */
  // Started again, the app has a new key and this page must load afresh; stopped, the page says so and waits for it.
  let down = null;
  function stillThere() {
    if (down) return;
    fetch("/api/state", { headers: { "x-atlas-token": TOKEN }, cache: "no-store" }).then(r => { if (r.status === 403) location.reload(); }).catch(() => {
      document.querySelector(".wrap").insertAdjacentHTML("afterbegin", `<p class="note bad" id="down"><b>The app has stopped.</b> Start it again (double-click <code>start-windows.bat</code>, or <code>start-mac.command</code> on a Mac); this page reconnects by itself. Your campaigns and any work in Claude Code are not affected.</p>`);
      down = setInterval(() => fetch("/api/state", { cache: "no-store" }).then(() => location.reload()).catch(() => {}), 4000);
    });
  }

  /* ---------------------------------------------------------------- start */
  refresh().then(route).catch(e => { document.querySelector(".wrap").insertAdjacentHTML("beforeend", `<p class="err">The app is not answering: ${esc(e.message)}. Is its window still open?</p>`); });
  // the library keeps itself current while it is open
  setInterval(() => { if (!J && (location.hash === "#campaigns")) refresh().then(paintList).catch(() => {}); }, 8000);
})();
