/* Your own library (the editing plan of 10 Nov 2026, section 4, item 1, approved by the user: "save a system, station,
   ship or world you built, and use it in your other campaigns"): systems, worlds, looks and places (stations, ships, any
   place with its inside) the game master keeps, each an independent copy, put into any campaign as a copy again, so
   changing one never changes another.
   Kept where the page can keep it for all the game master's campaigns: in the Atlas app, on this computer in the app's
   own folder (data/library/, never in the public repository: window.ATLAS_APP.library); otherwise in this browser
   (localStorage "atlas-mylib", shared by the campaigns opened from the same place). Nothing of it is in a campaign's
   files, so a campaign shared with others carries none of it.
   ATLAS.myLibrary: list(kind) → Promise of items, save(item) → Promise of the item kept, forget(id), where(), on(fn).
   An item: { atlasLib: 1, id, kind: "system" | "world" | "look" | "place" | "soundscape", name, say, from, t, data }.
   (A soundscape is a scene of sounds, from the Sounds panel, atlas-sound.js: its layers and its sounds now and then.) */
(function (A) {
  "use strict";
  if (typeof window === "undefined") return;
  const KEY = "atlas-mylib", KINDS = ["system", "world", "look", "place", "soundscape", "person", "handout", "story"], subs = [];
  const app = () => window.ATLAS_APP && window.ATLAS_APP.library;
  const local = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const keepLocal = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; } };
  let cache = null;
  const ok = it => it && it.atlasLib === 1 && KINDS.includes(it.kind) && typeof it.id === "string" && it.data && typeof it.data === "object";
  async function all() {
    if (cache) return cache;
    if (app()) { try { cache = (await app().list()).filter(ok); return cache; } catch (e) { console.warn("my library:", e); } }
    cache = local().filter(ok); return cache;
  }
  const tell = () => { for (const f of subs) try { f(); } catch (e) {} };
  A.myLibrary = {
    KINDS,
    // where it is kept, in words
    where: () => app() ? "on this computer, for all your campaigns in Atlas" : "in this browser, for the campaigns you open here",
    list: async kind => (await all()).filter(it => !kind || it.kind === kind).sort((a, b) => (b.t || 0) - (a.t || 0)),
    get: async id => (await all()).find(it => it.id === id) || null,
    // (a copy is kept, never the campaign's own object)
    save: async item => {
      const it = JSON.parse(JSON.stringify(Object.assign({ atlasLib: 1, id: "my-" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100), t: Date.now(), from: ((A.config || {}).title || "") }, item)));
      if (!ok(it)) throw new Error("that cannot be kept in the library");
      if (app()) { await app().save(it); cache = null; tell(); return it; }
      const list = local().filter(x => x.id !== it.id); list.push(it);
      if (!keepLocal(list)) throw new Error("this browser has no room left to keep it");
      cache = null; tell(); return it;
    },
    forget: async id => {
      if (app()) { await app().forget(id); cache = null; tell(); return; }
      keepLocal(local().filter(x => x.id !== id)); cache = null; tell();
    },
    on: fn => { subs.push(fn); },
    reset: () => { cache = null; }
  };
})(typeof ATLAS !== "undefined" ? ATLAS : {});
