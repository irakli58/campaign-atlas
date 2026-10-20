# Data format

A campaign is a folder: `campaign.js` (settings and the cast), `city.js` (the map of the whole, written by `atlas.js city`; its format is in `cities.md`), `table.js` (the clocks, the session plan, the players' characters and the rest for the table: `table.md`), `places/*.js` (one file per place, read in file-name order; names starting with `_` are skipped), `story/` (the user's story, the council's transcript, the bible), `canon.md` and `checklist.md`. `build` writes `dist/`.

## Contents

1. A place
2. The map: floors, rectangles, doors, items, stairs, markers
3. Rooms, clues, people, secrets, encounters
4. Bigger versions: `expand`
5. Campaign settings (`campaign.js`)
6. Floor kinds, items and furnishing presets
7. For the table

## 1. A place

```js
ATLAS.place("old-mill", {
  name: "The Old Mill",          // shown everywhere
  category: "scene",             // an id from config.categories; groups the index
  region: "Fenwick Lane",        // district, deck, quarter
  acts: [1, 3],                  // a number, a list or a string; display only
  start: true,                   // the story opens here: needs no inbound lead
  tier: 1,                       // 1 the story cannot run without it, 2 the trail passes through it, 3 colour. Sets how big it must be (standards.md)
  tagline: "One sentence for the index.",
  at: [204, 98],                 // where it stands on the city map, in plan units; or landmark: "Name" (it IS that landmark); or leave both out and let region place it; or offmap: true
  model: "town",                 // the building it wears on the city map ("church", ["hall", 4], ...; see: atlas.js catalogue)
  city: "harrowgate",            // a campaign with several cities: the one it stands in (cities/<id>.js; city.js is "main", the default)
  location: "barrow",            // or the world map's location it is in, when that location has no 3D map (references/world.md)
  badge: "II",                   // a short GM-only mark on its pin
  music: "crypt",                // the theme this place plays (a mood; see: atlas.js catalogue). Without it the mood is guessed from the name.
                                 // Or music: { mood: "crypt", also: { "The search": "dread", "Out by the drain": "chase" } }: the suggested
                                 // song, and the song for each moment here (named as its scene is), shown at the top right of the place.
                                 // Without also, the moments' songs are guessed from the place's encounters.
                                 // link: "https://...", title: "..." gives the place a song of the user's own (YouTube, Spotify, a music file
                                 // on the web), when they hand one over; the referee can also choose their own on the page
  leads: [{ to: "harbour-office", why: "The carter's route ends there." }],   // rare: a lead that is not a clue or a person
  intensity: 3, content: ["violence"],   // how hard it hits, 1 to 5, and what it holds (table.md, section 10)
  tables: { "Overheard here": ["...", "..."] },   // random tables of its own (table.md, section 9)
  map: { ... },                  // omit to list a place that is not mapped yet
  expand: [ { ... }, { ... } ],  // optional bigger versions, each built on the one before
  guide: { ... }                 // optional overlay; see section 3
});
```

The id (`"old-mill"`) is lowercase with hyphens. It is the page's link (`#old-mill`) and what `to` fields point at.

## 2. The map

```js
map: {
  ov: "GM overview.",  run: "How to run it.",  ext: "Exterior, read aloud.",
  entry: ["R1"],        // rooms that count as ways in, when the map has no open ground
  start: 0,             // which floor shows first
  compass: false,       // hide the north arrow on this map
  floors: [ { n: "GROUND FLOOR", w: 24, h: 16, note: "Floor note (GM).", gm: 0, R: [], D: [], I: [], ST: [], M: [] } ],
  rooms: {}, clues: {}, npcs: {}, secrets: {}, enc: {}
}
```

Coordinates are in squares; `x` runs right and `y` runs down from the top-left corner. Every floor of a building should use the same `w` and `h` so stairs line up. Floor names must be unique within a place; stairs and floor notes refer to them. `gm: 1` makes a whole floor GM-only.

### R: rectangles

`[id, x, y, w, h, name, kind, opts]`

- `id`: `R` plus a number for a room (it gets a number on the map and an entry in the guide). Anything else (`st`, `yard`, `rk`) is ground or filler and needs no entry.
- `x, y, w, h`: whole squares.
- `name`: the label drawn on the map. Use `""` for unlabelled filler.
- `kind`: the floor (section 6). Required on every rectangle.
- `opts` (all optional):
  - `h: 1` hidden: GM only. Absent from the players' map.
  - `fx: "kitchen"` furnish with a preset; `bk: "n" | "e" | "s" | "w"` the wall the furniture backs onto (default north).
  - `b: "tag"` building tag: a wall between rooms with different tags is drawn thick, as between two houses.
  - `nw: 1` no automatic windows.
  - `l: [x, y]` where to centre the label, in squares.

Several rectangles may share an id to make an L-shaped or T-shaped room; give the name to the first only. Later rectangles draw over earlier ones, so order matters: ground first, buildings after, a hidden room after the room it is carved from.

Walls are drawn automatically: thick where a room meets open ground, solid rock, nothing, or another building; thin between two rooms of one building. Windows appear on walls facing open ground unless the kind or the room says otherwise.

### D: doors

`[x, y, "h" | "v", type, length, side]`

- `"h"`: the door lies on the **top** edge of square (x, y) and runs right for `length` squares. It joins the square above to square (x, y).
- `"v"`: the door lies on the **left** edge of square (x, y) and runs down. It joins the square to the left to square (x, y).
- `type`: `d` door, `dd` double doors (use length 2), `a` open archway, `g` gate, `s` secret door (GM only), `w` a window drawn where you want one.
- `length` defaults to 1. `side` (1 or -1) flips which way the leaf swings.

A door must separate two different areas, at least one of them a room. Open ground joins open ground without a door.

### I: items

`[code, x, y, w, h, rotation, gmOnly, colour]`

Position and size in squares; fractions are fine (`["desk", 4.2, 3.1, 1.6, 1.2]`). An item is drawn with its back to the top; `rotation` is 0, 90, 180 or 270. Put `1` in the seventh slot to show an item to the GM only. The eighth slot recolours items that take a colour (`rug`, `heap`, `fig`, `box`, `disc`, `vehicle`). Items inside a hidden room never show on the players' map.

### ST: stairs

`[id, x, y, w, h, "up" | "down", "NAME OF THE FLOOR IT GOES TO", direction, name]`

Put the same id on both floors, on the same squares, one `"up"` and one `"down"`. `direction` (`n`, `e`, `s`, `w`) is which way the arrow points; `name` ("Cellar steps") is given once. Lifts, ladders and shafts are stairs too.

### M: markers

`[id, x, y]`, the centre of the disc in squares. The letter decides the list the entry lives in: `C` and `K` (and any letter you add) in `clues`, `N` in `npcs`, `S` in `secrets`, `E` in `enc`. Draw the marker inside the room named by the entry's `at`.

## 3. Rooms, clues, people, secrets, encounters

```js
rooms: {
  R1: { d: "...", pur: "...", atm: "...",               // shown to players: no secrets
        obj: "...", chk: "...", kp: "...",              // GM only
        who: "...", now: "...", find: "...", act: "...", cl: "...", sec: "...", dz: "...", cn: "...", n: "Full name if the label is short" }
}
```

`check` requires `d`, `pur`, `obj`, `chk` and `atm` for every room, and notes rooms without `kp`. The page adds, on its own: the clues, people, secrets and encounters whose `at` is this room, and the room's connections worked out from the doors and stairs.

```js
clues:   { C1: { t: "Title", at: "R2", p: "in the desk", d: "What it is.", how: "How it is found.", rev: "What it reveals.", hint: "What the referee does if the players miss it.", to: "other-place",
                 roll: "Spot Hidden", rescue: "How it reaches them if they miss it.", handout: { kind: "letter", date: "...", to: "...", text: "...", from: "..." } } },   // table.md
npcs:    { N1: { n: "Name, role", at: "R2", look: "...", manner: "How they act.", voice: "...", bg: "Their story.", ties: { okafor: "How they know her.", "Joss Hale": "How they know him." },
                 doing: "...", want: "...", knows: "...", secret: "...", lie: "...", press: "What makes them talk.", rev: "What they will reveal, and to whom.", to: "other-place" },
           N2: { who: "okafor", at: "R3", doing: "...", knows: "...", rev: "..." } },      // one of the cast: named and described there
secrets: { S1: { t: "Title", at: "R2", acc: "How it opens.", dest: "Where it leads.", why: "Why it exists." } },
enc:     { E1: { t: "Title", at: "R1", d: "What happens, when, what it costs.", roll: "Dodge", stats: { ... }, count: 3 } }   // stats: the game's own numbers (table.md, section 7); a person may have stats too
```

`to` (a place id or a list of them) is a lead. `at` is a room id, or the id of a piece of ground. `check` requires a `hint` on every clue of a tier 1 place that has a `to`, and, for every person in every place, the four things every person has (their own or the cast's): `look` (what they look like), `bg` (their story), `manner` (how they act) and `ties` (who they know).

**Ties** are the web of the story: `ties: { okafor: "her doctor; owes her his wife's last good year", "Bram Tellis": "drinks with him; suspects him" }`. A key is one of the cast's ids, or anyone else's name written as their `n` gives it (before the comma). The page shows each person's ties with links to the place where that person is met, and under **Named by** the people elsewhere who name them, so the web reads both ways. A sentence (`ties: "..."`) is allowed when the ties are not worth naming one by one; a key that looks like an id but is nobody in the cast is noted by `check`.

**The cast.** The people the story turns on are described once, in `campaign.js`, and shown in full on the People tab with the places they are met in:

```js
ATLAS.cast({
  okafor: { n: "Dr. Adaeze Okafor", role: "Chief of the medical ring", look: "What they look like.", manner: "How they act.", voice: "How they speak.", bg: "Background.",
            ties: { "Petra Lindqvist": "How they know her." }, want: "What they want.", secret: "What they hide.", lie: "The lie they tell.", press: "What makes them talk.", fate: "What becomes of them.", offstage: false }
});
```

`check` requires `n`, `look`, `bg`, `manner`, `ties`, `want`, `secret` and `press`, and notes a cast member who is met nowhere (`offstage: true` silences that for someone never seen).

**The guide overlay.** `guide: { ov, floors: { "FLOOR NAME": "note" }, rooms: { R1: { ... } } }` lays extra text over the map's own: its room fields win over `map.rooms`, its floor notes fill in floors without a `note`, and its `ov` joins `run`. A new campaign does not need it; write everything in `map`. It exists so a guide can be added to maps that were drawn first.

## 4. Bigger versions: `expand`

Each entry enlarges the version before it. The page shows size buttons, and the viewer's choice is remembered.

```js
expand: [{
  label: "Larger",                     // button text (defaults: Larger, Largest, Huge)
  grow: [left, top, right, bottom],    // squares added on each side of every floor
  growF: { 2: [0, 0, 0, 0] },          // a different amount for one floor, by index
  nostretch: true,                     // do not stretch edge-touching ground into the new squares
  ov: "What the bigger map adds.",     // appended to the overview
  floors: {                            // additions to existing floors, by index, in the NEW coordinates
    0: { R: [], D: [], I: [], ST: [], M: [], drop: ["R7"], dropD: [[8, 3, "v"]], dropI: [["fence", 14.75, 14]], n: "NEW NAME", note: "New note." }
  },
  add: [ { n: "THE CELLAR", w: 30, h: 22, R: [], ... } ],   // whole new floors
  order: [2, 0, 1, 3],                 // floor button order, if the automatic one is wrong
  rooms: {}, clues: {}, npcs: {}, secrets: {}, enc: {}       // merged over the earlier ones
}]
```

`grow` shifts everything already on the map right by `left` and down by `top`; your additions are written in the new coordinates. Ground kinds marked "stretch" (streets, grass, rivers, rock...) that touched an old edge are extended to the new edge.

## 5. Campaign settings

`standards: { 1: { rooms: 24, floors: 2 }, 2: { rooms: 10 } }` changes what a tier requires for this campaign (rooms, floors, secrets, clues, people, encounters, inbound); say why in a comment. The city map is not configured here: see `cities.md`.

**Music.** Every place plays its own theme, made in the browser as it plays (no sound files). A theme is a *mood* (what the place is: `crypt`, `market`, `docks`, `library`, `chase`...; `atlas.js catalogue` lists all of them) in a *flavour* (the style). The default flavour is `arkham`: the dark-mystery, orchestral horror score the user asked for (slow piano and harp figures over low strings, a solo cello answering the piano, voices, a celesta, high strings shivering into a deep drum). Every other style has a band of its own time and place (the user asked that each style "should have the instruments which they had" in its era):

| Style | Its band |
|---|---|
| `medieval` | lute, recorder, portative organ, a hurdy-gurdy droning; the vielle in the tavern, the shawm in the market, the busine and nakers in battle, plainchant in church and crypt; tabor and frame drum; chords of bare fifths in the church modes, grace notes |
| `industrial` | 1840 to 1910: upright parlour piano, clarinet, string quartet, harmonium, double bass; barrel organ in the street, a violin waltz in the tavern, a brass band (cornet, tuba, drums) on parade |
| `wartime` | 1914 to 1945: a lone violin over strings, an old upright piano, a cello in the dark places, double bass; accordion and clarinet in cafés and streets, tango and polka; military snare and bass drum; men's voices |
| `modern` | felt piano, electric guitar through an echo, Rhodes, vibraphone, warm analogue pads, sub bass; a laid-back drum machine, trailer drums, a pulsing synth bass |
| `scifi` | CS-80 pads, a gliding synth lead, FM bells and keys, a theremin for laboratories and dread, sequenced arpeggios, gated drums, long echoes |
| `arabic` | oud, ney, qanun, rebab, the violins of an Egyptian orchestra; darbuka, riq and tabl (maqsum, baladi, saidi, zaffa); maqam Bayati with quarter tones, Hijaz when dark, Saba in grief; one chord held on the keynote; no church bells |
| `eastasia` | Japanese: koto, shakuhachi (breath and bent notes), shamisen, shō, shinobue, singing bowls, the temple bell; taiko and clappers; Buddhist chant; the yo and in scales |
| `mediterranean` | Spanish guitar, mandolin tremolo, bouzouki, accordion; tambourine, tarantella, a town band |
| `fantasy` | harp, concert flute, lush strings, celesta, French horns, timpani; tin whistle in the woods, fiddle and bodhrán jig in the tavern, war drums |

A place chooses its mood with `music: "crypt"`; its tune is grown from its own id, so it always sounds like itself. Another style for a whole campaign: `ATLAS.configure({ music: { flavour: "arabic", volume: .6 } })`; `flavour: "auto"` takes it from the city's look and region. The page also lets the referee change style and mood while playing. `music: false` there removes music from the page. At the table the referee can switch to any mood (a chase, a battle, dread) from the page's chooser and back to the place's own.

Choose the style by the story's time and place, not only its genre: a story in 1944 takes `wartime`, one in 1890 `industrial`. A new style is one row in `FLAVOURS` (its instruments by part, its scales, how its chords are built, its ornaments, its moods played differently), its drum rhythms in `RHYTHMS`, and its loudness for each mood in `LEVELS`, measured with `ATLAS.music.measure` in a browser (Claude cannot hear: balance by measurement, then take the user's word). Never change the `arkham` row or the instruments it uses (`grand`, `harp`, `cello`, `lowstr`, `hstr`, `brass`, `choirM`, `choirF`, `strings`, `stab`, `hitstr`, `bell`, `horn`, `organ`, `choir`): the user approved how it sounds.

```js
ATLAS.configure({
  title: "Name",  subtitle: "One sentence.",  system: "Call of Cthulhu 7e",  setting: "London, 1888",
  // The masthead reads "system · setting · Keeper's gazetteer", so keep system and setting to a few words each.
  strap: "places of despair",              // a short phrase after the title, in the accent colour ("The Wormroot Idol: places of despair")
  acts: ["The clerk who did not come back", "The misadventure ledger"],   // act titles, in order: they fill the act filter
  keys: [{ name: "The Mourner's Finger", place: "old-morgue" }, { name: "The Last Finger", place: null, where: "An investigator's hand" }],
                                           // the strip across the top: the campaign's key items in order. Without it, every K entry on the maps
  keyName: "Finger",  keySites: "Finger sites",      // what a key item is called on tags, and the chip that filters to their places
  gm: "Keeper",                            // Keeper, GM, DM, Warden, Referee
  grid: { unit: 5, name: "ft" },
  paper: "parchment",                      // parchment | blueprint | chalk | { paper, ink, halo, hatch, hatchLine, accent, sub, stair, room }
  autoWindows: true,  compass: true,
  fonts: { label: "'IM Fell English SC', Georgia, serif",   // room names on the maps
           mono: "'IBM Plex Mono', monospace",
           google: ["IM+Fell+English+SC", "Spectral:ital,wght@0,400;0,600;1,400", "IBM+Plex+Mono:wght@400;500;600"] },   // Google Fonts families to load
  ui: { accent: "#8a2432", accentDark: "#d77580", display: "'IM Fell English SC', Georgia, serif", body: "'Spectral', Georgia, serif" },
  markers: { K: ["#2f6b3a", "Idol fragment"] },      // rename the key-item marker, or add a letter
  labels: { chk: "Rolls", kp: "{gm} notes" },        // rename guide fields
  kinds: { hull: { solid: 1, stretch: 1, pat: "hatch", fill: "#5d6770", line: "#414a52" } },
  items: { drone: { shape: "diamond", fill: "#c9772e", glyph: "D" } },   // shape: rect | soft | round | diamond
  categories: [{ id: "scene", name: "Crime scenes" }],
  sizeNames: ["Original", "Larger", "Largest", "Huge"],
  minInbound: 2,                           // check: fewer leads in than this is reported
  storageKey: "atlas-name"                 // keeps this campaign's viewer preferences apart from others
});
```

**Leave the dress alone unless the user asks.** With no `fonts` and no `ui`, a campaign wears the Wormroot Idol Gazetteer's dress: IM Fell English with Alegreya and IBM Plex Mono, the dark red accent, parchment maps. The user expects every campaign to look like the Gazetteer and noticed at once when one did not. `ui` (`accent`, `accentDark`, `display`, `body`, `mono`, `sc` for the small-capital numerals) and `fonts` exist for the day they ask for another look; fonts must then come from Google Fonts (the page may load nothing else), each with a fallback in its stack. `subtitle` is no longer shown on the page; use it as the publish description.

A kind of your own: `pat` is one of `plain planks tiles slabs checks bricks plate grate dots waves hatch diamonds`, with `fill` and `line` colours; flags `out: 1` (open ground), `solid: 1` (not a place), `nowin: 1` (no automatic windows), `stretch: 1` (extends when the map grows).

## 6. Floor kinds, items and furnishing presets

Run `node scripts/atlas.js catalogue <dir>` for the current list and a drawn sheet (`dist/catalogue.html`).

**Floor kinds.** Indoor: `boards flag tile tilew carpet-r carpet-g carpet-b cobble sawdust lino straw earth brick stone coal water concrete metal grating glass marble`. Open ground: `street yard alley grass quay river deck sand snow mud tarmac forest space`. Solid: `rock roof void`. Rooms floored in `earth brick stone coal water` get no automatic windows (they read as cellars).

**Items.**
- Beds and seats: `bed dbed cot bunk pod chair arm sofa bench stool pew seats throne`
- Tables and work: `tbl dine rtbl clothtbl desk counter till work block lathe console screen`
- Storage: `ward chest dresser book shelf files cabinet drawers safe vault locker rack jars disp crate barrel sack bin`
- Kitchen and wash: `fp range stove copper sink pump bath wash tub mangle privy trough well fountain`
- Trade and craft: `hooks sm dress furnace pipes pipe tank generator sign bar taps stage curtain organ piano ring`
- Sacred and grim: `altar font pulpit lectern slab body coffin grave cross niche plinth statue sigil chalk blood portal crystal`
- Building parts: `column rail fence bars grate hatch ladder mirror pic clock lamp lampost candle brazier rug bell cage`
- Outdoors and vehicles: `tree bush boulder plant cart boat vehicle stall tent campfire washing`
- Traces and mess: `foot rubble puddle papers heap salt coal roots cradle fig`
- Generic: `box` and `disc` (plain shapes that take a colour), `x` (nothing)

**Furnishing presets** (`fx`): `bedroom garret dorm ward cell kitchen scullery wash parlour dining office library store shop workshop privy yard cellar coalhole attic chapel classroom bar taproom surgery lab vestry stable boiler strong hall shed pantry nursery waiting ice`. They suit pre-modern and early modern rooms; for other settings place items by hand or mix (`office`, `store`, `lab`, `ward`, `waiting` and `strong` are period-neutral).

## 7. For the table

`table.js` holds `ATLAS.clocks([...])`, `ATLAS.sessions([...])`, `ATLAS.pcs({...})`, `ATLAS.rescues([...])`, `ATLAS.tables({...})` and `ATLAS.handouts([...])`; the places and their clues, people and encounters carry `intensity`, `content`, `tables`, `roll`, `rescue`, `handout` and `stats`; `campaign.js` may say `era` and `people`. Every one of them is described, with an example, in `references/table.md`.
