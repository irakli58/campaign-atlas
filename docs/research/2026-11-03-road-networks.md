# How real roads and trade routes form, and how Atlas will grow them (research, 3 Nov 2026)

The request is in `docs/requests/2026-11-03-road-networks.md`. This document has three parts:

1. What the research says.
2. What Atlas does today.
3. The trial generator designed from the research, with each rule traced to the finding behind it.

The results on test worlds, compared with real networks, are added at the end once the trial runs.

Nothing here replaces the existing generator. The trial is a separate layer the game master can switch on, so the two can be compared until the user approves one.

---

## 1. What the research says

### 1.1 Cost, not distance, decides what is connected

- **ORBIS**, Stanford's model of travel in the Roman world (Scheidel 2015, [working paper](https://www.ancientportsantiques.com/wp-content/uploads/Documents/ETUDESarchivees/MedNavigationRoutes/ORBIS-Scheidel2015.pdf), [orbis.stanford.edu](https://orbis.stanford.edu/)) puts this most simply: *"Cost, rather than distance, is the principal determinant of connectivity."*
  - It models about 85,000 km of road, 28,000 km of river and canal, and sea lanes whose cost changes month by month with the wind.
  - Changing from road to ship costs time, so short trips stay on land.
  - Mountain roads are slower, and closed in winter.
