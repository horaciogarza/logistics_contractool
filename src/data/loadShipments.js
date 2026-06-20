import Papa from 'papaparse';

const NUMERIC = ['lineHaul', 'accessorials', 'tax', 'fuel', 'miles', 'originLat', 'originLng', 'destLat', 'destLng'];

// Fetch and parse public/shipments.csv, coercing numbers and deriving totalCost.
export async function loadShipments() {
  const res = await fetch(`${import.meta.env.BASE_URL}shipments.csv`);
  if (!res.ok) {
    throw new Error(`Failed to load shipments.csv (${res.status}). Run "npm run gen:data" first.`);
  }
  const text = await res.text();
  const { data, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (errors.length) {
    console.warn('CSV parse warnings:', errors.slice(0, 3));
  }

  return data.map((row) => {
    const out = { ...row };
    for (const key of NUMERIC) out[key] = Number(row[key]) || 0;
    out.totalCost = out.lineHaul + out.accessorials + out.tax + out.fuel;
    return out;
  });
}

// Fetch the synthetic market benchmark (one freight $/mile rate per lane).
// Returns a Map of lane string -> { marketRpm, marketLinehaul }.
export async function loadMarketRates() {
  const res = await fetch(`${import.meta.env.BASE_URL}market_rates.csv`);
  if (!res.ok) return new Map(); // market data is optional
  const text = await res.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  const map = new Map();
  for (const row of data) {
    map.set(row.lane, {
      marketRpm: Number(row.marketRpmFreight) || 0,
      marketLinehaul: Number(row.marketLinehaul) || 0,
    });
  }
  return map;
}
