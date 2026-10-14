/* Campaign Atlas: an invented city for the city map.

   For a story set in a city that does not exist. Given its name, its age and its part of the world, this lays out a
   believable skeleton (main roads, river or coast, walls, squares, parks, railway, districts, landmarks, street names
   in the right language) and writes the campaign's city.js. The city engine grows the side streets and the houses.

     age        medieval: gates, a wall, crooked lanes, a castle, a cathedral
                industrial: a boulevard where the wall stood, a railway and its station, gasworks, a park
                modern: a grid (or the old plan), a business quarter of towers, a stadium, a great park
     site       river | coast | harbour (a river mouth) | lake | plain
     culture    the language of the street names and the kind of great buildings

   Called from atlas.js:   node atlas.js city <campaign> --invent "Saltreach" [--year 1350 | --era medieval]
        [--site harbour] [--culture english] [--plan organic|grid] [--size town|city|metropolis] [--region ...] [--seed N]

   A site that is not a city (nothing is grown: only what a compound has):
        node atlas.js city <campaign> --invent "Stalag IX" --kind camp [--year 1943] [--ground grass|sand|dirt|snow] [--town]
        node atlas.js city <campaign> --invent "Camp Falcon" --kind base [--era modern] [--region desert] [--town] [--ruin 0.5]
     camp   a fenced camp of hut rows: double wire, watchtowers, a gate and gatehouse, a roll-call square, a railway
            siding and ramp, kitchens, infirmary, workshops, the guards' compound outside the wire
     base   a military base: a blast wall, towers, a guarded gate with a chicane, tent lines, a headquarters,
            helicopter pads and hangars, a fuel point, an ammunition point set apart, a mast
     --town   a small town beside it; --ruin 0 to 1 leaves that share of its houses roofless (a place fought over) */
"use strict";
const path = require("path");
const { eraOf, REGION_WORDS, mulberry32, plen, pip, writeCity, js } = require("./city-common.js");

