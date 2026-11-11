/* Campaign Atlas app: the page's database, kept by the app on this computer. A campaign page opened from the app asks
   for window.claude.use("db") as it would on claude.ai; this answers with the same small set of calls, backed by the
   app. Two windows on the same campaign (the referee's and a players' screen) stay in step. */
(function () {
  "use strict";
  var TOKEN = "__TOKEN__", URL_ = "__URL__";
  var data = {}, v = -1, subs = [];
  var copy = function (o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); };
  function pull() {
    return fetch(URL_ + "?v=" + v, { headers: { "x-atlas-token": TOKEN }, cache: "no-store" }).then(function (r) {
      if (r.status === 204) return;
      return r.json().then(function (d) { data = d.data || {}; v = d.v; subs.forEach(function (f) { f(); }); });
    });
  }
  var ready = pull().catch(function () {});
  setInterval(function () { if (!document.hidden) pull().catch(function () {}); }, 3000);
  function write(kind, coll, id, body) {
    var c = data[coll] = data[coll] || {};
    if (kind === "set") c[id] = copy(body) || {}; else if (kind === "update") c[id] = Object.assign({}, c[id] || {}, copy(body) || {}); else delete c[id];
    subs.forEach(function (f) { f(); });
    return fetch(URL_, { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ kind: kind, coll: coll, id: id, body: body }) })
      .then(function (r) { if (!r.ok) throw new Error("not saved"); return r.json(); }).then(function (d) { v = d.v; });
  }
  function listen(fn) { subs.push(fn); ready.then(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; }
  function docRef(coll, id) {
    var snap = function () { var x = (data[coll] || {})[id]; return { id: id, exists: x !== undefined, data: function () { return copy(x); } }; };
    return {
      id: id,
      set: function (b) { return write("set", coll, id, b); },
      update: function (b) { return write("update", coll, id, b); },
      delete: function () { return write("delete", coll, id); },
      get: function () { return ready.then(snap); },
      onSnapshot: function (cb) { return listen(function () { cb(snap()); }); }
    };
  }
  function collRef(coll) {
    var snap = function () { var c = data[coll] || {}; return { docs: Object.keys(c).map(function (id) { return { id: id, exists: true, data: function () { return copy(c[id]); } }; }) }; };
    return {
      doc: function (id) { return docRef(coll, id); },
      get: function () { return ready.then(snap); },
      onSnapshot: function (cb) { return listen(function () { cb(snap()); }); }
    };
  }
  var db = { collection: collRef, doc: function (p) { var s = String(p).split("/"); return docRef(s[0], s[1]); } };
  var user = { can: function () { return Promise.resolve(true); } };
  window.claude = Object.assign(window.claude || {}, {
    use: function (name) { return name === "db" ? ready.then(function () { return db; }) : name === "user" ? Promise.resolve(user) : Promise.resolve(null); }
  });
  // what the page can ask of the app: the world map's "Make its 3D map now" (the page opens again on the new city)
  window.ATLAS_APP = {
    // a question for the game master's own Claude Code (the app runs it on this computer, on their plan)
    ask: function (prompt) {
      return fetch(URL_.replace(/db$/, "ask"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ prompt: prompt }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "no answer"); return d.text; }); });
    },
    // the map editor: keep a redrawn map in the campaign (null puts the drawn one back), and read a floor plan into rooms
    saveMap: function (id, edit) {
      return fetch(URL_.replace(/db$/, "save-map"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ id: id, edit: edit }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not saved"); return d; }); });
    },
    // the investigation: keep what the game master wrote on the page in the campaign (edits/story.js)
    saveStory: function (story) {
      return fetch(URL_.replace(/db$/, "save-story"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ story: story }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not kept"); return d; }); });
    },
    // places made in the city on the page (atlas-locations.js): all of them, kept in the campaign's files
    savePlaces: function (places) {
      return fetch(URL_.replace(/db$/, "save-places"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ places: places }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not kept"); return d; }); });
    },
    // handouts written on the page and the campaign's own story: kept in the campaign (edits/0-handouts.js, 0-context.js)
    saveHandouts: function (data) {
      return fetch(URL_.replace(/db$/, "save-handouts"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ data: data }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not kept"); return d; }); });
    },
    saveContext: function (data) {
      return fetch(URL_.replace(/db$/, "save-context"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ data: data }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not kept"); return d; }); });
    },
    // people made or changed on the page (atlas-people.js): kept in the campaign (edits/0-people.js)
    savePeople: function (people) {
      return fetch(URL_.replace(/db$/, "save-people"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ people: people }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not kept"); return d; }); });
    },
    // the model library: keep a model the game master brought in with the campaign (null meta forgets it)
    saveModel: function (id, meta, data, ext) {
      return fetch(URL_.replace(/db$/, "save-model"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ id: id, meta: meta, data: data, ext: ext }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not kept"); return d; }); });
    },
    trace: function (image, prompt) {
      return fetch(URL_.replace(/db$/, "trace"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ image: image, prompt: prompt }) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not read"); return d.plan; }); });
    },
    // the narrator's voices (atlas-narrator.js; the app's lib/voices.js): free models that speak on this computer
    voices: {
      base: "/voices/",
      list: function () {
        return fetch(URL_.replace(/db$/, "voices"), { headers: { "x-atlas-token": TOKEN }, cache: "no-store" })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not read"); return x.engines || []; }); });
      },
      install: function (id) {
        return fetch(URL_.replace(/db$/, "voices"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ install: id }) })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not installed"); return x; }); });
      },
      remove: function (id) {
        return fetch(URL_.replace(/db$/, "voices"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ remove: id }) })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not taken away"); return x; }); });
      }
    },
    // the sound packs (atlas-sound.js; the app's lib/audio.js): installed into the app's folder, served to every page
    audio: {
      base: "/audio/",
      packs: function () {
        return fetch(URL_.replace(/db$/, "audio-packs"), { headers: { "x-atlas-token": TOKEN }, cache: "no-store" })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not read"); return x; }); });
      },
      install: function (id) {
        return fetch(URL_.replace(/db$/, "audio-packs"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ install: id }) })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not installed"); return x; }); });
      },
      remove: function (id) {
        return fetch(URL_.replace(/db$/, "audio-packs"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ remove: id }) })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not taken away"); return x; }); });
      }
    },
    // the game master's own library (atlas-mylib.js): systems, worlds, looks and places kept on this computer for every
    // campaign, in the app's own folder
    library: {
      list: function () {
        return fetch(URL_.replace(/db$/, "library"), { headers: { "x-atlas-token": TOKEN }, cache: "no-store" })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not read"); return x.items || []; }); });
      },
      save: function (item) {
        return fetch(URL_.replace(/db$/, "library"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ item: item }) })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not kept"); return x; }); });
      },
      forget: function (id) {
        return fetch(URL_.replace(/db$/, "library"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ forget: id }) })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not forgotten"); return x; }); });
      }
    },
    // word between campaigns that share a world (atlas-word.js): sent to this computer's other campaigns of that world,
    // and what they sent picked up
    word: {
      send: function (d) {
        return fetch(URL_.replace(/db$/, "word"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify(d) })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not sent"); return x; }); });
      },
      inbox: function (world) {
        return fetch(URL_.replace(/db$/, "word") + "?world=" + encodeURIComponent(world), { headers: { "x-atlas-token": TOKEN }, cache: "no-store" })
          .then(function (r) { return r.json().then(function (x) { if (!r.ok) throw new Error(x.error || "not read"); return x.word || []; }); });
      }
    },
    makeCity: function (o) {
      return fetch(URL_.replace(/db$/, "make-city"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify(o) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not made"); return d; }); })
        .then(function (d) { location.hash = "city/" + d.id; location.reload(); return d; });
    },
    // the players on their own phones: the players' link on this computer's network (o: nothing to ask how it stands,
    // { on: true } to let them join, { on: true, fresh: true } for a new link, { on: false } to close it)
    lan: function (o) {
      return fetch(URL_.replace(/db$/, "players-lan"), o ? { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify(o) } : { headers: { "x-atlas-token": TOKEN }, cache: "no-store" })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not done"); return d; }); });
    },
    // the recorder on a phone of its own (the same calls as lan); a recording's sound kept on this computer, and deleted
    recorder: function (o) {
      return fetch(URL_.replace(/db$/, "recorder"), o ? { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify(o) } : { headers: { "x-atlas-token": TOKEN }, cache: "no-store" })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not done"); return d; }); });
    },
    audioUrl: function (rec, part) { return URL_.replace(/db$/, "rec-audio/" + rec + "/" + (part || 0)) + "?t=" + encodeURIComponent(TOKEN); },
    dropAudio: function (rec) {
      return fetch(URL_.replace(/db$/, "rec-drop"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify({ rec: rec }) }).then(function (r) { return r.json(); });
    }
  };
})();
