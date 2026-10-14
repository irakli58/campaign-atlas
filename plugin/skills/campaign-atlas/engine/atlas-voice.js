/* ================================================================
   CAMPAIGN ATLAS: THE NARRATOR
   One narrator reads the page aloud: a place's first impressions and each room's description, with its smell, sound
   and light. The user asked for it (14 Oct 2026): "i want one narrator". It uses the voices the computer already has
   (the browser's speech synthesis): free, offline, no account. The referee chooses the voice once and makes it deeper
   or higher, slower or faster; the choice is kept in this browser, because each computer has its own voices. While
   the narrator speaks, the music steps back. A described or cloned voice needs a paid service and belongs to the
   downloadable app (see the skill's references/standards.md).

   Any element with data-narrate="text" is a read-aloud button; ATLAS.narrateBtn(text, what) makes one.
   ================================================================ */
(function (A) {
  "use strict";
  const esc = s => (A.esc ? A.esc(s) : String(s));
  // the button, for the engine's room guide and the page's first impressions
  A.narrateBtn = (text, what) => (text ? `<button type="button" class="nar-btn" data-narrate="${esc(text)}" aria-pressed="false" aria-label="Read aloud${what ? ": " + esc(what) : ""}"><span class="nar-go">▶ Read aloud</span><span class="nar-stop">■ Stop</span></button>` : "");
  A.narrateSet = () => `<button type="button" class="nar-set" data-narrator="1">Narrator</button>`;
  if (typeof window === "undefined") return;
  const SS = window.speechSynthesis;
  if (!SS || typeof SpeechSynthesisUtterance === "undefined") { document.documentElement.classList.add("no-voice"); return; }

  const KEY = () => (A.config.storageKey || "atlas") + "-narrator";
  // The defaults follow the narrator the user sent (dev/reference/natarotsound1.mp4, measured 14 Oct 2026): a man's
  // voice, middle-low (113 Hz, ranging 83 to 162), slow and deliberate (3.5 syllables a second while speaking), and
  // pausing a third of the time, in short phrases (pauses of about 0.4 s, the longer ones 0.7 s). The computer's own
  // male voice measured 92 Hz and 3.7 syllables a second, pausing a tenth of the time: so no lowering of the pitch, a
  // touch slower, and a pause after each phrase. His wide rise and fall a computer voice cannot give. The user then
  // listened to the voices and chose "Google UK English Male", "deeper so it's more menacing", and after trying the
  // depths: "Google UK English Male very deep is best", and then, hearing it on the page in Chrome, set it to Deep with
  // shorter pauses and said "make this the default now" (14 Oct 2026): pitch 0.55, speed 0.88, pauses 0.35, ambient
  // sound 0.5. That voice is Chrome's; elsewhere the nearest is a British man, then any natural man, at the same depth.
  const PREFER = "Google UK English Male";
  const DEF = { voice: "", pitch: .55, rate: .88, volume: 1, duck: true, pause: .35, phrases: true, bed: .5 };
  // one-click depths (the user asked for "more options to change the pitch"): [name, pitch, speed]. Some online voices
  // (Edge's natural ones, Google's) may not honour the pitch; the old Windows voices always do.
  const PRESETS = [["Deepest", .15, .8], ["Very deep", .35, .85], ["Deep", .55, .88], ["Menacing", .65, .78], ["Slightly deeper", .85, .92], ["As it is", 1, 1]];
  const N = { set: Object.assign({}, DEF), btn: null };
  try { Object.assign(N.set, JSON.parse(localStorage.getItem(KEY()) || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY(), JSON.stringify(N.set)); } catch (e) {} };
  const voices = () => SS.getVoices() || [];
  // the chosen voice; else a man's voice, the most natural one in the page's language (Edge's "Natural" voices, then
  // Google's), since the narrator the user wants is a man
  const MALE = /\b(guy|christopher|eric|davis|roger|steffan|andrew|brian|ryan|thomas|william|liam|connor|tony|jason|david|mark|james|george|richard|daniel|alex|fred|male)\b/i;
  function voice() {
    const vs = voices(), v = vs.find(x => x.voiceURI === N.set.voice) || vs.find(x => x.name === PREFER); if (v) return v;
    const lang = (document.documentElement.lang || navigator.language || "en").slice(0, 2).toLowerCase();
    const rank = x => (MALE.test(x.name) ? 0 : 6) + (/en-GB/i.test(x.lang) ? 0 : 3) + (/natural|neural|online/i.test(x.name) ? 0 : /google/i.test(x.name) ? 1 : 2);
    return vs.filter(x => (x.lang || "").toLowerCase().startsWith(lang)).sort((a, b) => rank(a) - rank(b))[0] || vs[0] || null;
  }
  // The text is read a phrase at a time, with a pause after each, as the user's narrator reads: a short one after a
  // comma, a longer one after a sentence (also, some browsers fall silent partway through a long piece). With
  // phrases off, a sentence at a time.
  function chunks(text) {
    const re = N.set.phrases !== false ? /[^.!?;:,—–]+[.!?;:,—–]+["'”’)\]]*\s*|[^.!?;:,—–]+$/g : /[^.!?;:]+[.!?;:]+["'”’)\]]*\s*|[^.!?;:]+$/g;
    const parts = String(text).match(re) || [String(text)], out = []; let cur = "";
    for (const p of parts) { if (cur && (cur + p).length > 220) { out.push(cur.trim()); cur = ""; } cur += p; if (N.set.phrases !== false && cur.trim().length > 12) { out.push(cur.trim()); cur = ""; } }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  // how long to wait after a piece, by how it ends
  const gap = t => 1000 * (N.set.pause == null ? 1 : N.set.pause) * (/[.!?…]["'”’)\]]*$/.test(t) ? .7 : /[,;:—–]["'”’)\]]*$/.test(t) ? .35 : .1);
  // while he speaks: the music steps back, or, with no music playing, a bed of the place's own sound plays under him
  const duck = on => { if (!A.music) return; if (A.music.duck) A.music.duck(on && N.set.duck !== false); if (A.music.bed) A.music.bed(on, N.set.bed == null ? .5 : N.set.bed); };
  const unpress = b => { if (b && b.setAttribute) b.setAttribute("aria-pressed", "false"); };
  function finish(btn) { if (N.btn !== btn) return; unpress(btn); N.btn = null; duck(false); }
  function stop() { const b = N.btn; N.btn = null; unpress(b); SS.cancel(); duck(false); }
  function speak(text, btn) {
    stop(); if (!text) return;
    const parts = chunks(text), me = btn || {}; let i = 0, v = null;
    N.btn = me; if (btn) btn.setAttribute("aria-pressed", "true"); duck(true);
    // The browser may still be loading its voices (Chrome brings Google's a moment after the page opens). Wait for them
    // rather than fall back to the computer's default voice, which on Windows is the robotic David: the user heard
    // David when they had chosen Google UK English Male (14 Oct 2026).
    const go = () => { if (N.btn !== me) return; v = voice(); N.used = v ? v.name : ""; if (btn && v) btn.title = "Reading with " + v.name; next(); };
    const ready = () => voices().length && (N.set.voice || voices().some(x => x.name === PREFER) || performance.now() > 5000);
    if (ready()) setTimeout(go, 0);
    else { let done = false; const once = () => { if (done || !ready() && !once.late) return; done = true; go(); }; SS.addEventListener("voiceschanged", once); setTimeout(() => { once.late = true; once(); }, 1500); }
    const next = () => {
      if (N.btn !== me) return;
      if (i >= parts.length) return finish(me);
      const piece = parts[i++], u = new SpeechSynthesisUtterance(piece);
      if (v) { u.voice = v; u.lang = v.lang; }
      u.pitch = N.set.pitch; u.rate = N.set.rate; u.volume = N.set.volume;
      u.onend = () => (i < parts.length ? setTimeout(next, gap(piece)) : next()); u.onerror = () => finish(me);
      SS.speak(u);
    };
  }
  // the old Windows voices: robotic. Where they are all there is, the settings say how to get better ones
  const OLD = v => /^Microsoft (David|Mark|Zira|Hazel|George|Susan|Catherine|James|Richard|Sean|Heera|Ravi)\b/.test(v.name) && !/online|natural/i.test(v.name);

  /* ---- the narrator's settings: a dialog, opened from "Narrator" beside a read-aloud button */
  const SAMPLE = "The door gives with a groan. Inside, the dark breathes out cold air, and somewhere below, water drips onto stone.";
  function openSettings() {
    let d = document.getElementById("narDlg");
    if (!d) {
      d = document.createElement("dialog"); d.id = "narDlg"; d.className = "kedlg"; d.setAttribute("aria-label", "The narrator");
      (document.getElementById("app") || document.body).appendChild(d);
      d.addEventListener("input", onSet); d.addEventListener("change", onSet);
      d.addEventListener("click", e => {
        const t = e.target.closest && e.target.closest("[data-nartest],[data-narclose],[data-narreset],[data-narpre]"); if (!t) return;
        if (t.dataset.narclose) { stop(); d.close ? d.close() : d.removeAttribute("open"); }
        else if (t.dataset.narpre) { const [p, r] = t.dataset.narpre.split(",").map(Number); N.set.pitch = p; N.set.rate = r; save(); stop(); openSettings(); }
        else if (t.dataset.narreset) { stop(); N.set = Object.assign({}, DEF); save(); openSettings(); }
        else if (N.btn) stop(); else speak(sampleText(), t);
      });
      d.addEventListener("close", () => { if (N.btn && d.contains(N.btn)) stop(); });
    }
    const vs = voices(), cur = voice(), lang = (document.documentElement.lang || navigator.language || "en").slice(0, 2).toLowerCase();
    const mine = vs.filter(x => (x.lang || "").toLowerCase().startsWith(lang)), other = vs.filter(x => !mine.includes(x));
    const opt = x => `<option value="${esc(x.voiceURI)}"${cur && x.voiceURI === cur.voiceURI ? " selected" : ""}>${esc(x.name)} (${esc(x.lang)})</option>`;
    const range = (k, label, min, max, step, left, right) => `<label><span>${label}</span><input type="range" data-nar="${k}" min="${min}" max="${max}" step="${step}" value="${N.set[k]}"><span class="nar-ends"><i>${left}</i><i>${right}</i></span></label>`;
    d.innerHTML = `<form method="dialog" class="ke nar-form">
      <h3>The narrator</h3>
      <p class="sd-note">One voice reads the page aloud: each place's first impressions, and each room as you open it. The voices are the ones this browser has, so each computer keeps its own choice.</p>
      <p class="nar-now">Reading with <b>${cur ? esc(cur.name) : "the computer's default voice"}</b>${cur && cur.name === PREFER ? " (the narrator you chose)" : ""}.</p>
      ${!vs.some(x => x.name === PREFER) ? `<p class="sd-note nar-warn">The narrator you chose, ${PREFER}, is only in Google Chrome: open this page in Chrome to hear him.${vs.length && vs.every(OLD) ? " This browser has only the old Windows voices, which sound robotic." : ""}</p>` : ""}
      ${vs.length ? `<label><span>Voice</span><select data-nar="voice">${mine.length ? `<optgroup label="In this page's language">${mine.map(opt).join("")}</optgroup>` : ""}${other.length ? `<optgroup label="Other languages">${other.map(opt).join("")}</optgroup>` : ""}</select></label>` : `<p class="sd-note">This browser has not offered any voices yet. Wait a moment and open this again, or try Microsoft Edge or Chrome.</p>`}
      ${range("pitch", "Deeper or higher (1 is the voice as it is)", 0, 2, .01, "deepest", "higher")}
      <div class="nar-pre">${PRESETS.map(([n, p, r]) => `<button type="button" class="nar-set" data-narpre="${p},${r}"${Math.abs(N.set.pitch - p) < .005 && Math.abs(N.set.rate - r) < .005 ? ' aria-pressed="true"' : ""}>${n}</button>`).join("")}</div>
      ${range("rate", "Slower or faster", .6, 1.4, .02, "slower", "faster")}
      ${range("pause", "Pauses", 0, 2, .05, "none", "long")}
      ${range("volume", "Volume", .2, 1, .05, "quieter", "louder")}
      ${range("bed", "Ambient sound under him when no music plays: the place's own air, a low drone", 0, 1, .05, "none", "loud")}
      <label class="mp-follow"><input type="checkbox" data-nar="phrases"${N.set.phrases !== false ? " checked" : ""}><span>Pause at every comma, a phrase at a time, as a storyteller reads (untick if it sounds choppy)</span></label>
      <label class="mp-follow"><input type="checkbox" data-nar="duck"${N.set.duck !== false ? " checked" : ""}><span>Lower the music while the narrator speaks</span></label>
      <button type="button" class="nar-set" data-narreset="1">Back to the narrator you described</button>
      <div class="ka"><button type="button" class="nar-btn" data-nartest="1" aria-pressed="false"><span class="nar-go">▶ Hear the narrator</span><span class="nar-stop">■ Stop</span></button><button type="button" class="prim" data-narclose="1">Done</button></div>
    </form>`;
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
  }
  // the test reads the open place's first impressions, if it has them
  function sampleText() { const el = document.querySelector("#dossier .readaloud [data-narrate]"); const t = el ? el.getAttribute("data-narrate") : ""; return t ? (chunks(t).slice(0, 2).join(" ")) : SAMPLE; }
  function onSet(e) {
    const t = e.target, k = t.dataset && t.dataset.nar; if (!k) return;
    N.set[k] = k === "voice" ? t.value : k === "duck" || k === "phrases" ? t.checked : +t.value;
    save();
  }

  // every read-aloud button on the page, wherever it is drawn
  document.addEventListener("click", e => {
    const t = e.target.closest && e.target.closest("[data-narrate],[data-narrator]"); if (!t) return;
    if (t.dataset.narrator) { e.preventDefault(); openSettings(); return; }
    e.preventDefault(); e.stopPropagation();
    if (N.btn === t) stop(); else speak(t.getAttribute("data-narrate"), t);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && N.btn && !(document.getElementById("narDlg") || {}).open) stop(); });
  SS.getVoices();      // (asking once starts the browser loading its voices, so they are there when the settings open)
  A.narrator = { speak: t => speak(t, null), stop, speaking: () => !!N.btn, settings: () => Object.assign({}, N.set), voices: () => voices().map(v => v.name), open: openSettings };
})(ATLAS);
