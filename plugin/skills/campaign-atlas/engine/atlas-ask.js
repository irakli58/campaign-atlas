/* Asking for a change in words (the user's master plan, 26 Oct 2026, "Selective AI Regeneration": "Allow the DM to
   select a specific area or object and request AI changes ... Do not regenerate unrelated areas. Before destructive
   changes, show what will be replaced and allow confirmation. Preserve existing NPCs, quests, clues, and faction
   references whenever possible").
   The game master chooses one thing (a place of their own, a building of a city, a place on the world map, a star
   system) and says what should change. Claude chooses one of the changes that thing allows and gives its values; the
   page shows the change, what it replaces and what it keeps, and nothing changes until the game master says "Make the
   change". Each thing says for itself what changes it allows, how to read their values, what each would replace and
   keep, and how to make it (A.askChange(T)):
     T = { what: "a place of your own", name, now: "what it is now, in a few lines",
           ops: { id: { label, values: "the values, for Claude", read(v) -> values or null, plan(v) -> { change, replaces: [],
                  keeps: [], detail: [new words to show in full] }, apply(v) } } } */
(function (A) {
  "use strict";
  const esc = A.esc;
  let dlg = null, T = null, P = null;
  const ask = () => A.tableUI && A.tableUI.api && A.tableUI.api.askRaw;
  function draw(state) {
    const opList = Object.entries(T.ops).map(([, o]) => esc(o.label.toLowerCase())).join(", ");
    dlg.innerHTML = `<form class="loc-form ask-form" method="dialog">
      <div class="loc-head ask-head"><h3>Change ${esc(T.name)}</h3><button type="button" class="t-btn" data-ask="x" aria-label="Close">Close</button></div>
      <p class="t-small">Say what should change. Only ${esc(T.name)} is changed, and only after you have seen what it replaces. What it can do here: ${opList}.</p>
      <label class="ask-q">What should change?<textarea class="t-in" name="q" rows="3" maxlength="600" placeholder="${esc(T.example || "")}">${esc(state.q || "")}</textarea></label>
      <div class="ask-go"><button type="button" class="t-btn prim" data-ask="ask"${state.busy ? " disabled" : ""}>${state.busy ? "Asking Claude…" : P ? "Ask again" : "Ask"}</button><span class="ask-msg">${esc(state.msg || "")}</span></div>
      ${P ? `<section class="ask-plan"><h4>${esc(P.plan.change)}</h4>${P.why ? `<p class="t-small">${esc(P.why)}</p>` : ""}
        ${(P.plan.detail || []).filter(Boolean).map(d => `<blockquote class="ask-text">${esc(d)}</blockquote>`).join("")}
        ${P.plan.replaces.length ? `<div class="ask-l ask-rep"><span class="kl">This replaces</span><ul>${P.plan.replaces.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div>` : `<div class="ask-l"><span class="kl">This replaces</span><p class="t-small">Nothing: it only adds.</p></div>`}
        ${P.plan.keeps.length ? `<div class="ask-l ask-keep"><span class="kl">This keeps</span><ul>${P.plan.keeps.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div>` : ""}
        <div class="ask-go"><button type="button" class="t-btn prim" data-ask="do">Make the change</button><button type="button" class="t-btn" data-ask="drop">Not this</button></div></section>` : ""}
    </form>`;
  }
  async function onClick(e) {
    const b = e.target.closest("[data-ask]"); if (!b) return;
    const a = b.dataset.ask, q = (dlg.querySelector('[name="q"]') || {}).value || "";
    if (a === "x") { dlg.close(); return; }
    if (a === "drop") { P = null; draw({ q }); return; }
    if (a === "do" && P) { const p = P; P = null; dlg.close(); try { await p.op.apply(p.values); } catch (err) { console.warn("the change could not be made", err); } return; }
    if (a !== "ask") return;
    if (!q.trim()) { draw({ q, msg: "Say what should change first." }); return; }
    const f = ask(); if (!f) { draw({ q, msg: "This needs Claude: on claude.ai, or in the Atlas app. The tools themselves do every one of these changes by hand." }); return; }
    P = null; draw({ q, busy: true });
    const cfg = A.config || {}, ops = Object.entries(T.ops).map(([id, o]) => `- "${id}": ${o.label}. Values: ${o.values}`).join("\n");
    const prompt = `A tabletop roleplaying campaign: "${cfg.title || ""}" (${[cfg.system, cfg.setting].filter(Boolean).join(", ")}). The game master has chosen ${T.what}: "${T.name}". As it is now:\n${T.now}\n\nThey ask: "${q.trim()}"\n\nChoose the ONE change below that does what they ask, and give its values. Change nothing else; if none of them does what they ask, choose "none".\n${ops}\n\nAnswer with JSON only: {"op": "<one of the ids above, or none>", "values": { ... }, "why": "one short sentence for the game master"}. Invent nothing about the campaign's own people or events.`;
    let v = null; try { const raw = await f(prompt); const m = String(raw || "").match(/\{[\s\S]*\}/); v = m ? JSON.parse(m[0]) : null; } catch (err) { v = null; }
    if (!v) { draw({ q, msg: "Claude could not answer just now. Try again, or use the tools by hand." }); return; }
    const op = T.ops[v.op];
    if (!op) { draw({ q, msg: v.why ? `None of the changes here does that: ${v.why}` : "None of the changes here does that. Try saying it another way, or use the tools by hand." }); return; }
    const values = op.read(v.values || {});
    if (!values) { draw({ q, msg: "Claude's answer did not make a change that can be made here. Try again." }); return; }
    P = { op, values, plan: op.plan(values), why: String(v.why || "").slice(0, 300) };
    draw({ q });
  }
  A.askChange = function (target) {
    T = target; P = null;
    if (!dlg) { dlg = document.createElement("dialog"); dlg.className = "loc-dlg ask-dlg"; document.body.appendChild(dlg); dlg.addEventListener("click", onClick); dlg.addEventListener("close", () => { P = null; }); }
    draw({});
    if (!dlg.open) dlg.showModal();
    setTimeout(() => { const t = dlg.querySelector('[name="q"]'); if (t) t.focus(); }, 30);
  };
  // (values read safely: a string cut to length, a number held to its range, a word from a list)
  A.askChange.str = (v, n) => typeof v === "string" && v.trim() ? v.trim().slice(0, n || 200) : null;
  A.askChange.num = (v, lo, hi) => Number.isFinite(+v) ? Math.max(lo, Math.min(hi, Math.round(+v))) : null;
  A.askChange.one = (v, list) => list.includes(v) ? v : null;
})(ATLAS);