const L = s => s.split("|");
// Each culture: main-street names; the pool and pattern for grown streets ({n} name, {s} kind of street); districts;
// rivers; holy names; what its great buildings are called. `faith` is the kind of landmark its places of worship are.
const CULTURES = {
  english: { faith: "church", title: n => `A Plan of the City of ${n}`, mains: L("High Street|Bridge Street|Castle Street|Market Street|Church Street|North Road|Mill Lane|Quay Street|King Street|Queen Street|Abbey Road|Station Road|Park Lane|Bishop's Way|Friar Street|Eastgate|Westgate|Long Acre|Broad Street|Guild Street"), names: null,
    districts: L("Old Town|Castle Hill|Northgate|The Shambles|Riverside|Tanners' End|Bishopsgate|The Liberties|Fishmarket|St Giles|Eastcheap|Friars' Quarter"), rivers: L("River Wend|River Lark|River Tame|River Calder|River Ouse"), holy: L("St Aldhelm|St Bride|St Oswin|St Cuthbert|St Hilda|St Edmund|St Swithun|St Mary"),
    cathedral: h => `${h}'s Cathedral`, church: h => `${h}'s`, castle: "The Castle", hall: "Guildhall", cityhall: "Town Hall", market: "Market Sq.", station: "Central Station", park: "Victoria Park", quay: "The Quay", ring: "The Ring", wall: "Wall Street", harbour: "The Harbour", lake: "The Mere", stadium: "The Athletic Ground", museum: "City Museum", university: "The University", light: "The Light", wheel: "The Great Wheel", rail: "Railway", tower: n => `${n} Tower` },
  american: { faith: "church", grid: true, numbered: true, title: n => `${n}`, mains: L("Main Street|Broadway|Market Street|Washington Avenue|Lincoln Avenue|Jefferson Street|Franklin Street|Madison Avenue|State Street|Union Street|Liberty Street|Grand Avenue|Park Avenue|Central Avenue|Canal Street|Water Street|Commerce Street|Pacific Avenue|Harbor Boulevard|Riverside Drive"),
    names: { pool: L("Maple|Oak|Elm|Cedar|Pine|Walnut|Chestnut|Spruce|Cherry|Locust|Adams|Monroe|Jackson|Harrison|Tyler|Polk|Taylor|Pierce|Grant|Hayes|Clay|Webster|Hamilton|Fulton|Carroll|Decatur|Perry|Laurel|Willow|Sycamore|Magnolia|Juniper|Front|Mill|Depot|Dock|Vine|Orchard|Prospect|Summit"), suffix: [L("Avenue|Boulevard|Street|Street"), L("Street|Street|Place|Street"), L("Alley|Court|Place|Row")] },
    districts: L("Downtown|Midtown|Uptown|The Waterfront|Chinatown|Little Italy|The Heights|Southside|Old Town|Riverside|The Flats|Financial District"), rivers: L("Cedar River|Black River|Fox River|Mohawk River|Eagle River"), holy: L("St. Patrick|St. Mary|St. Joseph|Trinity|Grace|St. Paul"),
    cathedral: h => `${h}'s Cathedral`.replace("Trinity's Cathedral", "Trinity Cathedral").replace("Grace's Cathedral", "Grace Cathedral"), church: h => `${h}'s Church`.replace("Trinity's", "Trinity").replace("Grace's", "Grace"), castle: "The Old Fort", hall: "County Courthouse", cityhall: "City Hall", market: "Market Sq.", station: "Union Station", park: "Central Park", quay: "Front Street", ring: "Beltway", wall: "Wall Street", harbour: "The Harbor", lake: "Lake Shore", stadium: "Memorial Stadium", museum: "Museum of Art", university: "State University", light: "Harbor Light", wheel: "Pier Wheel", rail: "Railroad", tower: n => `${n} Tower` },
  french: { faith: "church", title: n => `Plan de la Ville de ${n}`, mains: L("Grande Rue|Rue du Pont|Rue du Château|Rue Saint-Michel|Avenue de la Gare|Boulevard du Nord|Rue de la République|Rue Royale|Rue des Halles|Rue Notre-Dame|Cours Mirabeau|Rue de la Porte|Rue Saint-Jean|Boulevard de l'Est|Rue du Marché|Rue de l'Évêché|Avenue du Midi|Rue Haute|Rue Basse|Rue du Port"),
    names: { format: "{s} {n}", pool: L("de la Paix|du Temple|des Lombards|Saint-Jacques|des Tanneurs|de la Lune|des Carmes|de l'Arbre-Sec|du Chat-qui-Pêche|des Orfèvres|de la Harpe|du Four|des Rosiers|de la Huchette|Saint-Séverin|des Bouchers|du Puits|de la Cloche|des Trois-Rois|du Cygne|de l'Hirondelle|des Minimes|Mouffetard|de la Verrerie|des Archives|du Bac|des Marais|de la Clef|du Petit-Pont|des Augustins|Sainte-Catherine|de la Monnaie|des Cordeliers|du Renard|de la Lanterne|des Tonneliers"), suffix: [L("Rue|Avenue|Boulevard|Rue"), L("Rue|Rue|Passage|Ruelle"), L("Impasse|Cour|Passage|Ruelle")] },
    districts: L("Vieille Ville|Le Marais|Faubourg Saint-Antoine|La Cité|Les Halles|Quartier du Port|Faubourg du Nord|La Butte|Saint-Sauveur|Les Tanneries"), rivers: L("la Vire|la Sèvre|l'Orne|la Lys|l'Aure"), holy: L("Saint-Étienne|Notre-Dame|Saint-Michel|Sainte-Geneviève|Saint-Martin|Saint-Pierre"),
    cathedral: h => `Cathédrale ${h}`, church: h => `Église ${h}`, castle: "Le Château", hall: "Hôtel de Ville", cityhall: "Hôtel de Ville", market: "Place du Marché", station: "Gare Centrale", park: "Jardin Public", quay: "Quai des Orfèvres", ring: "Boulevard Circulaire", wall: "Rue des Remparts", harbour: "Le Port", lake: "Le Lac", stadium: "Stade Municipal", museum: "Musée des Beaux-Arts", university: "L'Université", light: "Le Phare", wheel: "La Grande Roue", rail: "Chemin de fer", tower: n => `Tour ${n}` },
  italian: { faith: "church", region: "mediterranean", title: n => `Pianta della Città di ${n}`, mains: L("Corso Vittorio|Via Roma|Via del Ponte|Via San Marco|Via del Castello|Via Garibaldi|Via Maggio|Via dei Mercanti|Via Santa Lucia|Via Larga|Corso Italia|Via della Porta|Via del Duomo|Via Nuova|Via dei Pellegrini|Via Cavour|Via del Mare|Borgo Ognissanti|Via San Giorgio|Via dell'Arsenale"),
    names: { format: "{s} {n}", pool: L("dei Calzaiuoli|del Corso|San Gallo|dei Servi|della Scala|dei Bardi|del Moro|dei Neri|delle Belle Donne|del Giglio|dei Tintori|della Vigna|del Leone|dei Fabbri|delle Oche|del Sole|della Luna|dei Pescatori|San Zanobi|dei Conciatori|della Spada|del Forno|dei Lanaioli|delle Campane|del Pozzo|dei Cappellai|Santa Chiara|dell'Orso|dei Vetrai|della Fontana|del Melograno|dei Barbieri|delle Rose|San Niccolò|dei Speziali|del Fico"), suffix: [L("Via|Corso|Via|Via"), L("Via|Vicolo|Via|Borgo"), L("Vicolo|Corte|Chiasso|Vicolo")] },
    districts: L("Centro Storico|Oltrefiume|Borgo San Lorenzo|Porta Nuova|San Frediano|Santa Croce|Borgo Vecchio|Il Porto|San Giovanni|Le Mura"), rivers: L("Fiume Serchio|Fiume Savio|Fiume Brenta|Fiume Lamone"), holy: L("San Marco|Santa Maria|San Lorenzo|Santa Chiara|San Giorgio|Sant'Agnese"),
    cathedral: h => `Duomo di ${h}`, church: h => `${h}`, castle: "La Rocca", hall: "Palazzo dei Priori", cityhall: "Palazzo Comunale", market: "Piazza del Mercato", station: "Stazione Centrale", park: "Giardini Pubblici", quay: "Lungomare", ring: "Viale dei Colli", wall: "Via delle Mura", harbour: "Il Porto", lake: "Il Lago", stadium: "Stadio Comunale", museum: "Museo Civico", university: "L'Università", light: "Il Faro", wheel: "La Ruota", rail: "Ferrovia", tower: n => `Torre ${n}` },
  spanish: { faith: "church", region: "mediterranean", title: n => `Plano de la Ciudad de ${n}`, mains: L("Calle Mayor|Gran Vía|Calle del Puente|Calle Real|Paseo del Prado|Calle de la Catedral|Calle del Castillo|Avenida de la Estación|Calle San Miguel|Calle Ancha|Calle Nueva|Calle del Mar|Paseo de la Alameda|Calle de la Puerta|Calle del Mercado|Avenida del Sur|Calle Alta|Calle de Toledo|Ronda de Levante|Calle del Carmen"),
    names: { format: "{s} {n}", pool: L("de la Luna|de los Herreros|del Sol|de la Cruz|de las Flores|del Pez|de los Tintes|de la Paloma|del Olmo|de los Reyes|de la Sal|del Ángel|de las Huertas|del Lobo|de la Espada|de los Curtidores|San Bernardo|de la Bola|del Pozo|de las Negras|de la Cabeza|del Humilladero|de los Cuchilleros|de la Pasa|Santa Ana|del Espejo|de los Estudios|de la Rosa|del Nuncio|de las Aguas|de la Villa|del Cordón|de los Mancebos|de la Morería|San Justo|del Toro"), suffix: [L("Calle|Avenida|Paseo|Calle"), L("Calle|Calle|Callejón|Cuesta"), L("Callejón|Pasaje|Travesía|Callejón")] },
    districts: L("Casco Viejo|El Arenal|La Latina|Triana|San Telmo|El Puerto|Barrio Alto|La Ribera|Santa Cruz|El Carmen"), rivers: L("Río Segre|Río Tormes|Río Genil|Río Arga"), holy: L("San Miguel|Santa María|San Isidro|Santa Ana|San Andrés|Santiago"),
    cathedral: h => `Catedral de ${h}`, church: h => `Iglesia de ${h}`, castle: "El Alcázar", hall: "Casa Consistorial", cityhall: "Ayuntamiento", market: "Plaza Mayor", station: "Estación Central", park: "Parque del Retiro", quay: "Paseo Marítimo", ring: "Ronda", wall: "Calle de la Muralla", harbour: "El Puerto", lake: "El Lago", stadium: "Estadio Municipal", museum: "Museo de Bellas Artes", university: "La Universidad", light: "El Faro", wheel: "La Noria", rail: "Ferrocarril", tower: n => `Torre ${n}` },
  german: { faith: "church", title: n => `Plan der Stadt ${n}`, mains: L("Hauptstraße|Marktstraße|Bahnhofstraße|Schlossstraße|Brückenstraße|Kaiserstraße|Lange Gasse|Königsallee|Domstraße|Breite Straße|Neue Straße|Hafenstraße|Klosterstraße|Torstraße|Wallstraße|Friedrichstraße|Am Ufer|Obere Gasse|Untere Gasse|Burgstraße"),
    names: { format: "{n}{s}", pool: L("Kirch|Müller|Bäcker|Gerber|Linden|Kloster|Schmied|Fischer|Wasser|Berg|Rosen|Garten|Mühlen|Tuch|Weber|Töpfer|Böttcher|Salz|Korn|Heu|Holz|Stein|Gold|Silber|Kupfer|Glocken|Engel|Löwen|Adler|Hirsch|Raben|Mond|Stern|Brunnen|Juden|Pfaffen|Bader|Seiler|Kohlen|Wein"), suffix: [L("straße|straße|allee|damm"), L("gasse|straße|weg|gasse"), L("gasse|gang|hof|twiete")] },
    districts: L("Altstadt|Neustadt|Am Hafen|Schlossberg|Gerberviertel|Vorstadt|Domviertel|Fischerviertel|Oberstadt|Unterstadt"), rivers: L("die Ilm|die Saale|die Nidda|die Wupper"), holy: L("St. Marien|St. Nikolai|St. Peter|St. Georg|St. Katharinen|St. Jakobi"),
    cathedral: h => `Dom ${h}`, church: h => `${h}`, castle: "Die Burg", hall: "Rathaus", cityhall: "Rathaus", market: "Marktplatz", station: "Hauptbahnhof", park: "Stadtpark", quay: "Am Kai", ring: "Ringstraße", wall: "Am Wall", harbour: "Der Hafen", lake: "Der See", stadium: "Stadion", museum: "Stadtmuseum", university: "Die Universität", light: "Leuchtturm", wheel: "Riesenrad", rail: "Eisenbahn", tower: n => `${n}turm` },
  arabic: { faith: "mosque", region: "desert", title: n => `A Plan of ${n}`, mains: L("Sharia al-Kabir|Sharia al-Suq|Tariq al-Bahr|Sharia al-Qal'a|Sharia Bab al-Sharq|Sharia al-Jami|Tariq al-Qawafil|Sharia al-Nil|Sharia Bab al-Gharb|Sharia al-Sultan|Tariq al-Hajj|Sharia al-Mina|Sharia al-Wali|Sharia al-Bustan|Sharia Bab al-Bahr|Sharia al-Khalifa|Tariq al-Sham|Sharia al-Hamra|Sharia al-Nasr|Sharia al-Zaytun"),
    names: { format: "{s} {n}", pool: L("al-Attarin|al-Nahhasin|al-Khayyatin|al-Warraqin|al-Saffarin|al-Qasr|al-Nakhl|al-Hammam|al-Qadi|al-Ward|al-Yasmin|al-Bab|al-Najjarin|al-Dabbaghin|al-Sabbaghin|al-Haddadin|al-Sayyadin|al-Fakhkharin|al-Sagha|al-Khabbazin|al-Tujjar|al-Hakim|al-Mu'allim|al-Darwish|al-Ghazal|al-Hamam|al-Bi'r|al-Sabil|al-Zahra|al-Qamar|al-Nujum|al-Tin|al-Rumman|al-Khan|al-Funduq|al-Madrasa"), suffix: [L("Sharia|Sharia|Tariq|Sharia"), L("Darb|Sharia|Zuqaq|Darb"), L("Zuqaq|Atfat|Darb|Zuqaq")] },
    districts: L("Al-Madina|Al-Qasba|Al-Mina|Bab al-Sharq|Al-Suq|Al-Jadida|Al-Bustan|Harat al-Nahhasin|Bab al-Bahr|Al-Rabad"), rivers: L("Wadi al-Nahr|Nahr al-Zarqa|Wadi al-Ward"), holy: L("al-Nur|al-Fath|al-Rahma|al-Azhar|al-Sultan|al-Aqmar"),
    cathedral: () => "The Great Mosque", church: h => `Masjid ${h}`, castle: "Al-Qal'a", hall: "Dar al-Imara", cityhall: "Dar al-Baladiya", market: "Al-Suq", station: "Central Station", park: "Hadiqat al-Nakhil", quay: "Al-Kurnish", ring: "Sharia al-Sur", wall: "Darb al-Sur", harbour: "Al-Mina", lake: "Al-Birka", stadium: "The Stadium", museum: "The Museum", university: "Al-Jami'a", light: "Al-Manara", wheel: "The Wheel", rail: "Railway", tower: n => `Burj ${n}` },
  japanese: { faith: "pagoda", region: "eastasia", grid: true, title: n => `${n}`, mains: L("Chuo-dori|Ote-dori|Kawabata-dori|Shiro-dori|Teramachi-dori|Ekimae-dori|Sakura-dori|Honmachi-dori|Minato-dori|Showa-dori|Kokusai-dori|Hachiman-dori|Midosuji|Karasuma-dori|Oike-dori|Higashiyama-dori|Sanjo-dori|Shijo-dori|Gojo-dori|Kaigan-dori"),
    names: { format: "{n}{s}", pool: L("Sakura|Matsu|Kawa|Yama|Hana|Tera|Hashi|Ume|Take|Ishi|Kita|Minami|Higashi|Nishi|Naka|Kami|Shimo|Tsuki|Kumo|Kaze|Mizu|Mori|Ike|Fuji|Kiku|Momiji|Tsuru|Kame|Yanagi|Sugi|Hinoki|Tachibana|Ayame|Hagi|Kiri|Susuki"), suffix: [L("-dori|-dori|-odori|-dori"), L("-dori|-koji|-cho|-suji"), L("-koji|-yokocho|-roji|-koji")] },
    districts: L("Honmachi|Teramachi|Kawaramachi|Minato|Shiroyama|Uemachi|Shitamachi|Sakuragaoka|Nakanoshima|Higashiyama"), rivers: L("Kamo-gawa|Sumi-gawa|Asa-gawa|Yodo-gawa"), holy: L("Kofuku-ji|Zenko-ji|Myoshin-ji|Hachiman-gu|Inari-jinja|Tenman-gu"),
    cathedral: h => h, church: h => h, castle: "The Castle", hall: "Machi-bugyosho", cityhall: "City Hall", market: "Ichiba", station: "Chuo Station", park: "Chuo Koen", quay: "Kaigan-dori", ring: "Kanjo-sen", wall: "Sotobori-dori", harbour: "The Port", lake: "The Lake", stadium: "Prefectural Stadium", museum: "City Museum", university: "The University", light: "The Lighthouse", wheel: "The Great Wheel", rail: "Railway", tower: n => `${n} Tower` },
  fantasy: { faith: "church", title: n => `A True Map of ${n}`, mains: L("Kingsway|Processional Way|Gallowgate|Lantern Street|Wyrm Street|Templegate|Coin Street|The Long Stair|Saltway|Thornwall|Chandlers' Row|Moonbridge Street|Ashgate|Oracle Road|Beggars' Walk|Sword Street|The Glass Mile|Pilgrims' Way|Ravengate|Kettle Lane"),
    names: { pool: L("Gallows|Lantern|Wyrm|Raven|Ember|Cinder|Moon|Thorn|Silver|Ash|Whisper|Bone|Candle|Copper|Dagger|Elder|Fen|Glass|Hollow|Iron|Jackdaw|Kettle|Lark|Mist|Nettle|Owl|Pilgrim|Quill|Rook|Salt|Tallow|Umber|Vesper|Widow|Yarrow|Sable|Gull|Cobble|Hex|Mummer"), suffix: [L("Street|Way|Street|Road|Row|Gate"), L("Lane|Street|Row|Walk|Steps|Lane"), L("Alley|Court|Yard|Close|Stair|Wynd")] },
    districts: L("The Old Ward|Templeside|The Warrens|Lanternmarket|Highcastle|The Sinks|Guildhall Ward|Saltside|Scriveners' Ward|Beggars' Rest"), rivers: L("the Wyrmwater|the Blackrun|the Silverflow|the Greywash"), holy: L("the Lantern-Bearer|the Drowned King|the Grey Lady|the Twin Moons|the Smith|the Weaver"),
    cathedral: h => `High Temple of ${h}`, church: h => `Shrine of ${h}`, castle: "The Citadel", hall: "Guildhall", cityhall: "Council House", market: "Grand Market", station: "The Terminus", park: "The King's Garden", quay: "The Strand", ring: "The Girdle", wall: "Wallwalk", harbour: "The Haven", lake: "The Mere", stadium: "The Arena", museum: "The Collegium", university: "The Academy", light: "The Beacon", wheel: "The Great Wheel", rail: "Iron Road", tower: n => `${n} Spire` }
};
const ordinal = n => n + (n % 100 > 10 && n % 100 < 14 ? "th" : ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][n % 10]);

