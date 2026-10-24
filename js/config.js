const CELESTIAL_DATA = {
  'Galaxy Center': {
    title: 'MILKY WAY CORE',
    desc: 'Inti galaktika supermassa di pusat Galaksi Via Laktia.',
    class: 'INTI GALAKTIK',
    size: '100,000 LY',
    temp: '3,500,000 K',
    satellites: 'Miliaran',
    fact: 'Pusat Galaksi Via Laktia terdapat lubang hitam supermassa bernama Sagittarius A* dengan massa sekitar 4 juta kali Massa Matahari.',
    pos: { x: 0, y: 0, z: 0 }
  },
  'Sun': {
    title: 'MATAHARI / SUN',
    desc: 'Bintang tipe G di pusat Tata Surya, penggerak gravitasi utama.',
    class: 'BINTANG DWARF KUNING',
    size: '1,392,700 km',
    temp: '5,778 K',
    satellites: '8 Planet',
    fact: 'Matahari menyusun 99,86% massa seluruh Tata Surya dan merupakan sumber energi utama bagi kehidupan di Bumi.',
    pos: { x: 0, y: 0, z: 0 }
  },
  'Mercury': {
    title: 'MERKURIUS',
    desc: 'Planet terkecil dengan permukaan berlubang dan perpindahan suhu ekstrem.',
    class: 'TERESTRIAL',
    size: '4,879 km',
    temp: '167 K',
    satellites: '0',
    fact: 'Merkurius adalah planet terdekat dengan Matahari dan tidak memiliki atmosfer yang nyata, sehingga suhu berfluktuasi sangat ekstrem antara siang dan malam.',
    pos: { x: 39, y: 0, z: 0 }
  },
  'Venus': {
    title: 'VENUS',
    desc: 'Atmosfer padat dan beracun, planet terpanas di Tata Surya.',
    class: 'TERESTRIAL',
    size: '12,104 km',
    temp: '464 K',
    satellites: '0',
    fact: 'Venus memiliki efek rumah kaca yang parah dengan suhu permukaan yang mencukupi untuk meleburkan timbal, dan berputar terbalik dibandingkan planet lain.',
    pos: { x: 72, y: 0, z: 0 }
  },
  'Earth': {
    title: 'BUMI (TERRA)',
    desc: 'Dunia air dengan atmosfer nitrogen-oksigen dan satelit alami.',
    class: 'TERESTRIAL',
    size: '12,742 km',
    temp: '288 K',
    satellites: '1 Bulan',
    fact: 'Bumi adalah satu-satunya planet yang diketahui menghidupi kehidupan, dengan air cair di permukaan dan lapisan ozon yang melindungi dari radiasi matahari.',
    pos: { x: 100, y: 0, z: 0 }
  },
  'Mars': {
    title: 'MARS',
    desc: 'Dunia gulma dengan bendung es kutub dan korang air kuno.',
    class: 'TERESTRIAL',
    size: '6,779 km',
    temp: '210 K',
    satellites: '2 Bulan',
    fact: 'Mars dikenal sebagai Planet Merah karena besi yang mengoksida di permukaannya, dan memiliki gunung berapi tertinggi di Tata Surya, Olympus Mons.',
    pos: { x: 152, y: 0, z: 0 }
  },
  'Jupiter': {
    title: 'JUPITER',
    desc: 'Planet terbesar, raksasa gas dengan Titik Merah Agung.',
    class: 'RAKSA-GAS',
    size: '139,820 km',
    temp: '165 K',
    satellites: '95 Bulan',
    fact: 'Jupiter adalah planet terbesar yang bisa menampung lebih dari 1.300 Bumi di dalamnya dan memiliki medan magnet terkuat di antara semua planet.',
    pos: { x: 520, y: 0, z: 0 }
  },
  'Saturn': {
    title: 'SATURNUS',
    desc: 'Raksasa gas berkeliling cincin yang terdiri dari hidrogen danhelium.',
    class: 'RAKSA-GAS',
    size: '116,460 km',
    temp: '134 K',
    satellites: '146 Bulan',
    fact: 'Saturnus terkenal dengan cincinnya yang indah yang terdiri dari es dan debu, serta memiliki kepadatan lebih rendah dari air.',
    pos: { x: 958, y: 0, z: 0 }
  },
  'Uranus': {
    title: 'URANUS',
    desc: 'Raksasa es yang berputar miring, atmosfer biru muda.',
    class: 'RAKSA-ES',
    size: '50,724 km',
    temp: '76 K',
    satellites: '28 Bulan',
    fact: 'Uranus berputar di sampingnya dengan kemiringan sumbu 98 derajat, mungkin karena benturan besar di masa lalu.',
    pos: { x: 1920, y: 0, z: 0 }
  },
  'Neptune': {
    title: 'NEPTUNUS',
    desc: 'Raksasa es berwarna biru tua dengan angin supersonik.',
    class: 'RAKSA-ES',
    size: '49,244 km',
    temp: '72 K',
    satellites: '16 Bulan',
    fact: 'Neptunus memiliki angin tercepat di Tata Surya hingga 2.100 km/jam dan merupakan planet terjauh dari Matahari.',
    pos: { x: 3010, y: 0, z: 0 }
  },
  'Kepler-186f': {
    title: 'KEPLER-186F',
    desc: 'Exoplanet berukuran Bumi di zona layak huni autour bintang kerdil merah.',
    class: 'EXOPLANET',
    size: '14,200 km',
    temp: '230 K',
    satellites: 'Tidak diketahui',
    fact: 'Kepler-186f adalah exoplanet pertama berukuran Bumi yang ditemukan di zona layak huni sebuah bintang di luar Tata Surya.',
    pos: { x: 320, y: 40, z: -90 }
  },
  'Nebula Station': {
    title: 'STASIUN NEBULA ORION',
    desc: 'Avtor penelitian dalam ruang angin di awan gas terionisasi.',
    class: 'STASIUN ANTARIKSA',
    size: '4.5 km',
    temp: '22 K',
    satellites: 'Hub docking',
    fact: 'Stasiun penelitian dalam nebula Orion yang menyelidiki elemen berat langka dan fenomena bintang baru yang terbentuk.',
    pos: { x: -140, y: 45, z: -110 }
  },
  'Autonomous Alien UFO': {
    title: 'CRAFT TIDAK DIKENALI',
    desc: 'Objek terbang tidak dikenal dengan propulsi non-Newtonian.',
    class: 'UFO PENGINTIP',
    size: '45 meter',
    temp: '0 K (tershield)',
    satellites: 'Swarm drone',
    fact: 'Objek misterius yang menunjukkan gerakan tidak Newtonian dan sinar cahaya berfrekuensi tinggi, asalnya tidak diketahui.',
    pos: { x: 50, y: 25, z: 70 }
  },
  'Andromeda': {
    title: 'ANDROMEDA (M31)',
    desc: 'Galaksi spiral terdekat dari Via Laktia, berkabut akan benturan dalam 4,5 miliar tahun lagi.',
    class: 'GALAKSI SPIRAL',
    size: '220,000 LY',
    temp: '0 K',
    satellites: 'Bintang miliaran',
    fact: 'Andromeda adalah galaksi spiral terbesar di Grup Lokal dan akan bertabrakan dengan Galaksi Via Laktia dalam sekitar 4,5 miliar tahun ke depan.',
    pos: { x: 4200, y: 0, z: -3600 }
  },
  'Triangulum': {
    title: 'TRIANGULUM (M33)',
    desc: 'Galaksi spiral ketiga terbesar di Grup Lokal, dikenal dengan pembentukan bintang yang aktif.',
    class: 'GALAKSI SPIRAL',
    size: '60,000 LY',
    temp: '0 K',
    satellites: 'Bintang miliaran',
    fact: 'Triangulum adalah galaksi spiral kecil yang terlihat sejajar dengan Via Laktia dan Andromeda di langit malam.',
    pos: { x: -5800, y: 200, z: -4900 }
  },
  'Sombrero': {
    title: 'SOMBRERO (M104)',
    desc: 'Galaksi spiral dengan lingkaran debu tebal di sekitar intinya, seperti topi sumbrero.',
    class: 'GALAKSI SPIRAL',
    size: '50,000 LY',
    temp: '0 K',
    satellites: 'Globular clusters',
    fact: 'Sombrero Galaxy memiliki inti yang sangat cemerlang dan lingkaran debu yang membelah galaksi secara horizontal.',
    pos: { x: 7100, y: -800, z: -2400 }
  },
  'The Void': {
    title: 'THE VOID (BOOTES)',
    desc: 'Wilayah angkasa kosong yang sangat luas dengan sangat sedikit galaksi di dalamnya.',
    class: 'VOID / KOSMOS KOSONG',
    size: '330,000,000 LY',
    temp: '2.7 K',
    satellites: 'Hampir nol',
    fact: 'Boötes Void adalah salah satu rahang angkasa terbesar yang diketahui, dengan diameter sekitar 330 juta tahun cahaya dan sangat sedikit galaksi.',
    pos: { x: -9200, y: 3000, z: -6100 }
  },
  'Pillars of Creation': {
    title: 'PILLARS OF CREATION',
    desc: 'Tumbuhan gas dan debu raksasa di Nebula Aquila tempat bintang baru terbentuk.',
    class: 'NEBULA / PILAR PTAH',
    size: '4-5 LY tiap pilar',
    temp: '10-50 K',
    satellites: 'Protostar',
    fact: 'Pillars of Creation adalah struktur ikonik di Nebula Aquila yang difoto oleh Teleskop Angkasa Hubble, tempat bintang-bintang baru lahir.',
    pos: { x: 3100, y: -1500, z: 6800 }
  },
  'Sagittarius A*': {
    title: 'SAGITTARIUS A*',
    desc: 'Lubang hitam supermassa di pusat Galaksi Via Laktia.',
    class: 'LUBANG HITAM SUPERMASSA',
    size: '44 juta km (horizon)',
    temp: '0 K',
    satellites: 'Bintang S-cluster',
    fact: 'Sagittarius A* adalah lubang hitam supermassa dengan massa sekitar 4,3 juta kali massa Matahari, terletak di pusat Via Laktia.',
    pos: { x: 26000, y: 0, z: 0 }
  },
  'Stephenson 2-18': {
    title: 'STEPHENSON 2-18',
    desc: 'Bintang raksasa superygak dikenal sebagai salah satu bintang terbesar yang pernah diamati.',
    class: 'BINTANG RAKSA SUPER',
    size: '2,150x Matahari',
    temp: '3,200 K',
    satellites: 'Tidak ada',
    fact: 'Stephenson 2-18 adalah salah satu bintang terbesar yang diketahui manusia, dengan radius sekitar 2.150 kali radius Matahari.',
    pos: { x: 19000, y: 500, z: -12000 }
  },
  'UY Scuti': {
    title: 'UY SCUTI',
    desc: 'Bintang raksasa merah yang sebelumnya dianggap salah satu terbesar di semesta.',
    class: 'BINTANG RAKSA MERAH',
    size: '1,700x Matahari',
    temp: '3,300 K',
    satellites: 'Tidak ada',
    fact: 'UY Scuti adalah bintang raksasa merah di constelasi Scutum yang pernah dianggap sebagai bintang terbesar sebelum ditemukannya Stephenson 2-18.',
    pos: { x: -15600, y: -800, z: 14200 }
  },
  'VY Canis Majoris': {
    title: 'VY CANIS MAJORIS',
    desc: 'Bintang raksasa merah yang sangat luminos dan kehilangan massa dengan cepat.',
    class: 'BINTANG RAKSA MERAH',
    size: '1,420x Matahari',
    temp: '3,400 K',
    satellites: 'Tidak ada',
    fact: 'VY Canis Majoris adalah salah satu bintang paling luminos dan raksasa di Galaksi Via Laktia, located di constelasi Canis Major.',
    pos: { x: 11200, y: 2100, z: -19800 }
  },
  'R136a1': {
    title: 'R136a1',
    desc: 'Bintang Wolf-Rayet terberat yang pernah diamati, di Besar Magellan Cloud.',
    class: 'BINTANG WOLF-RAYET',
    size: '35x Matahari',
    temp: '53,000 K',
    satellites: 'Tidak ada',
    fact: 'R136a1 adalah bintang terberat dan paling luminos yang diketahui, dengan massa sekitar 256 kali Massa Matahari.',
    pos: { x: -28000, y: 12000, z: 15000 }
  },
  'Pistol Star': {
    title: 'PISTOL STAR',
    desc: 'Bintang variabel biru raksasa di pusat Galaksi Via Laktia dekat Sagittarius A*.',
    class: 'BINTANG VARIABEL BIRU',
    size: '300x Matahari',
    temp: '11,800 K',
    satellites: 'Tidak ada',
    fact: 'Pistol Star adalah salah satu bintang paling luminos, menghasilkan energi 10 juta kali lebih besar dari Matahari.',
    pos: { x: 25500, y: 120, z: 900 }
  },
  'IC 1101': {
    title: 'IC 1101',
    desc: 'Galaksi raksasa eliptis yang salah satu terbesar di alam semesta yang diketahui.',
    class: 'GALAKSI ELIPTIS RAKSA',
    size: '6,000,000 LY',
    temp: '0 K',
    satellites: 'Triliunan bintang',
    fact: 'IC 1101 memiliki diameter sekitar 6 juta tahun cahaya, sekitar 60 kali lebih lebar dari Via Laktia.',
    pos: { x: 45000, y: -30000, z: 22000 }
  },
  'Hercules-Corona Borealis': {
    title: 'HERCULES-CORONA BOREALIS GREAT WALL',
    desc: 'Supergalaksi raksasa, struktur terbesar yang diketahui di alam semesta.',
    class: 'SUPERGALAKSI',
    size: '10,000,000,000 LY',
    temp: '0 K',
    satellites: 'Banyak galaksi',
    fact: 'Ini adalah struktur terbesar yang diketahui manusia, membentang sekitar 10 miliar tahun cahaya.',
    pos: { x: -60000, y: 40000, z: -50000 }
  }
};

