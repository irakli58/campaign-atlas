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
    makeCity: function (o) {
      return fetch(URL_.replace(/db$/, "make-city"), { method: "POST", headers: { "content-type": "application/json", "x-atlas-token": TOKEN }, body: JSON.stringify(o) })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "not made"); return d; }); })
        .then(function (d) { location.hash = "city/" + d.id; location.reload(); return d; });
    }
  };
})();
