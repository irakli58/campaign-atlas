/* Campaign Atlas app: the table's store for the players' copy on a player's own phone or laptop (players-lan.js). It
   answers window.claude.use("db") as local-db.js does for the game master's page, but through the players' link: it
   reads only what the players' window reads, and writes only the players' notes, the X-card and that they are there.
   It asks the app for news every two seconds. */
(function () {
  "use strict";
  var URL_ = "db", data = {}, v = -1, subs = [];
  var copy = function (o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); };
  function pull() {
    return fetch(URL_ + "?v=" + v, { cache: "no-store" }).then(function (r) {
      if (r.status === 204 || !r.ok) return;
      return r.json().then(function (d) { data = d.data || {}; v = d.v; subs.forEach(function (f) { f(); }); });
    });
  }
  var ready = pull().catch(function () {});
  setInterval(function () { if (!document.hidden) pull().catch(function () {}); }, 2000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) pull().catch(function () {}); });
  function write(kind, coll, id, body) {
    var c = data[coll] = data[coll] || {};
    if (kind === "set") c[id] = copy(body) || {}; else if (kind === "update") c[id] = Object.assign({}, c[id] || {}, copy(body) || {}); else delete c[id];
    subs.forEach(function (f) { f(); });
    return fetch(URL_, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: kind, coll: coll, id: id, body: body }) })
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
    return { doc: function (id) { return docRef(coll, id); }, get: function () { return ready.then(snap); }, onSnapshot: function (cb) { return listen(function () { cb(snap()); }); } };
  }
  var db = { collection: collRef, doc: function (p) { var s = String(p).split("/"); return docRef(s[0], s[1]); } };
  window.claude = Object.assign(window.claude || {}, { use: function (name) { return name === "db" ? ready.then(function () { return db; }) : Promise.resolve(null); } });
})();
