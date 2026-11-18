# The item and loot system: audit and plan (18 Nov 2026)

The request is docs/requests/2026-11-18-item-loot-system.md (19 sections), and the user added: "everything should be
rpg rule set / game specific … if its dnd use dnd items if its mothership use mothership items, but let the player
make their own too".

## What Atlas already had (reused, not duplicated)

| System | Where | What it does |
|---|---|---|
| Goods and prices by age | atlas-economy.js `AGES`, `goods()` | Fantasy, Victorian, 1920s, modern and future goods, in the age's money. The campaign's own goods go in table.js `ATLAS.economy`. |
| Rarity, quality and condition | atlas-economy.js `QUAL`, `COND`, `RAR` | Already three separate things: common to legendary; shoddy to masterwork; broken to as new. |
| Loot | atlas-economy.js `rollLoot` | Coins and things by size (pockets, cache, hoard). |
| The party's inventory | collection `stash` | Things with name, kind, value, rarity, quality, condition and quantity. Sold, dropped, bought. |
| Merchants and stock | `merchants`, `stock` | Each sells some kinds of goods, restocks every few days, with prices by place and by what moves them. |
| Loot named in a description | atlas-quickplace.js `extrasOf` | "a locked strongbox in the cellar" becomes loot in that room. |
| Clues | atlas-story.js `St.putClue`, `St.nextClueId` | The investigation's clues, logged and undoable. |
| People | `St.people()` | The cast and every place's people, with role, words and places. |
| Factions, events, places | `factionsData`, `eventsData`, `A.meta` | |
| The Copilot | atlas-copilot.js `IMP` | Improvises from the campaign's own words, and never changes the campaign by itself. |
| Claude | `api.askRaw` | Switched off with the "ai" module. |
| Handouts to the players | `api.show({kind:"handout"})` | |

## The design