// Solar-system objects use a consistent physical scale: 100 world units = 1 AU.
const AU_KM = 149597870.7;
const WORLD_UNITS_PER_AU = 100;
const KM_PER_WORLD_UNIT = AU_KM / WORLD_UNITS_PER_AU;
const ORBIT_CONFIG = [
  {
    name: 'Mercury', radius: 0.387098 * WORLD_UNITS_PER_AU, radiusWorld: 2439.7 / KM_PER_WORLD_UNIT, moons: 0,
    elements: { periodDays: 87.9691, meanAnomaly: 174.7925, eccentricity: 0.205636, eccentricityRate: 0.001807, inclination: 7.005, inclinationRate: -0.005947, ascendingNode: 48.331, ascendingNodeRate: -0.125341, argumentPerihelion: 29.127, argumentPerihelionRate: 0.285818, rotationPeriodDays: 58.646, axialTilt: 0.034 }
  },
  {
    name: 'Venus', radius: 0.723332 * WORLD_UNITS_PER_AU, radiusWorld: 6051.8 / KM_PER_WORLD_UNIT, moons: 0, atmosphereScale: 1.0165,
    elements: { periodDays: 224.701, meanAnomaly: 50.3766, eccentricity: 0.006777, eccentricityRate: -0.004107, inclination: 3.395, inclinationRate: -0.000789, ascendingNode: 76.68, ascendingNodeRate: -0.277694, argumentPerihelion: 54.923, argumentPerihelionRate: 0.280378, rotationPeriodDays: 243.025, axialTilt: 177.36 }
  },
  {
    name: 'Earth', radius: WORLD_UNITS_PER_AU, radiusWorld: 6371 / KM_PER_WORLD_UNIT, moons: 1, atmosphere: 0x3b82f6, atmosphereScale: 1.0157, cloudScale: 1.0016,
    elements: { periodDays: 365.256, meanAnomaly: 357.5269, eccentricity: 0.016711, eccentricityRate: -0.004392, inclination: 0.000015, inclinationRate: -0.012947, ascendingNode: 0, ascendingNodeRate: 0, argumentPerihelion: 102.938, argumentPerihelionRate: 0.323274, rotationPeriodDays: 0.99727, axialTilt: 23.44 }
  },
  {
    name: 'Mars', radius: 1.523679 * WORLD_UNITS_PER_AU, radiusWorld: 3389.5 / KM_PER_WORLD_UNIT, moons: 2, atmosphere: 0xff7658, atmosphereScale: 1.0325,
    elements: { periodDays: 686.98, meanAnomaly: 19.3902, eccentricity: 0.093394, eccentricityRate: 0.007882, inclination: 1.85, inclinationRate: -0.008131, ascendingNode: 49.56, ascendingNodeRate: -0.292573, argumentPerihelion: 286.503, argumentPerihelionRate: 0.736984, rotationPeriodDays: 1.02596, axialTilt: 25.19 }
  },
  {
    name: 'Jupiter', radius: 5.2026 * WORLD_UNITS_PER_AU, radiusWorld: 69911 / KM_PER_WORLD_UNIT, moons: 4, atmosphere: 0xffc98b, atmosphereScale: 1.0143,
    elements: { periodDays: 4332.59, meanAnomaly: 19.66796, eccentricity: 0.048386, eccentricityRate: -0.013253, inclination: 1.304, inclinationRate: -0.001837, ascendingNode: 100.474, ascendingNodeRate: 0.204691, argumentPerihelion: 14.255, argumentPerihelionRate: 0.007836, rotationPeriodDays: 0.41354, axialTilt: 3.13 }
  },
  {
    name: 'Saturn', radius: 9.5549 * WORLD_UNITS_PER_AU, radiusWorld: 58232 / KM_PER_WORLD_UNIT, moons: 3, rings: true, ringInnerScale: 66900 / 58232, ringOuterScale: 136780 / 58232,
    elements: { periodDays: 10759.22, meanAnomaly: 317.35537, eccentricity: 0.053862, eccentricityRate: -0.050991, inclination: 2.486, inclinationRate: 0.001936, ascendingNode: 113.662, ascendingNodeRate: -0.288678, argumentPerihelion: 338.936, argumentPerihelionRate: -0.130294, rotationPeriodDays: 0.44401, axialTilt: 26.73 }
  },
  {
    name: 'Uranus', radius: 19.2184 * WORLD_UNITS_PER_AU, radiusWorld: 25362 / KM_PER_WORLD_UNIT, moons: 0, atmosphere: 0x9cd7f0, atmosphereScale: 1.0394,
    elements: { periodDays: 30688.5, meanAnomaly: 142.2838, eccentricity: 0.047257, eccentricityRate: -0.004397, inclination: 0.773, inclinationRate: -0.002429, ascendingNode: 74.017, ascendingNodeRate: 0.042406, argumentPerihelion: 96.938, argumentPerihelionRate: 0.365647, rotationPeriodDays: 0.71833, axialTilt: 97.77 }
  },
  {
    name: 'Neptune', radius: 30.1104 * WORLD_UNITS_PER_AU, radiusWorld: 24622 / KM_PER_WORLD_UNIT, moons: 0, atmosphere: 0x3b82f6, atmosphereScale: 1.0406,
    elements: { periodDays: 60182, meanAnomaly: 259.9152, eccentricity: 0.00859, eccentricityRate: 0.005105, inclination: 1.77, inclinationRate: 0.000354, ascendingNode: 131.784, ascendingNodeRate: -0.005087, argumentPerihelion: 273.187, argumentPerihelionRate: -0.317328, rotationPeriodDays: 0.67125, axialTilt: 28.32 }
  },
  {
    name: 'Kepler-186f', radius: 3600, radiusWorld: 2.106, moons: 0, atmosphere: 0x4a9e7a,
    elements: { periodDays: 129.9, meanAnomaly: 0, eccentricity: 0, inclination: 0, ascendingNode: 0, argumentPerihelion: 0, rotationPeriodDays: 129.9, axialTilt: 0, illustrative: true }
  }
];

