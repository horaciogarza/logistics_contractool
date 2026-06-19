// Generates 1000 fake intra-US freight shipments into public/shipments.csv.
// Deterministic: uses a seeded PRNG so the output is reproducible.
// Run with: npm run gen:data

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'shipments.csv');

const TOTAL = 1000;

// ---- Seeded PRNG (mulberry32) -------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const round2 = (n) => Math.round(n * 100) / 100;
// Gaussian via Box-Muller, for realistic per-shipment price noise.
function gaussian(mean, std) {
  const u = 1 - rand();
  const v = rand();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---- Reference pools ----------------------------------------------------------
const CITIES = [
  { zip: '60601', city: 'Chicago', state: 'IL', lat: 41.88, lng: -87.63 },
  { zip: '90021', city: 'Los Angeles', state: 'CA', lat: 34.03, lng: -118.23 },
  { zip: '75201', city: 'Dallas', state: 'TX', lat: 32.78, lng: -96.8 },
  { zip: '30303', city: 'Atlanta', state: 'GA', lat: 33.75, lng: -84.39 },
  { zip: '07102', city: 'Newark', state: 'NJ', lat: 40.74, lng: -74.17 },
  { zip: '33101', city: 'Miami', state: 'FL', lat: 25.78, lng: -80.2 },
  { zip: '98108', city: 'Seattle', state: 'WA', lat: 47.55, lng: -122.31 },
  { zip: '80216', city: 'Denver', state: 'CO', lat: 39.79, lng: -104.97 },
  { zip: '64120', city: 'Kansas City', state: 'MO', lat: 39.13, lng: -94.52 },
  { zip: '85034', city: 'Phoenix', state: 'AZ', lat: 33.43, lng: -112.04 },
  { zip: '43215', city: 'Columbus', state: 'OH', lat: 39.96, lng: -82.99 },
  { zip: '37210', city: 'Nashville', state: 'TN', lat: 36.13, lng: -86.74 },
];
const COUNTRY = 'US';

const CARRIERS = [
  { scac: 'KNXX', name: 'Knight Transportation' },
  { scac: 'SWFT', name: 'Swift Logistics' },
  { scac: 'JBHT', name: 'J.B. Hunt Freight' },
  { scac: 'SCNN', name: 'Schneider National' },
  { scac: 'WERN', name: 'Werner Enterprises' },
  { scac: 'CRST', name: 'CRST Carriers' },
  { scac: 'USXP', name: 'US Xpress' },
  { scac: 'PAMT', name: 'PAM Transport' },
];

const EQUIPMENT = [
  { desc: 'Dry Van', code: 'VN', rateMult: 1.0 },
  { desc: 'Flatbed', code: 'FB', rateMult: 1.18 },
  { desc: 'Hotshot', code: 'HS', rateMult: 0.85 },
  { desc: 'Reefer', code: 'RF', rateMult: 1.32 },
  { desc: 'Step Deck', code: 'SD', rateMult: 1.22 },
];

const SHIPPERS = [
  'Acme Manufacturing', 'Globex Industries', 'Initech Supply', 'Umbrella Foods',
  'Stark Components', 'Wayne Distribution', 'Soylent Goods', 'Hooli Materials',
];
const CONSIGNEES = [
  'Northwind Retail', 'Vandelay Imports', 'Pied Piper Warehousing', 'Wonka Markets',
  'Tyrell Depot', 'Cyberdyne Stores', 'Massive Dynamic', 'Gekko Wholesale',
];
const DIRECTIONS = ['inbound', 'outbound', 'third party', 'intercompany'];

// ---- Build a constrained set of lanes (origin/dest pair + equipment) ----------
// Distance proxy drives a per-lane base rate; some lanes get high volatility.
function haversineMiles(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3959;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ~30 city pairs (directed), each combined with 1-2 equipment types -> lanes.
const lanes = [];
const usedPairs = new Set();
while (lanes.length < 30) {
  const o = pick(CITIES);
  const d = pick(CITIES);
  if (o.zip === d.zip) continue;
  const key = `${o.zip}>${d.zip}`;
  if (usedPairs.has(key)) continue;
  usedPairs.add(key);

  const miles = haversineMiles(o, d);
  const equips = rand() < 0.5 ? [pick(EQUIPMENT)] : [pick(EQUIPMENT), pick(EQUIPMENT)];
  for (const eq of new Set(equips.map((e) => e.code))) {
    const equip = EQUIPMENT.find((e) => e.code === eq);
    // Base $/mile ~1.8-2.6, scaled by equipment; high volatility on ~35% of lanes.
    const baseRatePerMile = (1.8 + rand() * 0.8) * equip.rateMult;
    const baseLineHaul = Math.max(450, miles * baseRatePerMile);
    const volatile = rand() < 0.35;
    lanes.push({
      o,
      d,
      equip,
      miles,
      baseLineHaul,
      // coefficient of variation target for linehaul noise
      cv: volatile ? 0.18 + rand() * 0.17 : 0.04 + rand() * 0.06,
    });
  }
}

// ---- Generate shipments by distributing 1000 rows across lanes ----------------
function randomDateWithinYear() {
  const now = new Date('2026-06-18T00:00:00Z').getTime();
  const past = now - 365 * 24 * 3600 * 1000;
  return new Date(past + rand() * (now - past)).toISOString().slice(0, 10);
}

const rows = [];
for (let i = 0; i < TOTAL; i++) {
  const lane = pick(lanes);
  const { o, d, equip } = lane;

  const carrier = pick(CARRIERS);
  const lineHaul = Math.max(300, gaussian(lane.baseLineHaul, lane.baseLineHaul * lane.cv));
  const fuel = lineHaul * (0.12 + rand() * 0.1); // 12-22% of linehaul
  const accessorials = rand() < 0.6 ? round2(50 + rand() * 450) : 0;
  const subtotal = lineHaul + fuel + accessorials;
  const tax = subtotal * (0.02 + rand() * 0.03); // 2-5%

  const laneStr = [
    COUNTRY, o.state, o.city, 'TO', d.city, d.state, COUNTRY, equip.code,
  ].join('-');

  rows.push({
    originZip: o.zip,
    originCity: o.city,
    originState: o.state,
    originCountry: COUNTRY,
    destZip: d.zip,
    destCity: d.city,
    destState: d.state,
    destCountry: COUNTRY,
    scac: carrier.scac,
    carrierName: carrier.name,
    lane: laneStr,
    equipmentTypeDesc: equip.desc,
    equipmentTypeCode: equip.code,
    shipmentDate: randomDateWithinYear(),
    lineHaul: round2(lineHaul),
    accessorials: round2(accessorials),
    tax: round2(tax),
    fuel: round2(fuel),
    shipper: pick(SHIPPERS),
    consignee: pick(CONSIGNEES),
    direction: pick(DIRECTIONS),
  });
}

// ---- Write CSV ----------------------------------------------------------------
const HEADERS = Object.keys(rows[0]);
const escape = (v) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [
  HEADERS.join(','),
  ...rows.map((r) => HEADERS.map((h) => escape(r[h])).join(',')),
].join('\n');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, csv + '\n', 'utf8');
console.log(`Wrote ${rows.length} shipments across ${lanes.length} lanes to ${OUT}`);