**One item store: the existing `stash` collection**, extended rather than replaced.
- Each record gains an `owner`: "party" (the default, so the old stash is unchanged), "pc:<id>", a person's ref
  ("cast:…", "npc:…"), "place:<id>", "merchant:<id>", "in:<item id>" (inside a container) or "library" (the
  campaign's item library).
- Optional fields:
  - `cat` (the category);
  - `desc` (what the players see) and `secret` (the game master's only);
  - `reveals` (facts learned later, each shown or not);
  - `stats` with its `src`: "official" (a rulebook's own), "srd" (an open rules text, with attribution), "homebrew" or
    "narrative";
  - `weight`, `equipped`, `img`;
  - `role`: loot, clue or plot;
  - `story` (maker, age, origin, previous owner, significance, faction, rumours).
- Moving an item changes its owner. The record and its id stay the same, so nothing is duplicated.
- What the party carries in Money and goods is the owner-"party" view of the same store.

**The ruleset's own items** (atlas-items-rules.js). The page reads the campaign's `system`:
- **D&D 5e:** the System Reference Document 5.1 (Wizards of the Coast, CC-BY-4.0). That means its weapons (damage,
  properties, weight, cost), armour (AC, Strength, Stealth), adventuring gear and tools, and a set of its magic items
  (rarity, attunement, a short summary in Atlas's own words). Each is attributed, and the rulebook remains the full
  text.
- **Games whose rules are not open** (Mothership, Call of Cthulhu, Alien, Traveller, Cyberpunk RED, Blades in the Dark
  and others): their own equipment's *names*, so a Mothership game finds a vaccsuit and a pulse rifle, not a sword. No
  statistics or rules text are copied. Each item says "statistics: in <the rulebook>", and the game master can write
  them in.
- **Any game:** the game master can paste or type the rulebook's items, one per line (name, category, cost and
  statistics, with optional weight and rarity). These go in collection `rulebook` and come first in everything
  generated.
- **No ruleset:** the age's goods (atlas-economy.js) and Atlas's narrative items, marked as such.

The marking never mixes, so nothing invented is presented as official.

**Generation** (atlas-items.js), always from context:
- **Loot for a place:** what the place is (its kind and name: camp, manor, tomb, lab, station…), who is there (its
  people's roles), whose territory it is (a faction), recent events there and its history. How much is found depends on
  wealth: a poor or abandoned place yields little or nothing, and "nothing worth taking" is a real result.
- **A person's belongings:** from their role (soldier, merchant, noble, scientist, cultist, bandit, explorer, priest,
  smith…), their wealth and their faction. An important person (one of the cast) may carry one personal thing tied to
  their background.
- **A shop's stock:** from the merchant's trade and the place: a village, a city, a mining town or a frontier post. It
  is priced with the existing economy.
- **A unique artifact:** a name, look, materials, condition, maker, age, origin, previous owner, significance,
  properties, worth, faction and rumours, all tied to the campaign's people, powers, events and places. It is magical
  only where the game has magic.
- **Ordinary objects:** a rusty kitchen knife stays a rusty kitchen knife, with no story.

The controls are: how many, the category, the approximate worth, rarity, mundane or supernatural, allowing anachronisms
(off by default), and the place or person.

**Loot tables:** saved in collection `loottables`. Each holds weighted rows (an item, a category, or "nothing") and
restrictions, and can be rolled from anywhere.

**Clue and plot items:** "Make it a clue" proposes a clue at the item's place. It is written only when the game master
presses Add, through `St.putClue`, so it is logged and undoable. Atlas never turns loot into a clue by itself.

**Found out later:** each `reveal` is a fact. "Tell the players" adds it to what they see, and the players are never
sent `secret`.

**Images:** a small icon for each category (a drawn glyph), framed for the genre (parchment for the past and fantasy, a
technical frame for science fiction). An optional picture of the game master's own can be added. Images are never
required.

**Where it is reached:**
- At the table: an **Items** tab, with the library, every owner, the editor and Generate loot.
- Make it up: a quick card.
- A place's page: Generate loot here.
- A person's card: their belongings.
- Money and goods: unchanged, now the party's view of the store.
- The Copilot: "Items and loot", where Claude proposes items in the campaign's context and each is added only when
  approved.

## Phases

1. **The store, the rules files and the generators.** Then the Items tab, Make it up, the place page and the person card.
2. **The Copilot**, the **loot tables**, and the **clue and reveal** handling.
3. **The tour**, the documentation (references), and tests on the realm and Kestrel examples.

## Done (18 Nov 2026, commit e77e565)

Phases 1 and 2 are built and tested on both examples, and the tour teaches them:
- the one store with owners, plus moves, containers, quantities, using up and destroying;
- the rules files and the game master's own list;
- every generator, and loot tables;
- secrets, reveals, Show the players, and Make it a clue with approval;
- the Items tab, the Make it up card, the place page, the person card, and the Copilot's Things and loot (Claude's
  answer is read back as proposals, with the game's own items keeping their statistics and anything new marked
  Homebrew);
- the players' copy and journal list only the party's things.

Tests:
- realm (D&D 5e): loot follows the place. The forge gives weapons and mithral, the academy spellbooks and a poisoner's
  kit, the poor mill almost nothing, the rich keep coin and a sealed order.
- Kestrel (Call of Cthulhu in the far future): future goods, not 1920s ones.
- The secret never reaches the players' screen.
- axe-core reports no violations on the Items tab.
- smoke-all.js opens 60 tabs with no errors.

## Still to do

- **Item pictures:** each category's small drawing, framed for the age, or a picture link. A drawn illustration for
  important things (as atlas-portrait.js draws faces) is not done yet.
- **Level and party strength:** "a magical sword for a level 5 party" works through the Copilot. There is no level
  control in the form yet.
- **Buying a generated shop's stock with the purse:** a thing can be moved to the party now. Money and goods'
  merchants keep their own goods-based buying.
- **Room-level places:** a thing is at a place, not yet at a room of its map.
- **The Writer Council designing artifacts:** not wired in yet.