const SOLAR_MOON_CONFIG = {
  Earth: [{ name: 'Moon', radiusKm: 1737.4, orbitRadiusKm: 384400, periodDays: 27.321661 }],
  Mars: [
    { name: 'Phobos', radiusKm: 11.1, orbitRadiusKm: 9376, periodDays: 0.31891 },
    { name: 'Deimos', radiusKm: 6.2, orbitRadiusKm: 23463, periodDays: 1.26244 }
  ],
  Jupiter: [
    { name: 'Io', radiusKm: 1821.6, orbitRadiusKm: 421700, periodDays: 1.769138 },
    { name: 'Europa', radiusKm: 1560.8, orbitRadiusKm: 671034, periodDays: 3.551181 },
    { name: 'Ganymede', radiusKm: 2634.1, orbitRadiusKm: 1070412, periodDays: 7.154553 },
    { name: 'Callisto', radiusKm: 2410.3, orbitRadiusKm: 1882709, periodDays: 16.689018 }
  ],
  Saturn: [
    { name: 'Rhea', radiusKm: 763.8, orbitRadiusKm: 527108, periodDays: 4.518212 },
    { name: 'Titan', radiusKm: 2574.7, orbitRadiusKm: 1221870, periodDays: 15.945421 },
    { name: 'Iapetus', radiusKm: 734.5, orbitRadiusKm: 3560820, periodDays: 79.3215 }
  ]
};
