/* The tutorials' content (the user asked, 27 Oct 2026, for an animated, interactive way to learn all of Atlas, which
   grows with it). One list serves the guided tour on a campaign's page (atlas-tutorial.js: "Show me" and "Let me
   try"), the tutorial video (dev/tutorial-video.js plays the same lessons and records them) and the help library's
   search. Each lesson: id, title, summary, the features it teaches (FEATURES below: the library's index, and what
   dev/tutorial-coverage.js checks every feature of the page against), needs (what the page must have for it, else it
   is left out), and its steps:
     { say: what is said (shown, and read aloud when asked), sel: where (a CSS selector, or a list of them: the first
       there), act: "look" | "click" | "type" (value) | "hover", try: what the person is asked to do in "Let me try",
       auto: true (done for them in both modes: a way into the next part), sim: true (in "Show me" the click is shown,
       not made: it would change their campaign), wait: ms after }
   A new feature gets its lesson, or its steps in a lesson, here; its entry in FEATURES; and the coverage check passes.
   The look, the timing and the words follow the lessons already here. */
(function (A) {
  "use strict";
  const has = s => () => !!document.querySelector(s);
  const chapters = [
    { id: "start", title: "Welcome to Atlas", lessons: [
      { id: "tour", title: "Finding your way", summary: "The page your campaign lives on: its book of places, the tools for game night, and where help is.", features: ["gazetteer", "search", "views", "help"], steps: [
        { say: "This is your campaign's page: everything the council wrote, every place mapped, and the tools to run it. Let's look around.", sel: "header, .mast, h1", act: "look" },
        { say: "These are the page's views. The Gazetteer is the campaign's book: its places, people and clues.", sel: "#v-gaz", act: "click", try: "Click Gazetteer." },
        { say: "Every place of the campaign is listed here. Click one to open its page.", sel: "#list", act: "look" },
        { say: "Search finds any place, person or clue by a word. Type a name...", sel: "#q", act: "type", value: "the", try: "Type a word into the search box." },
        { say: "...and clear it to see everything again.", sel: "#q", act: "type", value: "", auto: true },
        { say: "At the table holds everything for game night: the players' screen, handouts, clocks, the copilot and more.", sel: "#v-table", act: "look" },
        { say: "And this button opens Help and tutorials whenever you want them: every lesson, a search, and where you left off.", sel: ".tu-helpbtn", act: "look" }
      ] },
      { id: "safe", title: "What only you see", summary: "Your view holds every secret; the Player-safe view shows what the players may see.", features: ["playersafe"], needs: has("#m-player"), steps: [
        { say: "You are reading your own view: secrets, the room-by-room guide, who knows what.", sel: "#m-keeper", act: "look" },
        { say: "Player-safe hides every secret, so you can show the page itself to the table if you like.", sel: "#m-player", act: "click", try: "Click Player-safe." },
        { say: "And back to your own view.", sel: "#m-keeper", act: "click", try: "Click your own view again." }
      ] },
      { id: "modules", title: "What this campaign uses", summary: "Switch off the parts of Atlas a campaign does not need; nothing is deleted.", features: ["modules"], needs: has(".featbtn[data-mf-open]"), steps: [
        { say: "The gear at the top chooses what this campaign uses. Switch off what it does not need: it is hidden and its work stops. Nothing is deleted, and switching it back on picks up where it was.", sel: ".featbtn[data-mf-open]", act: "click", try: "Click the gear.", wait: 700 },
        { say: "A preset sets them all at once: Minimal, Detective, Sandbox world, Traditional fantasy, Science fiction or Everything. As before keeps everything as it was.", sel: ".mf-dlg .mf-pres", act: "look" },
        { say: "Or choose each part yourself: off, or how much of it. A line under a part tells you when it leans on another. Safety is always on.", sel: ".mf-dlg .mf-seg", act: "look" },
        { say: "Save these as my own keeps your choices as a preset of your own, for the other campaigns you open here.", sel: ".mf-dlg [data-mf-save]", act: "look" },
        { say: "Done closes it. The same choices are on At the table, under Start here.", sel: ".mf-dlg [data-mf-close]", act: "click", auto: true }
      ] }
    ] },
    { id: "places", title: "Places and their maps", lessons: [
      { id: "place", title: "Reading a place", summary: "A place's page: what it is, its maps floor by floor, its people and clues.", features: ["facility", "dossier", "floors", "mapviews", "trail", "askchange"], needs: has("#list li button[data-go]"), steps: [
        { say: "Open a place from the list.", sel: "#list li button[data-go]", act: "click", try: "Click a place in the list." },
        { say: "Its page tells you what it is, what is really going on, the people here and the clues to find.", sel: "#dossier", act: "look", wait: 600 },
        { say: "Above its name, where it is: the world, its city, or the stars and its system. Click a step to go back up to that map.", sel: "#dossier .trail", act: "look", optional: true },
        { say: "On a place of your own, Ask for a change: say what should change (its name, its kind or outside, its words, or its inside drawn again) and see what it would replace and what it keeps before anything changes. Bring back the inside it had undoes a redrawn inside.", sel: "[data-loc='ask']", act: "look", optional: true },
        { say: "Its maps come floor by floor. Each floor has its own button.", sel: ".lmap-sec .lm-floors", act: "look" },
        { say: "Player view shows the map as the players may see it: no secret rooms, no markers.", sel: ".lmap-sec [data-lmv='player']", act: "click", try: "Click Player view." },
        { say: "Your view again, with every marker: clues, people, secrets and dangers.", sel: ".lmap-sec [data-lmv='gm']", act: "click", try: "Click your view." },
        { say: "Below the map, its guide: every room, what is there, who is there, what can be found.", sel: ".lmap-sec .lm-ref", act: "look" },
        { say: "A station, a ship or a laboratory has its systems: power, oxygen, pressure and the rest. Change them as the story does, or let one worsen with the world's time.", sel: "#dossier .t-fac", act: "look", optional: true }
      ] },
      { id: "map3d", title: "Big maps and 3D", summary: "A map at full size, and the room in 3D from its one fixed angle.", features: ["fullsize", "room3d"], needs: has(".lmap-sec"), steps: [
        { say: "Full size opens the map as large as your screen allows.", sel: ".lmap-sec [data-lmfull]", act: "click", try: "Click Full size." },
        { say: "Close it again when you have looked.", sel: "#lmDlg[open] .lm-dlg-x", act: "click", auto: true },
        { say: "And here the floor in 3D, seen from one fixed angle so you never lose your way. Slide and zoom; it never turns.", sel: ".lmap-sec [data-m3d], .lmap-sec [data-lm3d]", act: "look" }
      ] },
      { id: "editor", module: ["mapedit"], title: "Editing a map", summary: "Redraw any map: rooms, doors, stairs, furniture and models, in 2D or 3D.", features: ["mapeditor", "furnish", "models", "mapmarks"], needs: has(".lmap-sec [data-medit]"), steps: [
        { say: "Edit this map opens the map editor. Nothing is kept until you save.", sel: ".lmap-sec [data-medit]", act: "click", try: "Click Edit this map." },
        { say: "Its tools: draw rooms, doors and stairs; furnish with models from the library; place clues.", sel: "#meDlg .me-tools", act: "look", wait: 600 },
        { say: "And put people, dangers and secrets on the map where they are, each with its words.", sel: "#meDlg [data-tool='marks']", act: "look" },
        { say: "Switch between the flat map and 3D: it is the same map.", sel: "#meDlg [data-r3v]", act: "look" },
        { say: "Close it without saving: your map stays as it was.", sel: "#meDlg [data-me='close']", act: "click", auto: true }
      ] },
      { id: "caves", module: ["caves"], title: "Caves, riddles and traps", summary: "Generate a cave, mend it, and the riddles and traps it holds.", features: ["caves", "riddles", "traps"], needs: () => !!(window.ATLAS && Object.values(ATLAS.maps || {}).some(M => (M.floors || []).some(F => F.cave))), steps: [
        { say: "A cave's page has its traps and riddles in its guide: how they are set off, the signs, how to disarm them, and the riddle's answer folded away.", sel: ".lm-ref", act: "look" },
        { say: "In the map editor, Generate a cave makes one from your settings: chambers, water, chasms, secrets, every chamber reachable. Check and Mend keep it so.", sel: ".lmap-sec [data-medit]", act: "look" }
      ] }
    ] },
    { id: "world", title: "The world", lessons: [
      { id: "worldmap", module: ["world"], title: "The world map", summary: "The lands between your places, drawn in a style fitting your setting; each city opens in 3D.", features: ["worldmap", "maplook", "worldedit", "oceancurrents", "geocoasts", "roadnet", "askchange"], needs: has("#v-world"), steps: [
        { say: "The world map shows the land between your places.", sel: "#v-world", act: "click", try: "Click World map.", wait: 1600 },
        { say: "A campaign can hold more than one world: a planet's surface, a moon, the layers of a plane. This chooses which is shown; each keeps its own land, places, roads and changes.", sel: "#v-worldsel", act: "look", optional: true },
        { say: "Choose how it is drawn: a painted fantasy map, fantasy parchment, an engraved atlas, a modern atlas or a science-fiction survey. The players see the same.", sel: ".wm-look", act: "look" },
        { say: "Zoom in: finer things appear as you come closer.", sel: ".wm-ctl [data-z='in']", act: "click", try: "Click + to zoom in.", wait: 700 },
        { say: "And back to the whole world.", sel: ".wm-ctl [data-z='home']", act: "click", auto: true },
        { say: "Click a place for what is there; a place with a 3D map opens it with Enter.", sel: ".wl", act: "look" },
        { say: "This menu chooses how the map is drawn. Hydrographic relief is a raised print of the land on pale paper, every stream and valley shown; Shaded relief keeps the blue sea; the other styles suit other settings. Your players see the same.", sel: ".wm-look", act: "look", optional: true },
        { say: "Ocean currents shows how the sea moves, where the world's currents were worked out: warm currents in red, cold in blue, arrows the way the water runs, the gyres, the equator and the lines of latitude. Their names can be hidden.", sel: "[data-w='currents']:not([hidden])", act: "look", optional: true },
        { say: "Coasts shows what kind each coast is and why it formed there: fjords, skerries, rias, estuaries, deltas, Dalmatian islands, cliffs, barrier islands, dunes, salt marsh, mangroves, reefs and atolls, each in its own colour with a key. Point at a numbered pin for the reason: the ice age's glaciers, the sea rising, the rock, the rivers' mud, the waves or the tides.", sel: "[data-w='coasts']:not([hidden])", act: "look", optional: true },
        { say: "Road network (trial) shows the roads grown over the ages from the land and its trade: towns and villages between your places, major roads between the cities, local roads to market, paths between villages, sea lanes, river routes, bridges, fords, ferries, passes and the borders. Zoom in for the towns, then the villages and paths. Your own routes run along its roads; a town of it opens in 3D like your own places.", sel: "[data-w='roadnet']:not([hidden])", act: "click", try: "Click Road network (trial).", wait: 1200, optional: true },
        { say: "Development sets how built-up the roads are, from 1, tribal footpaths and trails, to 5, modern highways with bridges and tunnels. The towns, villages and land stay the same; only the roads change. It starts at the network as it was made; Default goes back there. Your players see the level you choose.", sel: ".wm-dev:not([hidden]) input", act: "look", optional: true },
        { say: "And the network off again.", sel: "[data-w='roadnet'][aria-pressed='true']", act: "click", auto: true, optional: true },
        { say: "A chosen place has Ask for a change: say what should change (its details, who holds it, a road from it to another place, a new settlement near it) and see what it would replace and keep before anything changes.", sel: "[data-w='askloc']", act: "look", optional: true },
        { say: "Edit map moves places, adds places and routes, shapes the land itself, and marks the party's journey.", sel: "[data-w='edit']", act: "look" },
        { say: "Back to the Gazetteer.", sel: "#v-gaz", act: "click", auto: true }
      ] },
      { id: "worldbuild", module: ["world", "edit"], title: "Shaping the world", summary: "Paint the land, draw rivers, kingdoms and territories, write names on the map; undo any of it.", features: ["worldbuild", "worldedit", "worldland"], needs: has("#v-world"), steps: [
        { say: "The world map can be changed as much as you like, or made from nothing.", sel: "#v-world", act: "click", try: "Click World map.", wait: 1600 },
        { say: "Edit map opens the tools.", sel: "[data-w='edit']", act: "click", try: "Click Edit map.", wait: 500 },
        { say: "Shape the land paints the land itself: raise land from the sea, carve out a sea or a lake, raise mountains and hills, plant forest, dry it to desert or wet it to swamp.", sel: "[data-w='brush']", act: "click", try: "Click Shape the land.", wait: 500 },
        { say: "Choose what to paint, from the shape of the land to every kind of land there is: forests of every kind, jungle, savanna, dunes, tundra, glaciers, volcanoes, mesas, marsh, reefs, a lake of any liquid, and in fantasy enchanted and corrupted woods or floating mountains. Each blends into the land round it. As the climate makes it erases what you painted.", sel: ".wm-brushbar select", act: "look", optional: true },
        { say: "Make a new world generates a whole new land: choose how big (up to a whole planet), its shape (a preset such as one big continent, several continents or many islands, or how many landmasses and how much of it is land), its climate and its look. Choose Paint it myself to paint the land, forests, deserts, mountains, lakes and rivers in a few colours, or load a picture of your own drawing; the slider says how closely to follow it, from exactly as drawn to loosely; the plates, rivers and climate make the rest. A new world has the ocean's currents worked out (they warm and cool the coasts) and its coasts shaped by their whole history (the rock, the ice age's glaciers, the sea's rise, the rivers and the waves); either can be turned off, or the coasts made simpler.", sel: "[data-w='newworld']", act: "look", optional: true },
        { say: "Slide the brush size to paint a single valley or a whole region; the circle on the map shows how big it is. A map with no land yet starts as all sea or all land.", sel: ".wm-bsize", act: "look", optional: true },
        { say: "+ River: click where it rises and along its way to the sea, then Finish the river.", sel: "[data-w='river']", act: "look", optional: true },
        { say: "+ Realm draws a kingdom, a province or a territory round its border, and says which faction holds it. A hidden one only you see; the factions' tab lists what each one holds.", sel: "[data-w='realm']", act: "look" },
        { say: "+ Name writes a name on the map: a sea, a mountain range, a forest.", sel: "[data-w='label']", act: "look" },
        { say: "Click a river, a realm or a name to change, duplicate or delete it. Drag it to move it, or drag a corner to reshape it. A place can be duplicated too.", sel: ".wm-stage", act: "look" },
        { say: "Undo and Redo take back any change and do it again (Ctrl+Z and Ctrl+Y).", sel: "[data-w='undo']", act: "look" },
        { say: "Copy as world.js gives it all back to the campaign: the land as you shaped it, the rivers, realms and names with it.", sel: "[data-w='export']", act: "look" },
        { say: "Edit map again puts the tools away.", sel: "[data-w='edit']", act: "click", auto: true, wait: 400 },
        { say: "Back to the Gazetteer.", sel: "#v-gaz", act: "click", auto: true }
      ] },
      { id: "cityedit", module: ["cities", "edit"], title: "Changing a city", summary: "Move, turn, change or remove buildings; add houses, roads, walls and gates, parks, squares and districts; put people in the streets; make a building one of your places.", features: ["cityedit", "citypeople", "askchange", "realplaces"], needs: has("[data-editcity]"), steps: [
        { say: "A city made for your story can be changed as much as you like. A real city keeps its real streets.", sel: "#v-gaz", act: "click", try: "Click Gazetteer.", wait: 900 },
        { say: "Edit the city opens its tools.", sel: "[data-editcity]", act: "click", try: "Click Edit the city.", wait: 500 },
        { say: "Choose a building: then move it, turn it, change its kind, its floors and its roof, or remove it.", sel: ".cebar [data-t='select']", act: "look" },
        { say: "+ Building puts a new one down: a house, a shop, a tavern, a church, a warehouse.", sel: ".cebar [data-t='add']", act: "look" },
        { say: "+ Road, + Wall and + Gate, + Park and + Square: click along the line or round the edge, then Finish. What stood in the way is cleared.", sel: ".cebar [data-t='road']", act: "look" },
        { say: "+ District marks a quarter and who holds it, in that faction's colour.", sel: ".cebar [data-t='district']", act: "look" },
        { say: "+ Person puts one of your people in the city: choose who, say what they are doing there if you like, and click where they are. They show on the map whenever the city is open; click one to move them or take them away.", sel: ".cebar [data-t='person']", act: "look" },
        { say: "A chosen building can become one of your own places: Make it a place opens the new place with the building's kind, size, floors and colours, standing where the building stands; Put it here sets it in, ready for its maps, people and clues.", sel: ".cebar [data-t='select']", act: "look" },
        { say: "With a building chosen, Ask for a change: say what it should be, and see what that replaces and what it keeps before you make the change.", sel: ".cebar [data-ce='ask']", act: "look", optional: true },
        { say: "Undo and Redo take back any change; Copy the changes gives them to the campaign. Nothing else in the city moves.", sel: ".cebar [data-ce='undo']", act: "look" },
        { say: "Done puts the tools away.", sel: ".cebar [data-ce='done']", act: "click", auto: true },
        { say: "+ Add location makes a place of your own anywhere in the city, with its maps, people and clues. In a real city nothing new is built: you click which of its own buildings the place is in, the one under the pointer lights up, and it stays as it stands.", sel: "[data-addloc]", act: "look" }
      ] },
      { id: "galaxy", module: ["stars"], title: "The star chart", summary: "A galaxy of hundreds of systems: open a system and its worlds, plot a course, keep the players' charts.", features: ["galaxy", "systems", "starship", "charts", "scanning", "worldlife"], needs: has("#v-galaxy"), steps: [
        { say: "A campaign among the stars has its galaxy: every system grown from one seed, the same every time.", sel: "#v-galaxy", act: "click", try: "Click Star chart.", wait: 900 },
        { say: "Drag to move and scroll to come closer: sectors, the powers' territories, the lanes, charted space, and the dangerous and restricted regions.", sel: "#galaxyv .gx-canvas", act: "look" },
        { say: "The ship: where it is, its fuel and how far it can jump.", sel: "#galaxyv [data-gx='ship']", act: "click", try: "Click The ship.", wait: 700 },
        { say: "Click any star to see its system. Open it to see its worlds, each drawn as pixel art from what it is (seas only of its own liquid, none on a dry world), and a world to see all it is, turning in its card: its air, gravity, warmth, life, and whether anyone can land.", sel: "#galaxyv .gx-side", act: "look" },
        { say: "Every world is worked out from its physics: its star, its orbit, its mass and what it is made of give its gravity, its air, its warmth, its seas or their absence, its winds and whether life began there. The whole profile says why each is so, and marks what science has not settled.", sel: "#galaxyv .gx-prof", act: "look", optional: true },
        { say: "A world you can land on opens its surface: the whole globe, made from its own physics the first time (a few minutes) and kept, in its own colours. Craters where no air or water wears them away, no rivers where nothing liquid runs, great volcanoes and rifts on a world whose crust does not move, warmth round the point under its star on a world locked to it. It opens in the world map, where you add places as on any world.", sel: "#galaxyv [data-gx='surface']", act: "look", optional: true },
        { say: "A large moon you could stand on opens its surface the same way: under Its large moons in the whole profile, each named after its planet with a Roman numeral.", sel: "#galaxyv [data-gx='surface'][data-m]", act: "look", optional: true },
        { say: "What the players know of a world grows as they scan it: seen from afar, scanned from orbit, then surveyed on the ground. Scan it moves their knowledge on, and the world's time by the hours it takes; the ship's sensors set how many.", sel: "#galaxyv [data-gx='scan']", act: "look", optional: true },
        { say: "Show them the survey sheet puts what they know of the world on their screen, its globe beside its readings, and keeps it among their handouts. Their star chart lists the worlds they have scanned, with only what they learned.", sel: "#galaxyv [data-gx='survey']", act: "look", optional: true },
        { say: "Under it: the weather tonight from its own air and winds (Another night for the next), its own day and year and the date there now, and its history, roughly, from what it is.", sel: "#galaxyv .gx-extra", act: "look", optional: true },
        { say: "Plot a course and Atlas gives the jumps, the fuel, the days and the dangers on the way; making the jump moves the world's time on.", sel: "#galaxyv .gx-side", act: "look" },
        { say: "And what the players' charts show of each system: charted, rumoured, visited, or kept from them. Their screen shows only what is on their charts.", sel: "#galaxyv .gx-side", act: "look" }
      ] },
      { id: "galaxybuild", module: ["stars"], title: "Changing the galaxy", summary: "Add and move systems, draw regions, lanes and trade routes, paint territories, change any world or work it out again; undo any of it.", features: ["galaxyedit", "askchange", "planeteditor"], needs: has("#v-galaxy"), steps: [
        { say: "The galaxy grows from its seed, and then it is yours to change.", sel: "#v-galaxy", act: "click", try: "Click Star chart.", wait: 900 },
        { say: "Edit the galaxy opens its tools.", sel: "#galaxyv [data-gx='tools']", act: "click", try: "Click Edit the galaxy.", wait: 500 },
        { say: "Add a system, a region (dangerous, restricted, charted or unexplored), a lane, a trade route or a corridor with a length of its own, or a sector. Paint territory gives stars to a power: drag over them.", sel: "#galaxyv .gx-tools", act: "look" },
        { say: "Sectors and powers: rename them, take them away, or add a power.", sel: "#galaxyv [data-gx='panel']", act: "look" },
        { say: "A star's card changes it: its name, its star, what is there, who holds it, where it stands. Courses follow every change.", sel: "#galaxyv [data-gx='ship']", act: "click", auto: true, wait: 600 },
        { say: "Open the system to change any world, take one away, or add worlds, stations, facilities, derelicts and belts. Atlas says what would not hang together, and lets it be: it is your setting.", sel: "#galaxyv [data-gx='open']", act: "click", auto: true, wait: 600, optional: true },
        { say: "Work it out again changes what a world is made of or where it lies (its orbit, its mass, its water, its iron), or sets its insides, its air or its life, and the rest follows from its physics. What would change is listed, with why, before you keep it. Randomise makes another world for that orbit, of the kind you keep if its star allows one; As it was made brings it back.", sel: "#galaxyv [data-gx='phys']", act: "look", optional: true },
        { say: "A star's card also has Ask for a change: say what should change (its details, who holds it, a world or a station added) and see what it would replace and keep before anything changes.", sel: "#galaxyv [data-gx='ask']", act: "look", optional: true },
        { say: "Undo and Redo take back any change; Copy the changes gives them all back to the campaign.", sel: "#galaxyv [data-gx='undo']", act: "look" },
        { say: "Edit the galaxy again puts the tools away.", sel: "#galaxyv [data-gx='tools']", act: "click", auto: true }
      ] }
    ] },
    { id: "table", title: "Game night", lessons: [
      { id: "screen", module: ["players"], title: "The players' screen", summary: "A window for the players: maps a room at a time, handouts, faces, the fog of war.", features: ["players-screen", "fog", "fog3d", "players-copy", "phones", "journal"], needs: has("#v-table"), steps: [
        { say: "At the table holds the tools for game night.", sel: "#v-table", act: "click", try: "Click At the table.", wait: 500 },
        { say: "The players' screen is a window of its own for the television or a second screen, with nothing of yours on it.", sel: "[data-t='tab'][data-tab='screen']", act: "click", try: "Click Players' screen.", wait: 500 },
        { say: "Open it, drag it onto the television, and choose what they see from here.", sel: "[data-t='openscreen']", act: "look" },
        { say: "Maps go to them a room at a time. In caves you brush the fog away as they explore, flat or in 3D.", sel: ".t-fog, .t-fog3d", act: "look" },
        { say: "With the Atlas app, players can also follow on their own phones: switch it on and show them the QR code.", sel: ".t-lan", act: "look", optional: true },
        { say: "The players' journal: choose how much Atlas keeps for them, from their own notes only to quests, hints and a timeline. Only what they found, or what you give them, is ever in it.", sel: "#tvBody .t-journal", act: "look" }
      ] },
      { id: "dock", title: "The quick tools", summary: "Dice, a person on the spot, ideas when they're stuck, questions, the copilot: always at the bottom right.", features: ["dock", "dice", "person", "stuck", "ask"], needs: has("#tDock"), steps: [
        { say: "These quick tools are on every page, at the bottom right.", sel: "#tDock", act: "look" },
        { say: "Dice for any roll.", sel: "#tDock [data-dock='dice']", act: "click", try: "Click Dice.", wait: 500 },
        { say: "A person made up on the spot: a name for the story's age, a look, a want, a secret.", sel: "#tDock [data-dock='person']", act: "click", try: "Click A person.", wait: 500 },
        { say: "When the table goes quiet: ways back into the story, from what is still open.", sel: "#tDock [data-dock='stuck']", act: "click", try: "Click Stuck?", wait: 500 },
        { say: "A question about the campaign, answered from its own words.", sel: "#tDock [data-dock='ask']", act: "click", try: "Click Ask.", wait: 500 },
        { say: "Close the panel with the toolbar button again, or Escape.", sel: "#tDock [data-dock='ask']", act: "click", auto: true }
      ] },
      { id: "copilot", module: ["copilot"], title: "The copilot", summary: "A person's answer to what a player said, in their voice and from only what they know.", features: ["copilot", "talk", "improvise", "memory"], needs: has("#tDock [data-dock='talk']"), steps: [
        { say: "Talk is the copilot, for when a player says something you did not plan for.", sel: "#tDock [data-dock='talk']", act: "click", try: "Click Talk.", wait: 500 },
        { say: "Choose who they are talking to.", sel: "#tPop select[data-cp='who']", act: "look" },
        { say: "Type what the player said. The answer comes in that person's voice, from only what they know: they may lie, dodge or bargain. Change it, ask for another or a different tone, and keep it in their memory only if you say so.", sel: "#tPop .cp-ask, #tPop .cp-talk", act: "look" },
        { say: "Improvise helps with the rest: a place to describe, a reaction, what follows, what happens next, and whether something fits.", sel: "#tPop [data-cp='mode'][data-m='imp']", act: "click", try: "Click Improvise.", wait: 400 },
        { say: "And What do we remember?: anything from earlier sessions, answered from what the table remembers, with the session and the time where each thing was said, and what is fact, a claim, or only the players' idea.", sel: "#tPop .cp-host", act: "look" },
        { say: "Close it from the toolbar.", sel: "#tDock [data-dock='talk']", act: "click", auto: true }
      ] },
      { id: "recorded", module: ["recorded"], title: "Recorded sessions", summary: "Record the table; its words; what the campaign remembers of every session.", features: ["sessions", "tablememory"], needs: has("[data-t='tab'][data-tab='recorded']"), steps: [
        { say: "Recorded sessions: the table's own notes, which remember everything that matters, session after session.", sel: "[data-t='tab'][data-tab='recorded']", act: "click", try: "Click Recorded sessions.", wait: 600 },
        { say: "Read the table the few words about recording, tick that everyone agreed, and start. The sound is kept ten seconds at a time, so an interruption loses seconds, not the evening. A banner shows it is recording on every page, with Stop one click away.", sel: "#tvBody .sm-rec", act: "look" },
        { say: "In the Atlas app, a phone of its own can be the recorder: open the recorder link and point the phone at the code. It sends the sound to this computer as it records.", sel: "#tvBody [data-sm='linkon']", act: "look", optional: true },
        { say: "Or add a recording afterwards, from a phone's own recorder app; or its words alone, from any tool that writes them.", sel: "#tvBody input[data-sm='words']", act: "look" },
        { say: "Each session keeps what was said and who said it. Claude reads it and writes down what to remember: promises, threats, clues, fates, theories. You keep each one, change it, mark it unsure, or say it is not so. Only what you keep counts.", sel: "#tvBody .sm-sess, #tvBody input[data-sm='q']", act: "look" },
        { say: "Search everything said and remembered. Unfinished business, the promises and threats not yet settled, can be handed to the consequences to see what comes of it.", sel: "#tvBody input[data-sm='q']", act: "look" }
      ] },
      { id: "more", title: "Everything else at the table", summary: "Combat, making things up, the board, the players' characters, safety tools, and the printed book.", features: ["tablehome", "combat", "make", "board", "party", "safety", "export"], needs: has("#v-table"), steps: [
        { say: "At the table opens on Start here: every tool, with what it is for.", sel: "#v-table", act: "click", auto: true, wait: 400 },
        { say: "Start here: the two things a game night turns on, and every other tool as a card.", sel: "[data-t='tab'][data-tab='home']", act: "click", try: "Click Start here.", wait: 400 },
        { say: "Combat and dice: initiative, wounds and sanity, rolls in your game's rules.", sel: "[data-t='tab'][data-tab='combat']", act: "click", try: "Click Combat and dice.", wait: 400 },
        { say: "Make it up: a person or a small mapped place on the spot, and random tables.", sel: "[data-t='tab'][data-tab='make']", act: "click", try: "Click Make it up.", wait: 400 },
        { say: "The board: people, places and clues pinned to cork, with string between them. The players have their own, with only what they found.", sel: "[data-t='tab'][data-tab='board']", act: "click", try: "Click The board.", wait: 500 },
        { say: "The party: the players' characters, each woven into the story, and the players' own notes.", sel: "[data-t='tab'][data-tab='party']", act: "click", try: "Click The party.", wait: 400 },
        { say: "Safety: lines and veils, and the X-card the players can press on their screen.", sel: "[data-t='tab'][data-tab='safety']", act: "click", try: "Click Safety.", wait: 400 },
        { say: "Print and export: the whole campaign as a book, the handouts to print, and maps for Foundry and Roll20.", sel: "[data-t='tab'][data-tab='export']", act: "click", try: "Click Print and export.", wait: 400 }
      ] },
      { id: "tonight", title: "Tonight, clocks and handouts", summary: "The session sheet, the villains' clocks, and handouts drawn as the real thing.", features: ["tonight", "clocks", "handouts"], needs: has("#v-table"), steps: [
        { say: "Tonight: the session's plan, your notes, and a read-aloud Previously on.", sel: "[data-t='tab'][data-tab='tonight']", act: "click", try: "Click Tonight.", wait: 500 },
        { say: "Clocks: what each villain is doing while the party investigates. Tick them as the world moves.", sel: "[data-t='tab'][data-tab='clocks']", act: "click", try: "Click Clocks and stuck.", wait: 500 },
        { say: "Handouts, drawn as the letters and newspapers they are, go to the players' screen with one click.", sel: "[data-t='tab'][data-tab='screen']", act: "click", auto: true }
      ] },
      { id: "time", module: ["living"], title: "The world's time", summary: "The date in the story, events that wait for your yes, and news for the players.", features: ["worldtime", "events", "news"], needs: has("[data-t='tab'][data-tab='time']"), steps: [
        { say: "The world moves while the party investigates.", sel: "#v-table", act: "click", auto: true, wait: 400 },
        { say: "The world's time: the date in the story, what is coming, and what waits for you.", sel: "[data-t='tab'][data-tab='time']", act: "click", try: "Click The world's time.", wait: 500 },
        { say: "Move time on as the story does: a conversation, a night's rest, a day's journey.", sel: "#tvBody .tw-adv", act: "look" },
        { say: "Events come due at their hour, or when what they wait on happens: a clue found, a place reached, a clock filled. Small ones happen by themselves; anything that could change the campaign waits for you. An event whose reason is gone is called off.", sel: "#tvBody .tw-due, #tvBody .tw-ev", act: "look" },
        { say: "Plan an event of your own: when, what it waits on, what calls it off, its hidden cause, and what the players hear.", sel: "#tvBody [data-tw='new']", act: "click", try: "Click Plan an event.", wait: 500 },
        { say: "Cancel for now.", sel: "#tvBody [data-tw='cancel']", act: "click", auto: true, wait: 300 },
        { say: "Or ask the council: it suggests what the world does next, from the campaign's own words. Nothing is added until you say so.", sel: "#tvBody .tw-council", act: "look" },
        { say: "What you let the players hear goes to their screen as news, with a word on it that it came. Send news of your own here too.", sel: "#tvBody .tw-own", act: "look" },
        { say: "Time is in the quick tools as well, with a count of what waits for you.", sel: "#tDock [data-dock='time']", act: "click", try: "Click Time.", wait: 500 },
        { say: "Close it from the toolbar.", sel: "#tDock [data-dock='time']", act: "click", auto: true }
      ] },
      { id: "dimensions", module: ["dimensions"], title: "Dimensions and planes", summary: "The planes beyond the world: their layers and maps, the ways between, where the sources disagree.", features: ["dimensions"], needs: has("[data-t='tab'][data-tab='dims']"), steps: [
        { say: "Dimensions: the planes beyond your world, from the campaign's cosmos.", sel: "[data-t='tab'][data-tab='dims']", act: "click", try: "Click Dimensions.", wait: 600 },
        { say: "The cosmology drawn: the world at the hub, the planes round it. A gold dot marks a plane whose sources disagree and wait for your choice. Click one to see it.", sel: "#tvBody .dm-wheel", act: "look" },
        { say: "Its card: what it is, its rules (how it looks, what it is like, what it does in play, each with its source or marked yours), and every fact tagged: canon, another edition, or added by Atlas.", sel: "#tvBody .dm-card", act: "look" },
        { say: "Where the editions disagree, Atlas never chooses: each answer with its source, and yours kept once you pick one, or your own.", sel: "#tvBody .dm-conf", act: "look", optional: true },
        { say: "Its layers, each a step down with its own map, made from its own recipe the first time and kept. The party is here tells the copilot which plane they are on and its rules; when they come home, the days they spent there move the world's time as that plane's time runs.", sel: "#tvBody .dm-layers", act: "look" },
        { say: "The ways between: portals, gates and crossings, who can use them, when and at what price; Go through opens the other side. And a traveller's warning to hand the players.", sel: "#tvBody .dm-card", act: "look", optional: true },
        { say: "Add a dimension from the lore, from your own words, or at random: what it would be is shown, with its layers and sources, before anything is kept.", sel: "#tvBody [data-dm='add']", act: "look" }
      ] },
      { id: "factions", module: ["living", "advanced"], title: "Factions and people", summary: "Who holds power, what they have and want, how they stand; where everyone is now.", features: ["factions", "lives"], needs: has("[data-t='tab'][data-tab='factions']"), steps: [
        { say: "Factions and people: the powers that act in your world, and where each important person is.", sel: "[data-t='tab'][data-tab='factions']", act: "click", try: "Click Factions and people.", wait: 600 },
        { say: "Each faction: who leads it, what it holds, what it has to act with, what it wants, and the step its plan is on. It can do no more than it has.", sel: "#tvBody .fa-card", act: "look" },
        { say: "How they stand toward each other, and toward the party. Change it when the story does; the world's events change it too, and undo it if you take them back.", sel: "#tvBody .fa-rels", act: "look" },
        { say: "And the people, now: where each one is at this hour of the world's time, by their day and their week. Move someone, or mark them missing, hurt or dead.", sel: "#tvBody .fa-people", act: "look" }
      ] },
      { id: "dashboard", module: ["living", "advanced"], title: "The world at a glance", summary: "The date, what waits for you, what is coming and has happened; how much the world does by itself.", features: ["dashboard"], needs: has("[data-t='tab'][data-tab='dash']"), steps: [
        { say: "The world at a glance: the date, what waits for your word, what is coming, what has happened lately, and what the factions and people are doing, on one page.", sel: "[data-t='tab'][data-tab='dash']", act: "click", try: "Click The world at a glance.", wait: 600 },
        { say: "How much the world does by itself. By hand: everything waits for you. Helped: small things happen, the big ones wait. On its own: only the critical waits.", sel: "#tvBody .db-modes", act: "look" },
        { say: "Whatever you choose, the safeguards hold: a death, a war or a place lost always waits for you, nothing reaches the players unless you tell them, and the world is saved before time moves on a day.", sel: "#tvBody .db-safe", act: "look" },
        { say: "Move time on from here, and answer what waits for you without leaving the page.", sel: "#tvBody .db-now .tw-adv", act: "look" }
      ] },
      { id: "history", module: ["living"], title: "The world's history", summary: "Everything that has happened, who knows of it; the world saved and gone back to.", features: ["history"], needs: has("[data-t='tab'][data-tab='history']"), steps: [
        { say: "The world's history: everything that has happened, newest first, with when, why, who, what came of it, and whether the players know.", sel: "[data-t='tab'][data-tab='history']", act: "click", try: "Click The world's history.", wait: 600 },
        { say: "Narrow it to one kind, one person or faction, one place, or what the players know.", sel: "#tvBody .hs-f", act: "look" },
        { say: "As the players know it: what they have seen, found and been told, in the words they heard it.", sel: "#tvBody .hs-pub", act: "look" },
        { say: "Save the world as it is before a big moment, and go back to it if the night goes wrong. Going back can be undone too, and what the party has found stays as it is.", sel: "#tvBody form[data-hs='snap']", act: "look" }
      ] },
      { id: "deeds", module: ["living", "advanced"], title: "Consequences", summary: "What the party did, and what comes of it: at once, in days, weeks later.", features: ["deeds"], needs: has("[data-t='tab'][data-tab='deeds']"), steps: [
        { say: "Consequences: when the party does something that matters, write it here.", sel: "[data-t='tab'][data-tab='deeds']", act: "click", try: "Click Consequences.", wait: 600 },
        { say: "What they did, where, who it touched and how it went. The council works out what follows at once, within days and weeks later, from who saw it and what they can do.", sel: "#tvBody form[data-dd='deed']", act: "look" },
        { say: "You let each one happen, change it, or say no. What follows later becomes an event of the world's time, and anything can be taken back.", sel: "#tvBody .dd-deed, #tvBody form[data-dd='deed'] .t-row", act: "look" }
      ] },
      { id: "money", module: ["money"], title: "Money and goods", summary: "The purse, what the party carries, loot, prices and merchants.", features: ["money"], needs: has("[data-t='tab'][data-tab='money']"), steps: [
        { say: "Money and goods: the party's purse, what they carry, loot, and prices, in the money of the story's age.", sel: "[data-t='tab'][data-tab='money']", act: "click", try: "Click Money and goods.", wait: 600 },
        { say: "Roll loot: coins, and things of the story's age, each common, uncommon, rare or legendary, made well or badly, whole or broken.", sel: "#tvBody [data-ec='roll']", act: "click", try: "Click Roll loot.", wait: 400 },
        { say: "The party takes it, or leaves it. What they take goes into the purse and what they carry, and into the world's history.", sel: "#tvBody .ec-loot", act: "look" },
        { say: "Simple keeps the usual prices. Full adds prices by place, merchants whose stock comes back as time passes, and what moves prices: a war, a famine, an event.", sel: "#tvBody [data-ec='mode']", act: "look" }
      ] }
    ] },
    { id: "story", title: "The story", lessons: [
      { id: "investigation", module: ["investigation"], title: "The investigation", summary: "Clues on the map, what joins them, who knows what.", features: ["investigation", "clues", "knowledge", "autoconnect"], needs: has("[data-t='tab'][data-tab='clues']"), steps: [
        { say: "The investigation: every clue, what joins it to the story, and who knows what.", sel: "[data-t='tab'][data-tab='clues']", act: "click", try: "Click Investigation.", wait: 600 },
        { say: "Each person's page records what they know and how they learned it, and Speak as them answers from only that.", sel: "#tvBody", act: "look" }
      ] },
      { id: "consistency", module: ["consistency"], title: "Is it consistent?", summary: "What does not fit together, with its evidence and how to mend it.", features: ["consistency"], needs: has("[data-t='tab'][data-tab='consistency']"), steps: [
        { say: "Consistency checks the campaign for what does not fit together: clues that lead nowhere, rooms nobody can reach, someone who knows what they were never told.", sel: "[data-t='tab'][data-tab='consistency']", act: "click", try: "Click Consistency.", wait: 600 },
        { say: "Each finding has its evidence. Mend it, ask Claude for a fix, or mark it intentional: a lie or a mystery on purpose.", sel: "#tvBody", act: "look" }
      ] },
      { id: "bible", title: "The story and its music", summary: "The council's story bible, and the music made for every place.", features: ["bible", "music"], steps: [
        { say: "The story: the council's bible, the judge's grades, and the story as you gave it.", sel: "#v-story", act: "look", optional: true },
        { say: "Every place has its own music, made by the page itself. Play it from here.", sel: ".musicbar, #v-music", act: "look" },
        { say: "That is Atlas. Help and tutorials is always here for any lesson again.", sel: ".tu-helpbtn", act: "look" }
      ] }
    ] }
  ];
  // the features of the page, each taught by a lesson (the library's index; the coverage check's list)
  const FEATURES = {
    gazetteer: ["The Gazetteer", "views places list book"], search: ["Search", "find word name"], views: ["The views", "gazetteer table world story music"], help: ["Help and tutorials", "tutorial lesson help"],
    playersafe: ["Player-safe view", "secrets players safe"], dossier: ["A place's page", "dossier place page people clues"], floors: ["Floors", "floor level storey"], mapviews: ["Player view and your view of a map", "player view markers"],
    fullsize: ["Full size", "big map"], room3d: ["Rooms in 3D", "3d room view"], mapeditor: ["The map editor", "edit map rooms doors stairs"], mapmarks: ["People, dangers and secrets on the map", "npc marker person encounter danger secret place map editor"], furnish: ["Furnishing rooms", "furniture models furnish"], models: ["The model library", "models 3d library glb"],
    caves: ["Caves", "cave generator dungeon mine"], riddles: ["Riddles and puzzles", "riddle puzzle answer"], traps: ["Traps", "trap disarm"],
    worldland: ["Kinds of land", "biome terrain forest jungle savanna desert dunes tundra glacier volcano mesa canyon marsh swamp reef lake lava enchanted corrupted floating mountains alien brush size slider climate new world generate size planet paint painter sketch drawing picture upload colour key preset landmasses islands archipelago pangaea continents land share"],
    worldmap: ["The world map", "world map realm travel worlds planet moon plane layer which world"], oceancurrents: ["The ocean's currents", "ocean currents warm cold gyre equator latitude upwelling sea temperature"], geocoasts: ["Coasts shaped by their history", "coasts coastline fjord skerry ria estuary delta dalmatian cliff barrier island dune marsh mangrove reef atoll beach why"], modules: ["What this campaign uses", "modules features parts switch off on preset minimal detective sandbox fantasy science fiction everything gear settings my own"], roadnet: ["The road network and its development", "roads road network trade routes towns villages paths bridges fords ferries passes tunnels borders states development slider tribal medieval modern highways"], galaxy: ["The star chart", "galaxy stars sectors space map planets physics gravity atmosphere habitable landable surface globe moons rings tidally locked craters pixel art turning"], scanning: ["Scanning worlds, the survey sheet", "scan scanning sensors survey sheet orbit afar ground what the players know handout readings"], worldlife: ["A world's weather, day, year and history", "weather tonight wind storm dust rain night day year calendar date local history formed seas froze lost air life"], dimensions: ["Dimensions and planes", "dimensions planes plane cosmology great wheel world axis layers nine hells feywild shadowfell astral elemental abyss portal gate edition sources canon variant lore choose traveller warning blood war"], planeteditor: ["Working a world out again", "planet editor work out again orbit mass water iron insides air pressure gas life randomise kind consequences what would change as it was made"], systems: ["Star systems and worlds", "system planet world star moon gravity atmosphere habitable"], starship: ["The ship, courses and fuel", "ship fuel jump warp course travel refuel"], charts: ["The players' star charts", "charts charted explored scanned rumoured"], galaxyedit: ["Changing the galaxy", "edit galaxy system region lane trade route corridor sector power territory paint world planet station belt undo"], maplook: ["How the world map is drawn", "style painted colour parchment atlas survey engraved hydrographic relief print paper streams valleys shaded"], worldedit: ["Editing the world map", "places routes journey duplicate"], cityedit: ["Editing the city", "city edit building move turn remove house shop tavern church road wall gate park square plaza district faction undo"], askchange: ["Asking for a change", "ask change claude regenerate replace redraw inside interior building place rename outside words confirm what it replaces keeps undo bring back"], trail: ["Where a place is, and back up", "trail breadcrumb back up parent map world city stars system where navigation"], citypeople: ["People in a city, a building made a place", "people person npc cast street city where make place building location"], realplaces: ["Places in a real city", "real city modern add location own building existing streets unchanged london new york tbilisi"], worldbuild: ["Shaping the world", "land brush sea lake mountains forest desert swamp river realm kingdom territory province faction name label undo redo"],
    "players-screen": ["The players' screen", "television second screen players window"], fog: ["Fog of war", "fog brush reveal"], fog3d: ["Fog of war in 3D", "3d fog"], "players-copy": ["The players' copy", "players copy secrets"], phones: ["Players' phones", "phone qr wifi"],
    dock: ["The quick tools", "toolbar dock"], dice: ["Dice", "roll dice"], person: ["A person on the spot", "npc generator name"], stuck: ["They're stuck", "stuck ideas"], ask: ["Ask the campaign", "question answer"],
    copilot: ["The copilot", "copilot ai help"], talk: ["Talk as a character", "npc dialogue voice answer"], improvise: ["Improvise", "describe reaction consequence encounter"], memory: ["What a character remembers", "memory remember knowledge"],
    tonight: ["Tonight's sheet", "session notes previously"], clocks: ["Villains' clocks", "clock tick"], handouts: ["Handouts", "handout letter newspaper"],
    worldtime: ["The world's time", "clock calendar date day hour time pause"], events: ["World events", "event plan happens approve due notification council suggest called off"], news: ["News for the players", "news told players notification"], facility: ["A facility's systems", "power oxygen pressure temperature contamination security structure comms emergency station ship lab survival"],
    journal: ["The players' journal", "journal notes theories quests hints summaries manual assisted full"],
    factions: ["Factions", "faction power house guild government corporation stance allies enemies territory plan"], lives: ["Where everyone is", "schedule day week home work where now status missing"],
    sessions: ["Recorded sessions", "record recording microphone phone audio transcript words speakers consent upload whisper session library"], tablememory: ["What the table remembers", "memory remember promise threat clue theory unfinished business recall cite session timestamp keep unsure"],
    dashboard: ["The world at a glance", "dashboard overview glance mode manual assisted autonomous by hand helped on its own safeguards approve waiting"], history: ["The world's history", "history timeline record past filter snapshot save moment go back rollback players know"],
    deeds: ["Consequences", "consequence deed party did reaction follows simulator council days weeks"], money: ["Money and goods", "money loot treasure purse stash prices merchant shop buy sell economy rarity quality condition coins gold credits"],
    investigation: ["The investigation", "clues connections"], clues: ["Clues", "clue evidence"], knowledge: ["Who knows what", "knowledge"], autoconnect: ["Auto-Connect", "connect suggest"],
    consistency: ["Consistency", "contradiction check fits"], bible: ["The story bible", "story council tolkien"], music: ["Music", "music theme sound"],
    tablehome: ["Start here", "game night overview tools"], combat: ["Combat and dice", "initiative wounds sanity combat"], make: ["Make it up", "random tables person place"], board: ["The board", "corkboard string conspiracy"],
    party: ["The players' characters", "party pcs notes"], safety: ["Safety tools", "lines veils x-card"], export: ["Print and export", "book print vtt foundry roll20"]
  };
  // what in the page each feature is: the tabs of At the table, the quick tools, the views, the map editor's tools, the world
  // map's buttons. dev/tutorial-coverage.js finds every one of these in the engine; one with no feature here, or a feature
  // no lesson teaches, fails it: a new tool is not finished until it has its lesson.
  const COVERS = {
    tab: { dims: "dimensions", home: "tablehome", screen: "players-screen", tonight: "tonight", clocks: "clocks", combat: "combat", make: "make", ask: "ask", board: "board", party: "party", safety: "safety", export: "export", clues: "investigation", copilot: "copilot", consistency: "consistency", time: "worldtime", factions: "factions", dash: "dashboard", history: "history", deeds: "deeds", money: "money", recorded: "sessions" },
    dock: { dice: "dice", person: "person", stuck: "stuck", ask: "ask", talk: "talk", time: "worldtime", screen: "players-screen" },
    view: { gaz: "gazetteer", table: "views", world: "worldmap", worldsel: "worldmap", galaxy: "galaxy", story: "bible", music: "music" },
    tool: { select: "mapeditor", room: "mapeditor", door: "mapeditor", stairs: "mapeditor", erase: "mapeditor", carve: "caves", terrain: "caves", traps: "traps", riddles: "riddles", furnish: "furnish", clues: "clues", marks: "mapmarks" },
    world: { currents: "oceancurrents", curnames: "oceancurrents", coasts: "geocoasts", roadnet: "roadnet", devreset: "roadnet", netenter: "roadnet", askloc: "askchange", newworld: "worldbuild", brush: "worldbuild", base: "worldbuild", river: "worldbuild", realm: "worldbuild", label: "worldbuild", finish: "worldbuild", undo: "worldbuild", redo: "worldbuild", editfeat: "worldbuild", dupfeat: "worldbuild", delfeat: "worldbuild", resetfeat: "worldbuild", duploc: "worldedit", edit: "worldedit", addloc: "worldedit", addroute: "worldedit", export: "worldedit", copy: "worldedit", editloc: "worldedit", editroute: "worldedit", delloc: "worldedit", delroute: "worldedit", resetloc: "worldedit", resetroute: "worldedit", plan: "worldedit", setoff: "worldedit", arrive: "worldedit", cancel: "worldedit", partyhere: "worldedit", enter: "worldmap", make: "worldmap", drawn: "maplook", close: "worldmap", dlgclose: "worldmap" }
  };
  // where in the page each feature lives, for the little ? beside it (contextual help): [selector, feature]
  const ANCHORS = [[".lmap-sec .lm-bar", "mapviews"], ["#meDlg .me-tools", "mapeditor"], [".wm-bar", "worldmap"], ["#tablev .tv-acts", "players-screen"], [".cp-host", "copilot"], [".cc-top", "consistency"], ["#tvBody .tw-now", "worldtime"], ["#tvBody .db-modes", "dashboard"]];
  A.tutorialData = { version: 1, chapters, FEATURES, ANCHORS, COVERS };
})(window.ATLAS || (window.ATLAS = {}));