function inventCity(dir, name, flags, log) {
  log = log || console.log;
  if (!name || name === true) throw new Error('What is the city called? node atlas.js city <campaign> --invent "Name"');
  const kind = String(flags.kind && flags.kind !== true ? flags.kind : "city").toLowerCase();
  if (kind === "camp" || kind === "base") return inventSite(dir, name, flags, kind, log);
  if (kind !== "city") throw new Error(`unknown kind "${flags.kind}": use city, camp or base`);
  const { era, year, look } = eraOf(flags), ck = String(flags.culture && flags.culture !== true ? flags.culture : "english").toLowerCase(), C = CULTURES[ck];
  if (!C) throw new Error(`unknown culture "${flags.culture}": use one of ${Object.keys(CULTURES).join(", ")}`);
  const size = String(flags.size && flags.size !== true ? flags.size : "city").toLowerCase(), dims = { town: [250, 160], city: [320, 200], metropolis: [400, 250] }[size];
  if (!dims) throw new Error(`unknown size "${flags.size}": use town, city or metropolis`);
  const site = String(flags.site && flags.site !== true ? flags.site : "river").toLowerCase().replace("port", "harbour").replace("sea", "coast").replace("inland", "plain").replace("desert", "plain").replace("oasis", "lake");
  if (!["river", "coast", "harbour", "lake", "plain"].includes(site)) throw new Error(`unknown site "${flags.site}": use river, coast, harbour, lake or plain`);
  const plan = String(flags.plan && flags.plan !== true ? flags.plan : (era === "modern" || C.grid) ? "grid" : "organic").toLowerCase();
  const region = flags.region && flags.region !== true ? (REGION_WORDS[String(flags.region).toLowerCase()] ?? String(flags.region)) : C.region || "";
  let seed = flags.seed && flags.seed !== true ? parseInt(flags.seed, 10) : 0; if (!seed) { for (const ch of name + era + site) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0; seed = seed % 100000 + 1; }
  const rnd = mulberry32(seed * 7 + 3), R = (a, b) => a + (b - a) * rnd(), pick = a => a[Math.floor(rnd() * a.length)], shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const [SW, SH] = dims, M = 30, X0 = -M, Y0 = -M, X1 = SW + M, Y1 = SH + M, wet = site === "coast" || site === "harbour";
  const cx = SW * R(.46, .54), cy = SH * (wet ? R(.36, .42) : R(.45, .53)), RC = Math.min(SW, SH) * (era === "medieval" ? .3 : .27);
  const mains = shuffle(C.mains), holy = shuffle(C.holy), dnames = C.districts.slice(0, 1).concat(shuffle(C.districts.slice(1)));
  let mi = 0; const mainName = () => mains[mi++ % mains.length];
  const rpool = C.names ? C.names.pool : L("Swan|Crown|Anchor|Mitre|Bell|Angel|Plough|Pump|Tenter|Dyer|Tanner|Cooper|Chandler|Weaver|Salter|Fuller|Wheeler|Turner|Harrow|Magpie|Feathers|Rope|Tallow|Candle|Mulberry|Raven|Rook|Mill|Chapel|Friar|Abbey|Mint|Orchard|Forge|Falcon|Stag|Lantern|Beacon|Ferry|Willow"), rsuf = C.names ? C.names.suffix : [L("Street|Road|Row|Place"), L("Lane|Street|Row|Walk"), L("Alley|Court|Yard|Passage")], used = new Set(C.mains);
  const streetName = cls => { for (let t = 0; t < 40; t++) { const a = pick(rpool), b = pick(rsuf[Math.max(0, Math.min(2, cls - 1))]), nm = C.names && C.names.format ? C.names.format.replace("{n}", a).replace("{s}", b) : a + " " + b; if (!used.has(nm)) { used.add(nm); return nm; } } return ""; };

  // ---- water
  const rivers = [], basins = [], signs = [];
  const ph1 = R(0, 6.28), ph2 = R(0, 6.28), bayX = cx + R(-22, 22), bayW = R(22, 30), bayD = R(12, 18);
  const seaY = x => SH * .76 + 8 * Math.sin(x / 47 + ph1) + 4 * Math.sin(x / 19 + ph2) - bayD * Math.exp(-(((x - bayX) / bayW) ** 2));
  if (wet) { const pts = []; for (let x = X0 - 10; x <= X1 + 10; x += 6) pts.push([x, seaY(x)]); pts.push([X1 + 10, Y1 + 10], [X0 - 10, Y1 + 10]); basins.push({ name: "", pts }); signs.push([bayX, seaY(bayX) + 16, C.harbour]); }
  let lake = null;
  if (site === "lake") { const lx = SW * (rnd() < .5 ? .14 : .86), ly = SH * R(.2, .8), lr = Math.min(SW, SH) * R(.26, .34); lake = Array.from({ length: 26 }, (_, i) => { const a = i / 26 * 6.2832, r = lr * (1 + .16 * Math.sin(a * 3 + ph1) + .09 * Math.sin(a * 5 + ph2)); return [lx + r * Math.cos(a), ly + r * .8 * Math.sin(a)]; }); basins.push({ name: C.lake, pts: lake }); }
  let river = null; const rhw = { town: 3.2, city: 4.4, metropolis: 5.6 }[size];
  if (site === "river" || site === "harbour") {
    const ns = site === "harbour" || rnd() < .3, amp = R(9, 16), off = (rnd() < .5 ? -1 : 1) * R(15, 24), pts = [];
    if (ns) { const xr = site === "harbour" ? bayX : cx + off; for (let y = Y0 - 10; y <= (site === "harbour" ? seaY(bayX) + 6 : Y1 + 10); y += 16) pts.push([xr + (site === "harbour" ? (cx + off - bayX) * Math.max(0, 1 - (y - Y0) / (cy - Y0 + 30)) : 0) + amp * Math.sin(y / 38 + ph1), y]); }
    else for (let x = X0 - 10; x <= X1 + 10; x += 18) pts.push([x, cy + Math.abs(off) + amp * Math.sin(x / 52 + ph1) + amp * .4 * Math.sin(x / 23 + ph2)]);
    river = pts; rivers.push({ pts, hw: rhw, smooth: 2, label: pick(C.rivers), big: rhw > 4 && !ns, wharves: era === "modern" ? undefined : [cx - 70, cx + 70] });
  }
  const segD = (x, y, pts) => { let best = 1e9; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l ? ((x - ax) * dx + (y - ay) * dy) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return best; };
  const inSea = (x, y, m = 0) => wet && y > seaY(x) - m, inLake = (x, y, m = 0) => !!lake && (pip(x, y, lake) || (m > 0 && segD(x, y, [...lake, lake[0]]) < m)), onRiver = (x, y, m = 0) => !!river && segD(x, y, river) < rhw + m;
  const dry = (x, y, m = 2) => !inSea(x, y, m) && !inLake(x, y, m) && !onRiver(x, y, m);
  const onSheet = (x, y, m = 0) => x >= m && x <= SW - m && y >= m && y <= SH - m;
  // a spot near (x, y) that is on dry land and on the sheet
  const land = (x, y, m = 4) => { for (let r = 0; r < 60; r += 3) for (let a = 0; a < 6.28; a += .7) { const px = x + r * Math.cos(a), py = y + r * Math.sin(a); if (onSheet(px, py, 8) && dry(px, py, m)) return [px, py]; } return [x, y]; };

  const roads = [], walls = [], rails = [], parks = [], plazas = [], landmarks = [], gasworks = [], districts = {};
  // a road is kept only where it runs on land; the sea and a lake end it, and only main roads and streets bridge the river
  const lay = (name, cls, pts, opt) => {
    const dense = []; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 1.5)); for (let q = i === 1 ? 0 : 1; q <= n; q++) dense.push([ax + (bx - ax) * q / n, ay + (by - ay) * q / n]); }
    let run = [], first = true;
    const flush = () => { if (run.length > 1 && plen(run) >= 7) { const keep = opt && opt.straight ? [run[0], run[run.length - 1]] : run.filter((_, i) => i % 6 === 0 || i === run.length - 1); roads.push([first || cls < 2 ? name : "", cls, keep]); first = false; } run = []; };
    for (const p of dense) { const ok = p[0] > X0 - 4 && p[0] < X1 + 4 && p[1] > Y0 - 4 && p[1] < Y1 + 4 && !inSea(p[0], p[1], 1.5) && !inLake(p[0], p[1], 1.5) && !(cls >= 2 && onRiver(p[0], p[1], 1.5)) && !(opt && opt.avoid && opt.avoid(p[0], p[1])); if (ok) run.push(p); else flush(); }
    flush();
  };
  const mark = (name, kind, x, y, o) => { const [px, py] = land(x, y); landmarks.push(Object.assign({ name, kind, at: [px, py] }, o || {})); return [px, py]; };

  let heights, extra = {};
  if (plan === "grid") {
    // ---- a grid: streets one way, avenues the other, every few of them a main road; one diagonal; a great park
    const th = wet ? 0 : R(-.2, .2), ux = Math.cos(th), uy = Math.sin(th), vx = -uy, vy = ux, sx = era === "modern" ? 26 : 22, sy = era === "modern" ? 15 : 13, span = Math.hypot(X1 - X0, Y1 - Y0);
    const at = (j, k) => [cx + ux * j * sx + vx * k * sy, cy + uy * j * sx + vy * k * sy];
    const pk = { j0: (rnd() < .5 ? -4 : 2), k0: -2 - Math.floor(R(0, 2)), w: 2, h: 3 }, pc = [at(pk.j0, pk.k0), at(pk.j0 + pk.w, pk.k0), at(pk.j0 + pk.w, pk.k0 + pk.h), at(pk.j0, pk.k0 + pk.h)];
    const inPark = (x, y) => pip(x, y, pc);
    if (pc.every(p => dry(p[0], p[1]) && onSheet(p[0], p[1], 4))) parks.push({ name: C.park, pts: pc, trees: .7 });
    const avoid = parks.length ? (x, y) => inPark(x, y) : null, nK = Math.ceil(span / sy / 2) + 1, nJ = Math.ceil(span / sx / 2) + 1;
    let stN = 0, avN = 0;
    for (let k = -nK; k <= nK; k++) { const cls = k % 4 === 0 ? 0 : k % 2 === 0 ? 1 : 2, a = at(-nJ, k), b = at(nJ, k); lay(C.numbered ? (cls === 0 && k === 0 ? mainName() : `${ordinal(k + nK + 1)} Street`) : cls === 0 ? mainName() : streetName(cls), cls, [a, b], { straight: true, avoid }); stN++; }
    for (let j = -nJ; j <= nJ; j++) { const cls = j % 3 === 0 ? 0 : 1, a = at(j, -nK), b = at(j, nK); lay(cls === 0 ? mainName() : C.numbered ? `${ordinal(j + nJ + 1)} Avenue` : streetName(1), cls, [a, b], { straight: true, avoid }); avN++; }
    { const d = rnd() < .5 ? 1 : -1, a = at(-nJ * .8, -nK * .8 * d), b = at(nJ * .8, nK * .8 * d); lay(mainName(), 0, [a, b], { straight: true, avoid }); }
    if (wet) lay(C.quay, 0, Array.from({ length: 40 }, (_, i) => { const x = X0 + (X1 - X0) * i / 39; return [x, seaY(x) - 4]; }));
    const block = (j, k) => { const [x, y] = at(j + .5, k + .5); return [x, y]; }, taken = new Set(), free = (j, k) => { const key = j + "," + k, [x, y] = block(j, k); if (taken.has(key) || !onSheet(x, y, 12) || !dry(x, y, 7) || inPark(x, y)) return null; taken.add(key); return [x, y]; };
    const spot = (j, k) => { for (let r = 0; r < 7; r++) for (let dj = -r; dj <= r; dj++) for (let dk = -r; dk <= r; dk++) { if (Math.max(Math.abs(dj), Math.abs(dk)) !== r) continue; const p = free(j + dj, k + dk); if (p) return p; } return null; };
    plazas.push({ name: C.market, pts: [at(-.42, -.4), at(.42, -.4), at(.42, .4), at(-.42, .4)] });
    const put = (nm, kind, j, k, o) => { const p = spot(j, k); if (p) landmarks.push(Object.assign({ name: nm, kind, at: p, ang: th }, o || {})); return p; };
    put(C.cityhall, "hall", 0, -1, { top: "dome", size: 1.2, major: true });
    put(C.cathedral(holy[0]), C.faith, -1, 0, C.faith === "church" ? { top: "twin", size: 1.3, major: true } : { size: 1.3, major: true });
    put(C.museum, "hall", 1, 1, { size: 1.3 });
    for (let i = 1; i < 4; i++) put(C.church(holy[i % holy.length]), C.faith, Math.round(R(-5, 5)), Math.round(R(-6, 6)), { size: .8, label: false });
    if (era !== "medieval") {
      const kr = (rnd() < .5 ? -1 : 1) * (Math.floor(nK * .45) + .5), ra = at(-nJ, kr), rb = at(nJ, kr); rails.push({ name: C.rail, pts: [ra, at(-nJ / 2, kr), at(0, kr), at(nJ / 2, kr), rb] });
      put(C.station, "hall", 0, Math.round(kr + (kr > 0 ? -1 : 0)), { size: 1.5, major: true }); put(C.university, "hall", -4, 3, { size: 1.5 }); put(C.stadium, "stadium", 5, -4, { size: 1.1 });
    } else { const w = [at(-3.5, -4.5), at(3.5, -4.5), at(3.5, 4.5), at(-3.5, 4.5), at(-3.5, -4.5)]; let run = []; for (let i = 1; i < w.length; i++) for (let q = 0; q <= 20; q++) { const p = [w[i - 1][0] + (w[i][0] - w[i - 1][0]) * q / 20, w[i - 1][1] + (w[i][1] - w[i - 1][1]) * q / 20]; if (dry(p[0], p[1], 1)) run.push(p); else { if (run.length > 2) walls.push({ pts: run }); run = []; } } if (run.length > 2) walls.push({ pts: run }); put(C.castle, "castle", 3, -4, { size: .9, major: true }); }
    if (era === "modern") {
      // downtown: the quarter stands tall round a point a little off the centre, and its towers are landmarks
      const dj = Math.round(R(-2, 2)), dk = Math.round(R(1, 3)) * (rnd() < .5 ? -1 : 1), [dx, dy] = at(dj, dk), sig = RC * .8, cell = 16, cols = Math.ceil((X1 - X0) / cell), rows = Math.ceil((Y1 - Y0) / cell), v = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = X0 + (c + .5) * cell, y = Y0 + (r + .5) * cell, h = 19 * Math.exp(-(((x - dx) ** 2 + (y - dy) ** 2) / (sig * sig))); v.push(h < 3.2 ? 0 : Math.round(h * 10) / 10); }
      heights = { cell, cols, rows, x0: X0, y0: Y0, v };
      const nT = { town: 5, city: 10, metropolis: 16 }[size];
      for (let i = 0; i < nT; i++) { const p = spot(dj + Math.round(R(-2.4, 2.4)), dk + Math.round(R(-3, 3))); if (!p) continue; const h = i === 0 ? R(52, 62) : R(18, 40); landmarks.push({ name: i === 0 ? C.tower(name) : i < 4 ? C.tower(pick(rpool)) : "", kind: "tower", at: p, ang: th, h, size: i === 0 ? 1.25 : R(.85, 1.15), top: i === 0 || h > 36 ? "taper" : "", major: i === 0, label: i < 4 }); }
      if (wet) { const x = cx + R(40, 70) * (rnd() < .5 ? -1 : 1); landmarks.push({ name: C.wheel, kind: "wheel", at: [x, seaY(x) - 9], ang: 0 }); }
      extra = { grow: false, wobble: 0, wharf: js("() => false") };
    } else extra = { grow: false, wobble: 0 };
    if (wet) { const x = bayX + bayW * 1.15; landmarks.push({ name: C.light, kind: "spire", top: "light", at: [x, seaY(x) - 3], h: 5 }); }
    const dq = [[0, 0], [-4, -4], [4, -4], [-4, 4], [4, 4], [0, -6], [0, 6]];
    for (let i = 0, n = 0; i < dq.length && n < (size === "town" ? 4 : 6); i++) { const [x, y] = at(dq[i][0], dq[i][1]); if (onSheet(x, y, 26) && dry(x, y, 6)) districts[dnames[n++ % dnames.length]] = [x, y]; }
  } else {
    // ---- the old plan: roads from the gates to the market, a wall or the boulevard that replaced it, streets between
    const nA = size === "town" ? 5 : Math.floor(R(5, 7.99)), a0 = R(0, 6.28), arms = [];
    const wob = a => 1 + .1 * Math.sin(a * 3 + ph1) + .06 * Math.sin(a * 5 + ph2), ringPt = (a, r) => [cx + r * wob(a) * Math.cos(a), cy + r * wob(a) * .86 * Math.sin(a)];
    for (let i = 0; i < nA; i++) {
      const a = a0 + i * 6.2832 / nA + R(-.22, .22), pts = [[cx, cy]]; let x = cx, y = cy, h = a;
      for (let s = 0; s < 30; s++) { h += R(-.12, .12) + (a - h) * .3; x += Math.cos(h) * 22; y += Math.sin(h) * 22; pts.push([x, y]); if (x < X0 - 6 || x > X1 + 6 || y < Y0 - 6 || y > Y1 + 6) break; }
      arms.push(a); lay(mainName(), 0, pts);
    }
    arms.sort((p, q) => p - q);
    const ring = (r, from, to) => { const pts = []; for (let a = from; a <= to + 1e-6; a += .16) pts.push(ringPt(a, r)); return pts; };
    const walled = era === "medieval" || flags.walls;
    lay(walled ? C.wall : streetName(1), 1, ring(RC - 5, 0, 6.2832));
    if (walled) { let run = []; for (const p of ring(RC, 0, 6.2832)) { if (dry(p[0], p[1], .5) && p[0] > X0 && p[0] < X1 && p[1] > Y0 && p[1] < Y1) run.push(p); else { if (run.length > 2) walls.push({ pts: run }); run = []; } } if (run.length > 2) walls.push({ pts: run }); }
    else lay(C.ring, 0, ring(RC + 3, 0, 6.2832));
    for (let i = 0; i < arms.length; i++) { const a = arms[i], b = i + 1 < arms.length ? arms[i + 1] : arms[0] + 6.2832; lay(streetName(1), 1, ring(RC * .52, a, b)); if ((b - a) > .5) lay(streetName(1), 1, ring(RC * R(1.45, 1.8), a + .06, b - .06)); }
    if (wet) lay(C.quay, 1, Array.from({ length: 40 }, (_, i) => { const x = cx - 110 + 220 * i / 39; return [x, seaY(x) - 3.6]; }));
    plazas.push({ name: C.market, pts: Array.from({ length: 8 }, (_, i) => [cx + 5.2 * Math.cos(i / 8 * 6.2832 + .39), cy + 4.4 * Math.sin(i / 8 * 6.2832 + .39)]) });
    const bis = i => (arms[i] + (i + 1 < arms.length ? arms[i + 1] : arms[0] + 6.2832)) / 2, big = arms.map((_, i) => i).sort((p, q) => ((q + 1 < arms.length ? arms[q + 1] : arms[0] + 6.2832) - arms[q]) - ((p + 1 < arms.length ? arms[p + 1] : arms[0] + 6.2832) - arms[p]));
    const polar = (a, r) => ringPt(a, r);
    { const [x, y] = polar(bis(big[0]), 13); mark(C.cathedral(holy[0]), C.faith, x, y, C.faith === "church" ? { top: era === "medieval" ? "twin" : "", size: 1.25, major: true } : { size: 1.25, major: true }); }
    { const [x, y] = polar(bis(big[1 % big.length]), 12); mark(era === "medieval" ? C.hall : C.cityhall, "hall", x, y, { top: era === "medieval" ? "spire" : "dome", size: 1.05, major: true }); }
    if (era === "medieval" || rnd() < .45) { const [x, y] = polar(bis(big[2 % big.length]), RC - 9); mark(C.castle, "castle", x, y, { major: true, size: era === "medieval" ? 1 : .8 }); }
    for (let i = 1; i <= (size === "town" ? 2 : 4); i++) { const [x, y] = polar(bis(i % arms.length) + R(-.25, .25), RC * R(.55, 1.5)); mark(C.church(holy[i % holy.length]), C.faith, x, y, { size: .75, label: i < 3 }); }
    if (wet) { const x = bayX + bayW * 1.15; landmarks.push({ name: C.light, kind: "spire", top: "light", at: [x, seaY(x) - 3], h: 5 }); }
    if (era !== "medieval") {
      const ra = bis(big[0]) + Math.PI, n = [Math.cos(ra), Math.sin(ra)], d = RC + 20, t = [-n[1], n[0]], pt = s => [cx + n[0] * d + t[0] * s + n[0] * (s * s) / 1400, cy + n[1] * d * .86 + t[1] * s + n[1] * (s * s) / 1400];
      rails.push({ name: C.rail, pts: [-260, -130, -50, 0, 50, 130, 260].map(pt) });
      const [sx, sy] = mark(C.station, "hall", cx + n[0] * (d - 7), cy + n[1] * (d - 7) * .86, { size: 1.4, major: true });
      if (era === "industrial") for (let i = 0; i < 3; i++) { const s = R(40, 110) * (i % 2 ? 1 : -1), [gx, gy] = pt(s); if (onSheet(gx - n[0] * 8, gy - n[1] * 8, 10) && dry(gx - n[0] * 8, gy - n[1] * 8, 6)) gasworks.push([gx - n[0] * 8, gy - n[1] * 8, R(2.4, 3.4)]); }
      const pa = bis(big[1 % big.length]), [px, py] = land(...polar(pa, RC * 1.75), 10), pr = R(15, 22);
      parks.push({ name: C.park, pts: Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.2832, r = pr * (1 + .18 * Math.sin(a * 3 + ph2)); return [px + r * Math.cos(a), py + r * .8 * Math.sin(a)]; }), trees: .7 });
      void sx; void sy;
    }
    if (era === "modern") {
      const da = bis(big[2 % big.length]), [dx, dy] = polar(da, RC * 1.25), sig = RC * .7, cell = 16, cols = Math.ceil((X1 - X0) / cell), rows = Math.ceil((Y1 - Y0) / cell), v = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = X0 + (c + .5) * cell, y = Y0 + (r + .5) * cell, h = 17 * Math.exp(-(((x - dx) ** 2 + (y - dy) ** 2) / (sig * sig))); v.push(h < 3.2 ? 0 : Math.round(h * 10) / 10); }
      heights = { cell, cols, rows, x0: X0, y0: Y0, v };
      for (let i = 0; i < (size === "town" ? 4 : 9); i++) { const [x, y] = land(dx + R(-sig, sig) * .8, dy + R(-sig, sig) * .8, 6), h = i === 0 ? R(46, 56) : R(16, 34); if (landmarks.some(q => Math.hypot(q.at[0] - x, q.at[1] - y) < 9)) continue; landmarks.push({ name: i === 0 ? C.tower(name) : i < 3 ? C.tower(pick(rpool)) : "", kind: "tower", at: [x, y], h, top: i === 0 ? "taper" : "", major: i === 0, label: i < 3 }); }
      mark(C.stadium, "stadium", ...polar(bis(big[0]) + 2.2, RC * 2.1), { size: 1 });
      extra = { wharf: js("() => false") };
    }
    districts[dnames[0]] = [cx, cy + (walled ? 0 : 2)];
    for (let i = 0, n = 1; i < arms.length && n < (size === "town" ? 4 : 6); i++) { const [x, y] = polar(bis(i), RC * 1.75); if (onSheet(x, y, 26) && dry(x, y, 6) && Object.values(districts).every(q => Math.hypot(q[0] - x, q[1] - y) > 50)) districts[dnames[n++]] = [x, y]; }
    const core = RC.toFixed(0), X = cx.toFixed(0), Y = cy.toFixed(0), side = rnd() < .5 ? 1 : -1;
    Object.assign(extra, {
      crooked: js(`(x, y) => Math.hypot(x - ${X}, y - ${Y}) < ${core} ? 1 : ${era === "medieval" ? .7 : .3}`),
      rich: js(`x => Math.max(0, Math.min(1, .5 + ${side} * (${X} - x) / 170))`), grand: js(`x => ${side > 0 ? `x < ${(cx - 25).toFixed(0)}` : `x > ${(cx + 25).toFixed(0)}`}`),
      height: js(`(x, y) => Math.hypot(x - ${X}, y - ${Y}) < ${core} ? 1.12 : 1`)
    });
  }

  const data = Object.assign({
    look, region: region || undefined, seed, sheet: { w: SW, h: SH, margin: M },
    title: C.title(name), subtitle: year != null ? `in the year ${year}` : "", scaleLabel: era === "modern" ? "Scale" : "Scale of Chains",
    invented: { name, era, year, site, culture: ck, plan, size },
    names: C.names || undefined, districts, roads, rivers, basins, parks, plazas, rails, walls, gasworks: gasworks.length ? gasworks : undefined, signs, landmarks, heights,
    boats: river || wet ? (era === "modern" ? 12 : 34) : 0
  }, extra);
  const file = writeCity(dir, data, [
    `${name}: an invented city, laid out by: atlas.js city --invent "${name}" ${year != null ? "--year " + year : "--era " + era} --site ${site} --culture ${ck} --plan ${plan} --size ${size} --seed ${seed}`,
    "The same command with the same seed lays out the same city; another seed, another city.",
    "This file is rewritten whenever the city is generated again. Put your own changes in campaign.js:",
    '  ATLAS.cityEdit(c => { c.title = "..."; c.landmarks.push({ name, kind, at: [x, y] }); c.districts["The Rookery"] = [x, y]; });'
  ]);
  log(`wrote ${path.relative(process.cwd(), file) || file}: ${name}, an invented ${era} ${size} (${plan} plan, ${site}, ${ck}${region ? ", " + region : ""}), seed ${seed}`);
  log(`  ${roads.length} roads laid${data.grow === false ? " (the whole grid)" : " (the side streets grow from them)"} · ${rivers.length} rivers · ${walls.length ? "walled" : "no wall"} · ${rails.length} railways · ${parks.length} parks`);
  log(`  districts (a place's region may be one of these): ${Object.keys(districts).join(", ")}`);
  log(`  landmarks (a place may be one of these: landmark: "name"): ${landmarks.filter(l => l.name).map(l => l.name).join("; ")}`);
  return data;
}

