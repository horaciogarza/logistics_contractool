import Papa from 'papaparse';

const NUMERIC = ['lineHaul', 'accessorials', 'tax', 'fuel'];

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
