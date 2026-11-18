# The UI overhaul (18 Nov 2026)

The request (docs/requests/2026-11-18-ui-overhaul-and-strahd-stress-test.md): "after everything is done we are doing a
complete ui overhauld because its not very intuitive". The 5 Nov UX review and its 22 changes are the starting point.

## The review: what made the page hard to read

Measured on the realm and Kestrel examples, at 1440×900 and on a 390×844 phone (scratchpad tool uiaudit.js: a
screenshot of each main view, plus a count of the buttons on screen):

1. **Too much chrome before the content.** The title, the views, search, the DM/players switch, help, settings and the
   music bar were stacked in five rows. On the desk they took about 300 px before any of the campaign showed, and they
   scrolled away.
2. **The music bar always open** in the header, with its sliders, even for game masters who never play music.
3. **Two onboarding prompts at once.** The tour's welcome toast and the "New: At the table" banner both asked for
   attention on the first visit.
4. **At the table's list of tools**: 25 tools, each with a two-line description. It was three screens tall, with no way
   to find one or to fold a group away.
5. **Names under marks on the city map.** The numbered place marks were drawn over the district and landmark names
   ("THE W⑫RENS").
6. **An empty Investigation tracker** took a full-width bar that said "0 of 0 clues · 0 of 0 keys · 0 characters".
7. **The realm example opened in the painted look**, because its world.js and world-terrain.js said `look: "painted"`.
   The geological look is the default (the user, 17 Nov).
8. **The phone's header** hid the campaign's name and took a third of the screen.

## Done (branch integrate-main)

- **One compact top bar, sticky on the desk.** The name is on the left, then search, DM / players, Help, the settings
  and Audio; the views go on the row below (528e609).
- **Audio** is a button that opens the music and sounds in a panel. A click elsewhere closes it. The tour's music step
  points at it.
- **One prompt at a time.** The tour waits while the "New" banner is up. The banner sits below the bar, not inside it.
- **Find a tool** box at the top of At the table's list. It matches each tool's name and what it does, and says when
  nothing matches.
- **The groups fold**, and the page remembers which are folded. The group holding the open tool always stays open.
- **Each tool's description shows only for the open tool.** The others show it on hover, so the list fits one screen.
  The tour teaches Find a tool (8339783).
- **City map names move off the marks**: up, down, then sideways, and off the names already written. This applies to
  the flat map and to the 3D map's labels.
- **The phone bar**: the name gets its own line, and the bar scrolls away.
- **An empty tracker** is one quiet dashed line: "nothing to track yet: open it to add the characters or a key".
- **The realm example** wears the geological look.
- **The world map's toolbar**: its seven layer switches (Plates, Rocks and resources, Relations, Trade, Ocean currents,
  Coasts, Road network) are now together under Layers, beside Filters. Layers is hidden when the world has none and
  marked while any is on. Filters and Layers close at a click elsewhere, and the tour teaches Layers.
- **The settings (the gear, What this campaign uses)**: a Find a part box filters the 23 parts by name and by what they
  do. Groups with no match are hidden, and the words stay through each change. The tour teaches it. The groups were
  already there.
- **The table toolbar at the bottom right** folds to one button, Tools, with the › at its end. This frees the corner of
  a map, and the page remembers the choice. The tour opens it again for its own steps and teaches the fold.
- **A place's page**: its empty sections (nobody posted here, no connected places, not mapped yet) are one quiet line
  each, with no Open all. The map section, when the place has no map yet, moves below the connected places. What the
  place does have (its people, clues and hooks) now comes on the first screen.

## Still to do in the overhaul

- Nothing from this review is left. Further passes follow the stress test (Curse of Strahd), which will show the
  page under a full campaign.

- **After each change**: smoke-all.js (all 58 tabs, no errors) on the realm and Kestrel examples, uiaudit.js at both
  sizes, and the tour updated.

## The second pass: uncluttered (18 Nov 2026)

The user asked: "is the ui still cluttered or more readable and usable? that was the main goal to fix". The answer was
that it was more readable in places but still cluttered. Then they said: "work on it being uncluttered" (saved as
docs/requests/2026-11-18-uncluttered.md). This pass made these changes:

1. **The top is one line on a wide screen.** It holds the campaign's name, the views, a shorter search box, DM /
   players, Help, the gear and a ♪ button. The campaign line above the name is now in its tooltip.
   - The "New" banner is one slim line, with its long words moved to the tooltip.
   - The investigation tracker is hidden while it is empty. "Investigation tracker", beside + A place, brings it out
     open, and the tour teaches it.
   - On the Gazetteer at 1440×900, content now starts at about 160 px instead of about 335 px.
2. **At the table's start page:**
   - A short head: the title and the two main buttons on one line.
   - The checklist is one line per step, with its explanations in the tooltips.
   - The two big cards no longer carry their long explanations.
   - The second copy of the tools, as cards, is gone from the desk view; the list sits beside it. The phone keeps the
     cards.
   - "How a game night goes" is folded.
   - Buttons on screen: 112 before, 89 after.
3. **A place's page is for running the game.**
   - ✎ Edit, beside the place's number, shows the tools that change the place. These are: + Add a clue found here, + Add
     another way in, "Open from the start", the notes on forcing it and what closes it (empty notes are hidden; written
     ones always show), and the second copy of the access line. The page remembers the choice.
   - Empty clues are one quiet line. The tour teaches the switch.
   - On a starting place: 15 controls without Edit, 20 with it.
4. **The party's journey on the world map** is one line: the way, how far it is, and Travel a day. Rest a day, Arrived,
   Call it off and The road so far are under More.

## The third pass: consistency and ease of use (18 Nov 2026)

The user: "i want consistency and also ease of use" (docs/requests/2026-11-18-consistency-and-ease.md).

**Consistency: one design system** (the end of engine/atlas.css). There are four kinds of control, and each looks the
same in every view:
1. **Navigation and switches**: a mono, upper-case pill.
2. **Actions**: the body's serif, plain case, a 6 px rounded rectangle. At most one **main** action per area, filled
   dark (`.prim`); the others have a border.
3. **Links**: the accent colour, underlined.
4. **Icon buttons**: 32 px.

All of them share one keyboard focus ring and steady gaps. The palette and fonts are the Gazetteer's own, as before.
Measured: 37 distinct button styles before, 26 after. The rest are list rows, the table toolbar and the map's own zoom
buttons.

**Ease of use:**
- **At the table's list** shows the 11 core tools. The 14 that other parts add are under **More tools**: the world at a
  glance, recorded sessions, the world's time and history, factions, consequences, money, rumours, the copilot, the
  investigation and the rest. The fold is remembered. It opens by itself for the tool in use and for Find a tool, and
  the tour teaches it.
- **An accessibility audit with axe-core (WCAG 2 A and AA)**, run on the Gazetteer, World map, At the table and Music
  views of both examples, in the light and dark themes. Fixed:
  - text contrast: the grey text, the gold of the key items and the brown of the clue marks are a little darker;
  - the faded empty lines;
  - the page's language;
  - the maps' role (a group, not a picture, since they hold buttons);
  - the tool list's false tab roles;
  - buttons inside fold headings: a person's "Their card" now sits beside the fold, and a clue's handout mark is a
    label (its buttons are inside the open clue).

  Now there are no violations in any of those views. Re-run it with the scratchpad's axe.js, which loads axe-core
  4.10.2 into the page.

**Still to do, for millions of users:**
- testing with real game masters;
- loading the heavy parts only when they are opened (the example page is about 6 MB);
- checking on Safari and Firefox;
- testing the 3D views on real graphics hardware;
- a screen-reader walk-through by a person.
