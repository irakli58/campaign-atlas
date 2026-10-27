/* The players' copy. The user asked (27 Oct 2026) for a copy of the campaign for the players: its maps joined up, under
   the fog the game master clears on their own screen, the players seeing each change, and the secrets kept from them in
   the data itself, not only on the screen. The copy (dist/players.html, atlas.js build) carries no campaign at all.
   The game master's page sends it, through the table's store (collection "share"), only what the players have been
   shown: each place they know of (its name, region and outside), the rooms of its floors they have seen or stand beside,
   the clues they found (their title and what they were told), the traps shown to them, their board, and the places of
   the world map they know. Nothing else of the campaign ever reaches it: a player who looks inside the copy finds what
   the table has already seen, and no more.
   On the game master's page A.share.start(store) keeps "share" up to date as the table changes; in the copy
   A.share.apply(store) takes it in, place by place. */
(function (A) {
  "use strict";
  const T = A.table; if (!T) return;

  /* ---- the game master's side: what the players have been shown */
  const dilate = (vis, W, H) => { const n = new Uint8Array(W * H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (vis[j * W + i]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = i + dx, Y = j + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) n[Y * W + X] = 1; } return n; };
  const touches = (m, W, H, x, y, w, h) => { for (let j = Math.max(0, y); j < Math.min(H, y + h); j++) for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) if (m[j * W + i]) return true; return false; };
  const on = (m, W, H, x, y) => { const i = Math.floor(x), j = Math.floor(y); return i >= 0 && j >= 0 && i < W && j < H && m[j * W + i] === 1; };
  const plainTitle = t => String(t || "").replace(/\s*\(.*\)\s*$/, "");
  const shownTrap = (pk, mid) => !!(A.devShown && A.devShown(pk, mid));

  // one floor as the players may have it: the rooms (each piece of them) they have seen or stand beside, so that what
  // they see is whole and nothing beyond it is there; doors, stairs, furniture and models among them; a secret door only
  // once both its sides are seen; the traps shown to them. A floor not yet seen is an empty frame without a name.
  function floorShare(pk, F, fi, fogD, traps, onScreen) {
    const W = F.w, H = F.h;
    if (A.isGmFloor(F)) return { n: "", w: W, h: H, gm: 1, R: [], D: [], ST: [], I: [], P: [], M: [] };
    const open = (fogD.f || {})[fi] || [], fv = T.fogVis(fogD, fi, F, open), seenAny = fv.vis.some(Boolean);
    const base = { n: seenAny || onScreen ? F.n : "", w: W, h: H }; for (const k of ["cave", "geo", "light", "wh"]) if (F[k] != null) base[k] = F[k];
    if (!seenAny) return Object.assign(base, { dark: 1, R: [], D: [], ST: [], I: [], P: [], M: [] });
    const near = dilate(fv.vis, W, H), hidden = r => !!(r[7] && r[7].h) && !fv.show.has(r[0]);
    // (a piece beside what they have seen, but not itself seen, comes without its room's name)
    const R = F.R.filter(r => !hidden(r) && touches(near, W, H, r[1], r[2], r[3], r[4])).map(r => {
      const o = r[7] ? Object.assign({}, r[7]) : null, q = r.slice(0, 7); if (o) { delete o.h; delete o.fx; }
      if (q[5] && !touches(fv.vis, W, H, r[1], r[2], r[3], r[4])) q[5] = "";
      return o && Object.keys(o).length ? q.concat([o]) : q;
    });
    const side = (d, m) => { const [x, y, or, , len = 1] = d, out = []; for (let k = 0; k < len; k++) out.push(or === "h" ? [on(m, W, H, x + k + .5, y - .5), on(m, W, H, x + k + .5, y + .5)] : [on(m, W, H, x - .5, y + k + .5), on(m, W, H, x + .5, y + k + .5)]); return out; };
    const D = (F.D || []).filter(d => d[3] === "s" ? side(d, fv.vis).some(([a, b]) => a && b) : side(d, near).some(([a, b]) => a || b)).map(d => d[3] === "s" ? [d[0], d[1], d[2], "d"].concat(d.slice(4)) : d.slice());
    const inHid = (x, y) => F.R.some(q => hidden(q) && x >= q[1] && x < q[1] + q[3] && y >= q[2] && y < q[2] + q[4]);
    const ST = (F.ST || []).filter(s => on(near, W, H, s[1] + s[3] / 2, s[2] + s[4] / 2) && !inHid(s[1] + s[3] / 2, s[2] + s[4] / 2)).map(s => s.slice());
    const I = (F.I || []).filter(it => !it[6] && on(near, W, H, it[1] + (it[3] || 1) / 2, it[2] + (it[4] || 1) / 2)).map(it => it.slice());
    const P = (F.P || []).filter(p => !p.h && on(near, W, H, p.x, p.y)).map(p => { const q = Object.assign({}, p); delete q.dev; delete q.n; return q; });
    const M = (F.M || []).filter(m => A.dirOf(m[0]) === "traps" && traps[m[0]] && shownTrap(pk, m[0])).map(m => m.slice(0, 3));
    return Object.assign(base, { R, D, ST, I, P, M });
  }
  // a place as the players may have it, or null when they have not heard of it, seen it, nor been shown it
  function placeShare(S, id, screen) {
    const Mp = A.maps[id] ? A.get(id) : null, m = A.meta[id]; if (!m) return null;
    const pk = A.keyOf(id), status = (S.get("status", id) || {}).status || "unknown", fogD = S.get("fog", id) || {};
    const onScreen = screen && screen.kind === "map" && screen.place === id ? +screen.floor || 0 : -1;
    const traps = (Mp && Mp.traps) || {};
    const floors = Mp ? Mp.floors.map((F, fi) => floorShare(pk, F, fi, fogD, traps, fi === onScreen)) : [];
    const seen = floors.some(F => !F.dark && !F.gm);
    if (status === "unknown" && !seen && onScreen < 0) return null;
    const done = (S.get("clues", id) || {}).done || [], clues = {};
    if (Mp) for (const k of done) { const c = (Mp.clues || {})[k]; if (c && !c.arch) clues[k] = c.pd ? { t: plainTitle(c.t), pd: c.pd } : { t: plainTitle(c.t) }; }
    const tr = {}; if (Mp) for (const [mid, t] of Object.entries(traps)) if (t && t.area && shownTrap(pk, mid)) tr[mid] = { area: t.area.slice() };
    const out = { name: m.name || id, region: m.region || "", status, floors, clues, traps: tr, start: Mp ? Math.max(0, Mp.floors.findIndex(F => !A.isGmFloor(F))) : 0 };
    if (Mp && Mp.ext && (status !== "rumoured" || seen)) out.ext = Mp.ext;
    if (String(id).startsWith("fly-")) out.fly = 1;
    return out;
  }
  // the world map's places and roads the players know of, where they stand, and where the party is
  function worldShare(S, prefs) {
    if (!A.worldData || !A.worldPrepare) return null;
    const OV = { loc: {}, route: {}, party: null };
    let docs = Object.entries(S.get("world") || {});
    if (!docs.length && prefs) { try { docs = Object.entries(JSON.parse(prefs.get("world-edits") || "{}") || {}); } catch (e) { docs = []; } }
    for (const [k, d] of docs) { if (k.startsWith("l-")) OV.loc[k.slice(2)] = d; else if (k.startsWith("r-")) OV.route[k.slice(2)] = d; else if (k === "party") OV.party = d; }
    const WD = A.worldPrepare(A.worldData, A.worldTerrainData, OV), seen = id => WD.byId[id] && WD.byId[id].state !== "unknown";
    const keep = (o, ks) => { const x = {}; for (const k of ks) if (o[k] != null && o[k] !== "") x[k] = Array.isArray(o[k]) ? o[k].slice() : o[k]; return x; };
    const locations = WD.locs.filter(l => l.state !== "unknown").map(l => keep(l, ["id", "name", "kind", "at", "state", "region"]));
    const routes = WD.routes.filter(r => !r.hidden && seen(r.from) && seen(r.to)).map(r => keep(r, ["id", "from", "to", "kind", "name", "path"]));
    const party = WD.party && seen(WD.party.at) ? { at: WD.party.at, plan: [], trail: (WD.party.trail || []).filter(seen) } : null;
    return { title: WD.W.title || "", look: WD.W.look || "", size: WD.size, scale: WD.W.scale || null, speeds: WD.W.speeds || null, labels: (WD.W.labels || []).slice(), locations, routes, party };
  }
  // their board, as their own window draws it: what they have found, and the strings the game master pinned up (laid out
  // again only when what is on it changes)
  let boardMemo = { k: "", v: null };
  function boardShare(S) {
    const found = T.foundIn(S), all = T.boardModel(), keep = new Set(all.nodes.filter(nd => found(nd.id)).map(nd => nd.id));
    const nodes = all.nodes.filter(nd => keep.has(nd.id)).map(nd => ({ id: nd.id, kind: nd.kind, title: nd.title, sub: nd.kind === "person" ? T.plainRole(nd.sub) : nd.kind === "place" ? nd.sub || "" : "" }));
    const edges = all.edges.filter(e => keep.has(e.a) && keep.has(e.b) && (e.kind !== "story" || e.shown)).map(e => ({ a: e.a, b: e.b, kind: e.kind }));
    const k = JSON.stringify([nodes, edges]); if (boardMemo.k === k) return boardMemo.v;
    const [W, H] = T.boardSize(Math.max(6, nodes.length)), model = { nodes, edges };
    boardMemo = { k, v: { nodes, edges, W, H, pos: T.boardLayout(model, W, H) } };
    return boardMemo.v;
  }
  // everything to share, as docs of the collection
  function compute(S, prefs) {
    const out = {}, screen = S.get("screen", "now") || {};
    for (const id of A.order) { const d = placeShare(S, id, screen); if (d) out["place:" + id] = d; }
    const w = worldShare(S, prefs); if (w) out.world = w;
    out.board = boardShare(S);
    return out;
  }
  // kept up to date: worked out again a moment after the table changes, and only what changed is written
  function start(S, prefs) {
    const last = {}; let t = 0;
    const run = () => {
      t = 0; let all; try { all = compute(S, prefs); } catch (e) { console.warn("atlas: the players' copy could not be brought up to date", e); return; }
      const have = S.get("share") || {};
      for (const [k, d] of Object.entries(all)) { const s = JSON.stringify(d); if (last[k] === s) continue; last[k] = s; if (JSON.stringify(have[k]) !== s) S.set("share", k, d); }
      for (const k of Object.keys(have)) if (!(k in all)) { delete last[k]; S.set("share", k, null); }
    };
    const soon = () => { clearTimeout(t); t = setTimeout(run, 400); };
    for (const c of ["share", "fog", "status", "clues", "screen", "board", "devstate", "world", "mapedits", "fly"]) S.watch(c, soon);
    if (typeof document !== "undefined") document.addEventListener("atlas-story", soon);
    S.ready.then(soon);
    return { now: run };
  }

  /* ---- the players' copy: what the game master's page has shared, taken in */
  function apply(st) {
    A.devShown = (pk, mid) => !!(((A.maps[pk] || {}).traps || {})[mid]);
    const got = {};
    st.watch("share", docs => {
      let changed = false;
      for (const [k, d] of Object.entries(docs)) {
        const s = JSON.stringify(d); if (got[k] === s) continue; got[k] = s; changed = true;
        if (k.startsWith("place:")) {
          const id = k.slice(6), floors = JSON.parse(JSON.stringify(d.floors || []));
          A.place(id, { name: d.name, region: d.region, map: { floors, ext: d.ext || "", clues: d.clues || {}, traps: d.traps || {}, start: d.start || 0 } });
        } else if (k === "world") A.worldData = JSON.parse(s);
        else if (k === "board") A.shareBoard = d;
      }
      for (const k of Object.keys(got)) if (!(k in docs)) {
        delete got[k]; changed = true;
        if (k.startsWith("place:")) { const id = k.slice(6); delete A.maps[id]; delete A.meta[id]; const i = A.order.indexOf(id); if (i >= 0) A.order.splice(i, 1); }
        else if (k === "world") A.worldData = null; else if (k === "board") A.shareBoard = null;
      }
      if (!changed) return;
      A.state.cache = {};
      if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("atlas-share"));
    });
  }

  // the copy opening: the table's store (the page's database, or this browser's, kept in step with the game master's
  // window), what has been shared taken in, and the players' window
  function boot() {
    const cfg = A.config, store = { get(k) { try { return localStorage.getItem(cfg.storageKey + "-" + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(cfg.storageKey + "-" + k, v); } catch (e) {} } };
    A.playersCopy = true; if (A.loadPrefs) A.loadPrefs();
    const DBP = (async () => { let db = null; try { db = window.claude && window.claude.use ? await window.claude.use("db") : null; } catch (e) { db = null; } return db || (A.localDb ? A.localDb(cfg.storageKey) : null); })();
    const st = T.makeStore(DBP, cfg.storageKey);
    apply(st);
    A.playersScreen({ store: st, found: T.foundIn(st), prefStore: store });
  }

  A.share = { start, apply, boot, compute, placeShare, floorShare };
})(ATLAS);