- **Sea is far cheaper than land, river in between.** Duncan-Jones's figures (cited on [SJSU's economic history page](https://sjsu.edu/faculty/watkins/rome.htm)) put the cost of carting wheat 100 Roman miles at about 55% of its value, against about 1.3% by sea: roughly **40 to 1**. The often-quoted ratio from Diocletian's price edict of 301 CE, about 1 (sea) : 5 (river) : 28 to 50 (land), I could not check at its source, so it is used only as an order of magnitude.
  - **What follows:** cities cluster on coasts and navigable rivers, and a long haul goes by water if it can.
- **Why it matters for Atlas:** routes must come from a cost surface over the land and the water, not from straight lines between places.

### 1.2 Roads grow one at a time, and new ones reuse the old

- **The sequential road network model** ([PMC9944230](https://pmc.ncbi.nlm.nih.gov/articles/PMC9944230/), the user's first source) rebuilds ancient networks by connecting places one pair at a time along least-cost paths.
  - Once a stretch of road is built, travelling it costs only a fraction α of open country; α ≈ 0.4 to 0.5 fitted real networks best.
  - Later connections therefore bend onto existing roads, and trunks, junctions and branches emerge by themselves.
  - It matched real Roman and pre-Roman networks better than minimum spanning trees, Gabriel graphs, relative neighbourhood graphs or Delaunay triangulations.
  - The order of connection matters most early on.
- **Trails reinforce themselves.** Helbing, Keltsch and Molnár's "active walker" model (*Nature* 388, 1997, "Modelling the evolution of human trail systems") shows the same from below: every walker makes a way slightly easier for the next, unused ways fade, and a few shared trails replace many direct ones.
- **Cost against benefit gives hierarchy.** Louf, Jensen and Barthelemy ([PNAS 2013, arXiv 1305.3282](https://arxiv.org/abs/1305.3282)) grow a network by building a link only when what it brings outweighs what it costs.
  - Hubs with their own service areas emerge naturally.
  - The world's railway networks sit in the middle of the model's range, between a star and a minimum spanning tree.
- **Networks rise and fall.** Levinson and Yerra ("Self-organization of surface transportation networks", *Transportation Science*, 2006) show a road hierarchy emerging from investment that follows traffic: busy links are improved, quiet ones neglected.
- **Why it matters for Atlas:** this is what removes the parallel duplicate roads of today. The fix is not tidying them afterwards; one road is built first and the others join it.

### 1.3 What the land allows

- **Walking speed and slope.** Tobler's hiking function ([Wikipedia summary](https://en.wikipedia.org/wiki/Tobler%27s_hiking_function)) gives about 5 km/h on the flat, fastest on a slight downhill, falling off steeply above about 25 to 30%.
- **Carts need gentle grades.** A Practical Action guide to rural paths ([page](https://rachel.core2learn.org/modules/en-practical_action/Transport%20and%20infrastructure/Road%20building/KnO-100388_Improving%20paths%20and%20tracks%20part%203/page1.html)) gives **8% (1 in 12) as the desirable maximum for animal-drawn carts**, lower for heavy loads.
  - Early-1900s American freight roads allowed about 12%.
  - Packhorses and people manage much steeper.
  - **Switchbacks** exist because a road may not climb faster than its maximum grade: to rise a height *h* at grade *g*, it must run *h / g* along the slope.
- **Roman roads were straight only where the land allowed.**
  - A study of the whole Empire's roads (summarised in a [Nature press release](https://www.natureasia.com/en/info/press-releases/detail/9441)) found them mostly straight in the lowlands and less straight than modern roads in mountains.
  - A study of Roman roads in Wales ([Lewis](https://josephlewis.github.io/Roman_Roadways_Structure.pdf)) found no single rule of straightness: the roads gave way to the terrain.
  - The new Itiner-e dataset (*Scientific Data* 2025, doi:10.1038/s41597-025-06140-z; [summary](https://popular-archaeology.com/article/digital-map-increases-roman-empire-road-network-by-100000-kilometers/)) grew the known network from about 188,555 km to **299,171 km**, partly by letting mountain roads wind as real ones do. **About a third of its 14,769 sections are main roads**; the rest are secondary.
- **Least-cost path reconstruction of a real trade route.** The Tang–Tibet study ([PMC6936881](https://pmc.ncbi.nlm.nih.gov/articles/PMC6936881/), the user's second source) weighed seven factors by expert judgement (AHP):
  - slope 0.25, river 0.18, plant productivity 0.18, altitude 0.14, population 0.12, relief 0.11, temperature 0.02;
  - routes through a triangulation of known sites (edges up to 22 km), solved by Dijkstra's algorithm.

  Two lessons follow:
  - **Rivers and productive, peopled land matter almost as much as slope**, because travellers need food, fodder, water and shelter.
  - **High, cold ground is avoided even where it is not steep.**
- **Alpine passes.** The lowest, easiest crossings carry the trade, and engineering moves it.
  - The Brenner, the lowest main Alpine pass, carried traffic from Roman times and rose again from the 10th century.
  - The Gotthard became a through route only once its gorge was bridged, about 1230.
  - **A pass is chosen by the lowest saddle the age can engineer.** A shorter route over a higher saddle loses until technology makes it cheaper.

### 1.4 Rivers: crossings, and the river as a road

- **Fords** were at wide, shallow stretches with a firm gravel bed.
  - On the Great Ouse, settlements stood at the best crossing points, where the river was wide and relatively shallow with a firm gravel bed ([Hunts Post history](https://www.huntspost.co.uk/news/history-of-crossing-the-river-ouse-8927946)).
  - Oxford's historians argue the town was named after its ford, not the other way round ([Oxoniensia](https://www.oxoniensia.org/volumes/2010/Grayson.pdf)).
  - **Towns grow at crossings:** Oxford, Hertford, Frankfurt and Erfurt are all ford names ([Ford (crossing)](https://wikipedia.com/wiki/River_ford)).
- **Ferries** carried roads over big lowland rivers until bridges could be afforded ([US National Park Service river guide](https://www.npshistory.com/publications/chat/brochures/river-guide.pdf)).
- **Bridges** came later and at towns, and once built drew roads away from the old fords (the Shallow Ford in North Carolina is one example).
- **Rivers carry trade** where deep and gentle enough. ORBIS treats 25 rivers as navigable, with upstream travel costlier than downstream. Heads of navigation and confluences become river ports.

### 1.5 Settlements and their hierarchy

- **Central place theory** (Christaller 1933) explains why market towns are spaced as they are: each serves the country round it to the distance people will walk to market and back.
  - The classic figures for southern Germany run **7, 12, 21, 36, 62, 108 and 186 km** between centres of each order, each about √3 times the last.
- **English law gave a market a third of a day's walk.** Bracton's rule held a new market unlawful within 6⅔ miles of another: a third of a 20-mile day to walk there, a third to trade, a third to walk home ([Market town](https://en.wikipedia.org/wiki/Market_town)). It was rarely enforced as stated, but the spacing it describes is real.
- **Caravanserais stood a day's journey apart:** about **30 to 40 km** on open plains and deserts, 10 km or less in the mountains ([UNESCO Silk Roads](https://fr.unesco.org/silkroad/node/8325)). Water decided the site. **A desert route is a chain of wells and oases a day apart**, not a straight line.
- **Roads make towns.** Fulminante's network study of early Latium ([review](https://traj.openlibhums.org/article/id/11715)) found settlement growth strongly linked to land routes, and network centrality predicting which sites became central places. Rome's superior centrality concentrated power there.
  - **Later Roman roads followed older local routes,** which the state joined into long-distance roads. The same happened in conquered provinces such as Britain.

### 1.6 Trade flows: why some links carry more

- **The gravity model.** Trade between two places rises with their sizes and falls with the cost between them.
  - Boerner and Severgnini ([TCD paper](https://onprem.tcd.ie/Economics/assets/pdf/Battista%20Severgnini.pdf)) estimated medieval trade flows between cities this way, using the spread of the Black Death along trade routes as the trace.
  - A long-run study of British trade ([NYU Abu Dhabi working paper](https://nyuad.nyu.edu/content/dam/nyuad/academics/divisions/social-science/working-papers/2020/0055.pdf)) finds gravity already at work by 1700.
  - Distance exponents of about **1.5 to 2.5** are typical (a [teaching summary](https://wh-computational-geography.pages.dev/foundations/gravity-models-trade-migration); modern-era values).
- **Complementarity** (Ullman 1956): places trade when one has what the other lacks. Grain flows to mining towns, ore to cities, salt and fish inland from the coast. An "intervening opportunity" (a nearer source) cuts a longer flow.

### 1.7 Borders, tolls, security

- **States channel trade through a few crossings.** Customs houses, tolls (the medieval Rhine was notorious for them) and fortified gates make every border crossing cost something, so traffic gathers at a few posts instead of crossing anywhere.
- **Hostile borders choke trade.** Security moves routes: the Silk Roads flourished under the Mongol peace and shifted when routes became unsafe.
  - **Friendly neighbours build corridors; hostile ones keep a guarded gate or none.**

### 1.8 How real networks measure up (for testing)

- **Detour index** (the way by road over the straight line; [Barthelemy, Spatial Networks](https://arxiv.org/pdf/1010.0302)): always above 1. Barthelemy's worked example is about 1.27. Country-wide circuity is often reported at about 1.2 to 1.4 (Ballou et al. 2002; not checked at its source here).
- **Junction degree:** street networks average about 2.5 to 3 roads per junction ([Boeing](https://arxiv.org/pdf/2009.09106)). Country road networks are mostly three-way junctions.
- **Hierarchy:** about a third main roads (Itiner-e).
- **Density:** the Roman network known today is about 0.075 km of road per km² of land, a floor, since most minor roads are unrecorded.

---

## 2. What Atlas does today

- **Places.** Only the story's own locations exist on the world map: 16 in the showcase world. Each is set where its kind belongs (a port on the coast, a castle on high ground).
- **Routes.** While `world.js` has none, `atlas.js world` suggests them:
  1. It joins neighbouring places with a relative neighbourhood graph on straight-line distance.
  2. It calls each joined pair road, trail, pass or sea by what lies on the straight line between them.
- **Drawing.** The page traces each route on its own over a grid. The cost is height bands (high ground ×8, middling ×2.1) with a small extra cost in wet ground.
- **The flaws this explains:**
  - Two routes down one valley are traced separately, so they are drawn as parallel duplicates.
  - Nothing joins them at a junction.
  - Rivers are crossed anywhere at no cost.
  - Slope (as opposed to height) and the age's technology play no part.
  - There are no villages, market towns, bridges, ferries, borders or trade.

---

## 3. The trial generator

`scripts/world-roads.js` is a new command, `atlas.js roads <campaign>`. It writes `world-roads.js` beside `world-terrain.js` and changes nothing else. The page draws it only when the game master turns on **Road network (trial)** on the world map.

It works in five steps.

### Step 1. The cost of the land, for the age's travellers

Each cell of the terrain grid gets the cost of crossing it.

| Rule | From |
|---|---|
| **Time on foot from slope:** Tobler's speed, from the real metres of the land (the terrain's height scale) over the cell's width in km. | Tobler; ORBIS's slower mountain roads |
| **Grade over the age's limit:** a wagon road may climb only 8% (a packhorse age 15%, an engineered road 6% but with cuttings). Steeper ground is crossed by switchbacks, costing *slope ÷ limit* times the length, and the stretch is marked so the map can draw its zig-zag. | Practical Action cart grades; switchback geometry |
| **High and cold ground** costs more even when gentle: above about 2,500 m, and on glaciers and snow (impassable for wheels). | Tang–Tibet altitude and temperature weights; Alpine winter closures |
| **Rough ground** (relief within a cell's neighbours) adds cost. | Tang–Tibet relief weight |
| **Forest and swamp:** dense forest about 1.5×, swamp and marsh about 3×. | AHP land-cover reasoning; medieval routes keeping off wet valley floors |
| **Fed, peopled land is cheaper** (food, fodder, shelter), barren land dearer. | Tang–Tibet productivity and population weights (0.30 together) |
| **Desert:** the cost grows with the distance from water (river, lake, oasis, wet ground), so routes string from well to well about a day apart. | Caravanserai spacing; water as the deciding factor |

### Step 2. Rivers and the sea

- **Crossing a river costs by its size.**
  - A stream is forded for little.
  - A big river is forded only where it runs wide and shallow (a broad, gentle stretch).
  - Otherwise the road takes a **ferry** (a fixed cost).
- **Bridges.** A town on a big river gets a **bridge** once trade through it is enough to pay for one, and the age can build one (Roman and later: stone; medieval: at towns; a primitive age: none).
- **Each crossing is recorded as ford, bridge or ferry,** and a settlement at a busy crossing grows, and is named for it ("-ford", "-bridge").
- **Navigable rivers** (big enough and gentle enough) are a road too, cheaper than land downstream and dearer upstream. Where boats stop (falls, rapids, a steep reach), goods change to wagons.
- **The sea** is cheapest of all, at about 1/40 of land, with the world's currents making it cheaper or dearer along them.
  - Ships load only at ports, and loading costs a day, so a short trip stays on land.
  - An early age keeps to coastal waters; a later one may cross open sea.

*From: ORBIS's costs and transfer cost, the fords of the Ouse and Oxford, the NPS ferries, Duncan-Jones's cost ratio.*

### Step 3. The settlements and their hierarchy

The story's own places are kept exactly where they are, and keep what they are. Around them, the generator settles the land as people would:

- **A settlement's pull** is the food the land round it can grow (warmth, water, soil, its biome), with more for a river, a coast, a confluence, a natural harbour or a ford.
- **Centres of three orders** are placed apart by central-place spacing at the map's own scale:
  - cities about 108 km apart;
  - towns about 36 km;
  - villages about 12 to 21 km. At a map whose cells are about 9 km across, a village dot stands for the main village of its district.
  - Spacing widens where the land feeds fewer, so a desert or a tundra has few, and a fertile plain many.
- **A desert's settlements** are its oases. **Mountain valleys** get villages; passes get a hospice or a fort at the top.
- **Each settlement makes something** from its land:
  - grain on fertile plains;
  - herds on grass and hills;
  - timber from forest;
  - ore from mountains;
  - salt and fish on the coast;
  - trade where routes meet.
- **Its name** is drawn from where it stands: a ford, a bridge, a river mouth, a hill, a pass, a market.

*From: Christaller; Bracton's market day; caravanserai spacing; Fulminante (centrality makes central places).*

### Step 4. Growing the network over centuries

The network is grown over four ages, not drawn at once. Each age routes the flows of trade over the network as it stands, then upgrades what was used.

1. **First paths.**
   - Every place walks to its market: a village to its nearest town, a town to its city.
   - Neighbours walk to each other.
   - Walking cost only: no wagons yet.
2. **Market roads.**
   - The age's vehicles arrive.
   - Gravity flows run between all places within a day or two, bigger places further: size × size ÷ cost², more where they make different things.
3. **Long-distance trade.**
   - Cities trade with cities across the whole land.
   - Ports open on the coast and navigable rivers.
   - States form round the capitals, and borders cost a toll at the crossings.
   - Bridges are built where a crossing is busy enough.
4. **The present.** Flows are routed again with everything built. Roads that lost their traffic stay on the map as **old roads**. Settlements that gained the most through-traffic grow a rank; those bypassed shrink.

In every age the flows are routed **largest first** (the sequential model's order). Each is laid along the least-cost path, and every cell already used becomes cheaper for the next:

- a path ×0.7;
- a road ×0.5;
- a highway ×0.4, the α the sequential model fitted.

Then every cell's use sets its rank:

- **path:** walked;
- **local road:** carts;
- **regional road:** between towns;
- **major road:** the cities' trade;
- **trade corridor:** a major road crossing a border with real trade.

Desert stretches become **caravan routes**, a road over a pass a **pass road**, and water a **river route** or **sea lane** by its use.

*From: the sequential model (order, α); the active walker (reinforcement and fading); Levinson and Yerra (rise and fall); Louf, Jensen and Barthelemy (cost and benefit); gravity models; Ullman's complementarity.*

### Step 5. States, borders and trade between countries

- **States** grow from the capitals (the story's capitals and those that rise from the biggest cities) across the land by travel cost. Their borders therefore fall on mountains, rivers and deserts, where travel is dear.
- **Each pair of neighbours is friendly, wary or hostile.** The campaign's own factions decide it where the world's realms belong to them; otherwise the world's seed does.
- **Crossing a border costs a toll:**
  - small between friends;
  - more between wary neighbours;
  - very large between enemies, whose trade is cut to a tenth.
- **Effect:** trade gathers at a few crossings (a customs post), mostly where a pass or a bridge already brings a road. Friends grow trade corridors; enemies have one guarded gate, or none.

*From: tolls and customs, security and the Silk Roads.*

### On the map

- **Lines by rank**, in the existing atlas style:
  - trade corridors and major roads heavy, on a pale edge;
  - regional roads plain;
  - local roads thin;
  - paths dotted;
  - caravan routes dashed sand-brown;
  - sea lanes and river routes blue.

  Bridges, fords and ferries get small signs, passes a pass sign, switchbacks a zig-zag when close.
- **What shows at each zoom:**
  - zoomed out: the cities and the corridors;
  - closer: towns and regional roads;
  - closest: villages, local roads and paths.

  The story's own places always show.
- **The story's own routes** are drawn along the network, not beside it. A route the game master drew or edited keeps its own way.
- **Clicking a settlement** of the network shows what it is, what it makes and its roads. The story's places still open their cities as before.
- **Roads into cities.** Where the network reaches one of the story's cities, the bearings of its roads are what the city is told when it is first laid out. Cities already made keep theirs.

### Testing

Several test worlds, each with a different kind of land:

- a mountain range across a continent;
- a river plain with a delta;
- a desert with oases;
- an archipelago;
- a highland;
- the showcase.

Each world is photographed with the network over the terrain and measured against the real figures in 1.8:

- the detour index;
- junction degrees;
- the share of main roads;
- road density;
- whether mountain crossings go through the lowest saddles;
- whether river crossings stand where the river is easiest;
- how many villages reach a market within a day;
- the share of trade that goes by water.

Where the generated network differs from real ones, the difference is written down, not explained away.

---

## 4. Levels of development (added 3 Nov 2026, at the user's request)

The user liked the network and asked for a slider of how developed the civilisation is. The default must be the network as it generated then.

**The scale it has to span:**

| Network | Length | Density |
|---|---|---|
| The medieval main roads of England and Wales on the Gough Map (c. 1360 to 1420; [UCL](https://www.ucl.ac.uk/early-medieval-atlas/map-data/routes-gough-map)) | almost 5,000 km | about **0.03 km per km²** |
| The Roman roads known today (Itiner-e) | 299,171 km | about 0.075 |
| England's turnpikes of the 1830s ([Bogart](https://gwern.net/doc/economics/2005-bogart.pdf); [Cambridge Campop](https://www.campop.geog.cam.ac.uk/research/projects/transport/futureplans/c19throads.html)) | about 20,000 miles, a fifth of all the roads there were | about 0.2 |
| A modern country (India, for example; [Statista](https://www.statista.com/statistics/1330966/india-road-density)) | 1 to 2 km per km² and more | |

The differences between ages lie less in how many lanes existed (the 1830s total of about 1.25 km per km² was already dense) than in how many were made and kept up as through roads, and in what was bridged.

**So the slider changes:**
- what is built: the steepest grade a vehicle takes;
- where bridges stand: none, at cities, at towns, at every busy crossing, everywhere;
- whether ships leave the coast;
- how many places each trades with;
- the highest rank of road;
- how readily a busy road is raised a rank;
- tunnels, at level 5.

It never changes the land, the settlements, their names or the borders.

Level 3 keeps the world's own age's engineering and is identical to the network first approved.

**The showcase world** (large, about 3,200 km across):

| Level | Road and track | Bridges | Fords | Ferries | Tunnels |
|---|---|---|---|---|---|
| 1 tribal | 53,500 km | 0 | 22 | 46 | 0 |
| 2 early civilisation | 64,000 km | 28 | 25 | 58 | 0 |
| 3 medieval | 96,300 km | 103 | 22 | 62 | 0 |
| 4 industrialising | 116,500 km | 175 | 17 | 32 | 0 |
| 5 modern | 127,000 km | 269 | 0 | 0 | 8 |

## 5. Results on six test worlds, and how they compare with real networks

**The worlds** (dev/roads-gallery.js in the workspace; pictures in dev/roads-gallery.html): six medium worlds, about 2,300 km across, each with 9.2 km cells:
- a continent with a great range;
- a wet coast of rivers;
- a desert;
- an archipelago;
- a cold highland;
- several continents.

Each was grown at all five levels.

**Measured at the default level 3:**

| World | Road per km² | Main roads | Junctions 3 / 4+ | Detour, median (90%) | Villages a day from market | Land more than a day from a road | Mountain crossings at the lowest saddle |
|---|---|---|---|---|---|---|---|
| Great range | 0.030 | 46% | 460 / 76 | 1.14 (1.78) | 91% | 20% | 1 of 2 |
| Wet coast | 0.029 | 33% | 379 / 68 | 1.11 (1.75) | 85% | 23% | 2 of 2 |
| Desert | 0.025 | 30% | 388 / 80 | 1.08 (1.44) | 91% | 38% | 3 of 3 |
| Archipelago | 0.026 | 4% | 27 / 0 | 1.14 (1.47) | 56% | 26% | 9 of 12 |
| Cold highland | 0.023 | 39% | 396 / 89 | 1.08 (1.62) | 68% | 36% | 5 of 5 |
| Several continents | 0.029 | 37% | 200 / 32 | 1.13 (1.48) | 86% | 22% | 2 of 2 |

"At the lowest saddle" means within 150 m of the lowest way over, in a corridor about the road.

**What agrees with real networks:**
- **The ranks.** Main roads are about a third of the length on the continents (30 to 46%; Itiner-e: about a third).
- **Junctions:**
  - Three-way junctions outnumber crossroads five or six to one, as on country road networks.
  - Many villages stand at the end of a single way.
- **Mountain crossings.** 22 of 26 measured crossings go over within 150 m of the lowest saddle in their corridor.
  - The four that do not are 300 to 700 m higher. In each the lower saddle lay well to one side, and the generator took the shorter, higher way, as the Gotthard did once it was bridged.
- **Rivers.** Crossings are mostly bridges at towns, with fords on smaller rivers and ferries on the great ones.
- **The desert** keeps its interior almost empty. Caravan routes run between waters along its rivers; its towns are on the wetter coasts and mountain flanks. 38% of its land lies more than a day from any road, against about 20% for the temperate worlds.
- **The archipelago's** trade goes mostly by sea: 14,900 km of sea lanes against 8,800 km of road.

**Where it differs, honestly:**
1. **The roads are too straight.** The median detour is 1.08 to 1.14. Real road networks are commonly reported at about 1.2 to 1.4 (not checked at their source here).
   - At 9 km cells the map cannot hold the bends real roads make round fields, woods and hills smaller than a cell.
   - Pulling each road straight wherever it costs no more removes the grid's steps, but straightens too.
   - Real roads would be about 10 to 25% longer than these.
2. **Fewer main roads than medieval England had.** Main roads come to about 0.010 to 0.014 km per km², against the Gough Map's 0.03 (England and Wales, densely settled and long united).
   - The cause is fewer towns. The map can show towns only about 36 to 55 km apart and cities about 110 to 130 km apart. Medieval England had a market town about every 10 to 15 km.
   - These worlds also have 20 to 38% wilderness.
   - Level 4 comes closer.
3. **Even level 5 is far below a modern country's density.** It shows the network between the settlements the map can draw, not every lane; a modern country's 1 to 2 km per km² is mostly local streets and lanes.
4. **Bridges at towns are a rule, not a finding.** At level 3 a bridge is built only where a town stands by a busy crossing. That every bridge is at a town is therefore by design, from the history of medieval bridges, not something the model discovered.
5. **Few mountain crossings were measured** (2 to 12 a world), because few roads cross the ranges at all; the figure needs more worlds to be firm.
6. **Not modelled:**
   - seasonal routes (passes closed in winter, as ORBIS does);
   - pilgrimage and military roads built for reasons other than trade;
   - the Roman habit of holding a straight line on purpose;
   - roads bent by who owned the land;
   - river navigation by season.

