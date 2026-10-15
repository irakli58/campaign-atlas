// A small complete example in a setting far from gaslit London, to show how little changes:
// the referee's title, the grid, the paper, two floor kinds of our own and one item of our own.
ATLAS.configure({
  title: "The Quiet on Deck Nine",
  subtitle: "A hydroponics tech has been missing for three shifts, and the station doctor keeps signing for crates nobody ordered.",
  system: "Any science-fiction investigation game",
  setting: "Kestrel Station, 2291",
  gm: "GM",
  grid: { unit: 2, name: "m" },
  paper: "blueprint",
  compass: false,                       // no north on a spinning station
  autoWindows: false,                   // no windows through a hull
  fonts: {
    label: "'Chakra Petch', 'Trebuchet MS', sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace",
    google: ["Chakra+Petch:wght@400;600", "Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400", "IBM+Plex+Mono:wght@400;500;600"]
  },
  ui: { accent: "#1f5f8b", accentDark: "#7fbfe6", display: "'Chakra Petch', 'Trebuchet MS', sans-serif", body: "'Source Serif 4', Georgia, serif" },
  kinds: {
    hull: { solid: 1, stretch: 1, pat: "hatch", fill: "#5d6770", line: "#414a52" },
    hydro: { pat: "tiles", fill: "#a9c79a", line: "#6f9461" }
  },
  items: { drone: { shape: "diamond", fill: "#c9772e", glyph: "D" } },
  categories: [{ id: "scene", name: "Where it starts" }, { id: "station", name: "The station" }],
  // This example is a miniature, so it lowers the standard a place is held to. A real campaign keeps the defaults
  // (references/standards.md): a tier 1 place has at least 30 rooms on 3 floors.
  standards: { 1: { rooms: 12, floors: 2, inbound: 1 }, 2: { rooms: 6, floors: 1 } },
  storageKey: "atlas-deck-nine"
});

// The cast: the people the story turns on, each described once. A person on a map who is one of them says who: "okafor".
// Everyone, cast or not, has a look, a story (bg), a manner (how they act) and ties (who they know, and how): ties
// name one of the cast by id, or anyone else by their full name, and the page shows the web both ways.
// Each place plays a theme of its own: a mood per place (music: "ship" in its file). The style is the default,
// dark orchestral mystery; a campaign that wants another says so: ATLAS.configure({ music: { flavour: "scifi" } }).
ATLAS.cast({
  okafor: { n: "Dr. Adaeze Okafor", role: "Chief of the medical ring; the one who signed for the crate", look: "Forty-five, precise, grey with tiredness, a pen she keeps clicking.", manner: "Stands between you and the door without seeming to. Tidies while she listens; goes very still when she is lying.", voice: "Low and exact. Answers the question asked and no other.", bg: "Came to the station to run a clinic and was handed a research budget she did not ask for.", ties: { "Nurse Petra Lindqvist": "her nurse for six years, the one person she trusts; locked out of the office to keep her clean of it", "Ines Varga": "the hydroponics tech she lied about; she knows exactly where Ines is", "Dockmaster Joss Hale": "owes her a favour, and paid it by cutting eleven minutes from the bay record" }, want: "To contain the breach before anyone learns there was one.", secret: "The crate's seal failed in her hands, and she moved the samples to the grow beds herself.", lie: "That Ines was discharged at the end of her shift.", press: "Honesty and a workable plan. A threat only makes her stop talking.", fate: "If the players help her, she signs the breach report; if not, she seals Deck Nine with herself inside." }
});