// ---- a site that is not a city: a fenced camp, or a military base. Everything on it is placed; nothing is grown.
function inventSite(dir, name, flags, kind, log) {
  const { era, year, look } = eraOf(flags.era || flags.year != null ? flags : Object.assign({}, flags, kind === "camp" ? { year: 1943 } : { era: "modern" }));
  const region = flags.region && flags.region !== true ? (REGION_WORDS[String(flags.region).toLowerCase()] ?? String(flags.region)) : "";
  const ground = flags.ground && flags.ground !== true ? String(flags.ground) : region === "desert" ? "sand" : kind === "base" && era === "modern" ? "dirt" : "grass";
  let seed = flags.seed && flags.seed !== true ? parseInt(flags.seed, 10) : 0; if (!seed) { for (const ch of name + kind) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0; seed = seed % 100000 + 1; }
  const rnd = mulberry32(seed * 5 + 1), R = (a, b) => a + (b - a) * rnd();
  const SW = 320, SH = 200, M = 30, X0 = -M, X1 = SW + M, Y0 = -M, Y1 = SH + M, town = !!flags.town;
  const W = kind === "camp" ? 196 : 176, H = kind === "camp" ? 118 : 112, th = R(-.1, .1), cx = SW / 2 + (town ? 22 : 0) + R(-6, 6), cy = SH / 2 + R(-4, 4), c = Math.cos(th), sn = Math.sin(th);
  const T = (u, v) => [cx + u * c - v * sn, cy + u * sn + v * c];
  const rect = (u0, v0, u1, v1) => [T(u0, v0), T(u1, v0), T(u1, v1), T(u0, v1)], ring = (u0, v0, u1, v1) => [...rect(u0, v0, u1, v1), T(u0, v0)];
  const roads = [], walls = [], rails = [], parks = [], plazas = [], open = [], rows = [], landmarks = [], districts = {}, built = [];
  const lm = (nm, k, u, v, o) => landmarks.push(Object.assign({ name: nm, kind: k, at: T(u, v), ang: th }, nm ? {} : { label: false }, o || {}));
  // huts in a block: n along u (side by side), cols down v; u0, v0 is the centre of the first
  const block = (u0, v0, cnt, cols, w, d, o) => rows.push(Object.assign({ at: T(u0, v0), ang: th, n: cnt, cols, w, d }, o || {}));
  const towers = (u0, v0, u1, v1, step) => { const per = [[u0, v0, u1, v0], [u1, v0, u1, v1], [u1, v1, u0, v1], [u0, v1, u0, v0]]; for (const [a, b, e, g] of per) { const l = Math.hypot(e - a, g - b), k = Math.max(1, Math.round(l / step)); for (let i = 0; i < k; i++) lm("", "watchtower", a + (e - a) * i / k, b + (g - b) * i / k); } };
  const hw = W / 2, hh = H / 2, gateV = R(-12, 12);
  // the road in: from the edge of the sheet to the gate in the west side
  const approach = [[X0 - 4, cy + gateV + R(-20, 20)], T(-hw - 60, gateV + R(-8, 8)), T(-hw - 22, gateV), T(-hw, gateV)];
  let extra = {}, title, notes;

  if (kind === "camp") {
    walls.push({ kind: "fence", pts: ring(-hw, -hh, hw, hh) }, { kind: "fence", pts: ring(-hw + 3, -hh + 3, hw - 3, hh - 3) });
    towers(-hw + 1.5, -hh + 1.5, hw - 1.5, hh - 1.5, 46);
    roads.push(["Camp Road", 0, approach], ["Main Street", 1, [T(-hw, gateV), T(hw - 8, gateV)]], ["", 2, [T(-hw + 44, -hh + 8), T(-hw + 44, hh - 8)]], ["", 2, [T(30, -hh + 8), T(30, hh - 8)]], ["Perimeter Track", 2, ring(-hw - 6, -hh - 6, hw + 6, hh + 6)]);
    lm("Main Gate", "gate", -hw, gateV, { major: true, ang: th + Math.PI / 2 }); lm("Gatehouse", "hall", -hw + 7, gateV - 9, { size: .6 });
    plazas.push({ name: "Roll-Call Square", pts: rect(-hw + 12, gateV + 5, -hw + 40, gateV + 30) });
    lm("Kitchens", "hall", -hw + 26, gateV - 14, { size: .9 }); lm("Infirmary", "hall", -hw + 26, -hh + 16, { size: .8 }); lm("Bath House", "hall", -hw + 14, hh - 16, { size: .7 }); lm("The Cells", "bunker", -hw + 30, hh - 14, { size: 1.2 });
    // the hut lines: two compounds either side of Main Street, wire between them
    const hut = { w: 11, d: 2.3, h: 1, gap: 1.7, colGap: 4.5, roof: "pitched" }, per = 17;
    for (const [u0, cnt] of [[-hw + 52, Math.floor((30 - 6 - (-hw + 52)) / (hut.d + hut.gap))], [38, Math.floor((hw - 12 - 38) / (hut.d + hut.gap))]]) {
      const up = Math.max(1, Math.floor((gateV - 6 - (-hh + 10)) / (hut.w + hut.colGap))), dn = Math.max(1, Math.floor((hh - 10 - (gateV + 6)) / (hut.w + hut.colGap)));
      block(u0, -hh + 10 + hut.w / 2, cnt, up, hut.w, hut.d, hut); block(u0, gateV + 6 + hut.w / 2, cnt, dn, hut.w, hut.d, hut); void per;
    }
    walls.push({ kind: "fence", pts: [T(34, -hh + 3), T(34, gateV - 4)] }, { kind: "fence", pts: [T(34, gateV + 4), T(34, hh - 3)] }, { kind: "fence", pts: [T(-hw + 47, -hh + 3), T(-hw + 47, gateV - 4)] }, { kind: "fence", pts: [T(-hw + 47, gateV + 4), T(-hw + 47, hh - 3)] });
    block(hw - 9, -hh + 12, 1, 3, 12, 5, { h: 1.6, colGap: 6, roof: "barrel" }); lm("Workshops", "park", hw - 9, -hh + 24);
    districts["Compound A"] = T(-hw + 100, -hh + 30); districts["Compound B"] = T(72, hh - 30);
    // outside the wire: the guards' compound by the gate, the siding and its ramp along the south side
    lm("Commandant's Office", "hall", -hw - 20, gateV - 16, { size: .8, major: true }); block(-hw - 34, gateV + 14, 5, 1, 9, 2.4, { h: 1.1, gap: 1.8 }); lm("Guard Barracks", "park", -hw - 26, gateV + 26);
    if (era !== "medieval") { const rv = hh + 16; rails.push({ name: "Siding", pts: [[X0 - 4, T(-hw - 70, rv + 26)[1]], T(-hw - 40, rv + 12), T(-hw + 10, rv), T(hw - 30, rv)] }); open.push({ kind: "paved", pts: rect(-hw + 20, rv - 6, hw - 40, rv - 2.5) }); lm("The Ramp", "park", 0, rv - 4.2); lm("Stores", "hangar", hw - 14, rv - 12, { size: 1 }); }
    parks.push({ name: "", pts: [[X0, Y0], [X1, Y0], [X1, T(0, -hh - 26)[1]], [X0, T(0, -hh - 20)[1]]], trees: 1.5 });
    title = name; notes = "a fenced camp";
  } else {
    walls.push({ kind: era === "modern" ? "hesco" : "wall", pts: ring(-hw, -hh, hw, hh) });
    towers(-hw, -hh, hw, hh, 58);
    const chicane = [T(-hw - 26, gateV), T(-hw - 20, gateV + 4), T(-hw - 14, gateV - 4), T(-hw - 8, gateV), T(-hw, gateV)];
    roads.push(["Route Tampa", 0, approach.slice(0, 3).concat([T(-hw - 26, gateV)])], ["", 1, chicane], ["Main Supply Route", 1, [T(-hw, gateV), T(hw - 10, gateV)]], ["", 2, [T(-hw + 40, -hh + 8), T(-hw + 40, hh - 8)]], ["", 2, [T(10, -hh + 8), T(10, hh - 8)]], ["", 2, [T(hw - 46, -hh + 8), T(hw - 46, hh - 8)]], ["Perimeter Road", 2, ring(-hw + 6, -hh + 6, hw - 6, hh - 6)]);
    lm("Entry Control Point", "gate", -hw, gateV, { major: true, ang: th + Math.PI / 2 }); lm("", "bunker", -hw - 12, gateV + 9); lm("", "bunker", -hw - 12, gateV - 9);
    lm(era === "modern" ? "Tactical Operations Centre" : "Headquarters", "hall", -hw + 24, gateV - 16, { size: 1, major: true }); lm("Dining Hall", "hall", -hw + 24, gateV + 16, { size: 1.1 }); lm("Aid Station", "hall", -hw + 22, hh - 18, { size: .7 }); lm("Mast", "spire", -hw + 14, -hh + 14, { top: "needle", h: 9 });
    // living lines: tents in a modern forward base, huts in an older one
    const tent = era === "modern" ? { w: 6, d: 2.6, h: 1.3, gap: 1.2, colGap: 2.6, roof: "tent" } : { w: 9, d: 2.4, h: 1.1, gap: 1.6, colGap: 3.5, roof: "pitched" };
    const cnt = Math.floor((10 - 6 - (-hw + 48)) / (tent.d + tent.gap));
    block(-hw + 48, -hh + 12 + tent.w / 2, cnt, Math.max(1, Math.floor((gateV - 6 - (-hh + 12)) / (tent.w + tent.colGap))), tent.w, tent.d, tent);
    block(-hw + 48, gateV + 7 + tent.w / 2, cnt, Math.max(1, Math.floor((hh - 12 - (gateV + 7)) / (tent.w + tent.colGap))), tent.w, tent.d, tent);
    districts[era === "modern" ? "Tent City" : "The Lines"] = T(-hw + 78, -hh + 34);
    // motor pool, fuel, flight line, and the ammunition point set well apart
    open.push({ kind: "paved", pts: rect(16, gateV + 8, hw - 52, hh - 12) }); lm("Motor Pool", "park", (16 + hw - 52) / 2, (gateV + 8 + hh - 12) / 2);
    block(22, gateV + 14, Math.floor((hw - 60 - 22) / 3.4), 2, 4.6, 2, { h: .9, gap: 1.4, colGap: 6, roof: "flat" });
    for (let i = 0; i < 6; i++) lm(i === 0 ? "Fuel Point" : "", "tank", 18 + (i % 3) * 5, -hh + 14 + Math.floor(i / 3) * 5, { size: .9 });
    if (era === "modern") { for (let i = 0; i < 4; i++) lm(i === 0 ? "Helicopter Pads" : "", "pad", 34 + i * 9, gateV - 12, { size: 1.2 }); }
    for (let i = 0; i < 3; i++) lm(i === 0 ? "Hangars" : "", "hangar", 40 + i * 12, -hh + 16, { size: 1 });
    open.push({ kind: "paved", pts: rect(28, -hh + 24, hw - 50, gateV - 5) });
    for (let i = 0; i < 6; i++) lm(i === 0 ? "Ammunition Point" : "", "bunker", hw - 34 + (i % 2) * 14, -hh + 16 + Math.floor(i / 2) * 14);
    walls.push({ kind: "fence", pts: ring(hw - 42, -hh + 8, hw - 10, -hh + 54) });
    open.push({ kind: "sand", pts: rect(hw - 40, gateV + 10, hw - 12, hh - 10) }); lm("Range", "park", hw - 26, (gateV + 10 + hh - 10) / 2);
    title = name; notes = "a military base";
  }
  if (town) {
    // a small town where the road comes in: a few streets, houses along them only inside its bounds
    const tx = X0 + 46, ty = approach[1][1] + R(-10, 10), zone = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.2832, r = 40 * (1 + .2 * Math.sin(a * 3 + seed)); return [tx + r * Math.cos(a), ty + r * .9 * Math.sin(a)]; });
    built.push({ pts: zone });
    roads.push(["High Street", 1, [[tx - 44, ty - 14], [tx - 10, ty - 4], [tx + 30, ty + 6]]], ["Market Lane", 2, [[tx - 12, ty - 40], [tx - 6, ty - 4], [tx - 14, ty + 38]]], ["Mill Lane", 2, [[tx + 16, ty - 34], [tx + 18, ty + 2], [tx + 8, ty + 36]]], ["", 2, [[tx - 36, ty + 16], [tx - 6, ty + 20], [tx + 26, ty + 26]]], ["", 3, [[tx - 30, ty - 26], [tx, ty - 22], [tx + 28, ty - 20]]]);
    districts["The Town"] = [tx, ty - 30];
    extra = { fill: true, built, ruin: flags.ruin != null && flags.ruin !== true ? Math.max(0, Math.min(1, parseFloat(flags.ruin))) : 0 };
  } else extra = { fill: false };
  const data = Object.assign({
    look, region: region || undefined, ground, seed, sheet: { w: SW, h: SH, margin: M }, grow: false, wobble: 0,
    title, subtitle: year != null ? String(year) : "", scaleLabel: "Scale",
    invented: { name, kind, era, year, ground, town }, districts, roads, rails, walls, parks, open, plazas, rows, landmarks, boats: 0
  }, extra);
  const file = writeCity(dir, data, [
    `${name}: an invented site (${notes}), laid out by: atlas.js city --invent "${name}" --kind ${kind} ${year != null ? "--year " + year : "--era " + era}${town ? " --town" : ""} --seed ${seed}`,
    "Nothing is grown on a site: every hut row, fence, tower and building is listed here. Another seed turns and shifts it.",
    "This file is rewritten whenever the site is generated again. Put your own changes in campaign.js:",
    '  ATLAS.cityEdit(c => { c.rows.push({ at: [x, y], ang: 0, n: 8, cols: 2, w: 9, d: 2.3 }); c.landmarks.push({ name, kind, at: [x, y] }); });'
  ]);
  log(`wrote ${path.relative(process.cwd(), file) || file}: ${name}, ${notes} (${era}, ${ground} ground${town ? ", with a town" + (data.ruin ? " in ruins" : "") : ""}), seed ${seed}`);
  log(`  ${rows.reduce((a, r) => a + r.n * (r.cols || 1), 0)} huts or tents in ${rows.length} blocks · ${walls.length} fences and walls · ${landmarks.filter(l => l.kind === "watchtower").length} watchtowers · ${rails.length} railways`);
  log(`  named (a place may be one of these: landmark: "name"): ${landmarks.filter(l => l.name && l.kind !== "park").map(l => l.name).join("; ")}`);
  log(`  areas (a place's region may be one of these): ${Object.keys(districts).join(", ")}`);
  return data;
}

module.exports = { inventCity, inventSite, CULTURES };
