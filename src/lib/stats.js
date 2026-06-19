// Lane aggregation, volatility metrics, opportunity scoring, and histogram binning.

// A lane is flagged as a negotiation opportunity when it has enough volume AND
// the freight price is volatile enough that a locked contract rate could beat spot.
export const MIN_VOLUME = 10;
export const CV_THRESHOLD = 0.15; // coefficient of variation (stdDev / avg)

// Cost bases the dashboard can analyze. Every metric is normalized to $/mile (RPM)
// so lanes are comparable. Only freight (linehaul) and accessorials are negotiable;
// fuel and tax are pass-throughs, so "Negotiable" excludes them. Freight is the default.
const perMile = (amount, s) => (s.miles > 0 ? amount / s.miles : 0);
export const COST_BASES = {
  linehaul: { label: 'Freight', valueOf: (s) => perMile(s.lineHaul, s) },
  accessorials: { label: 'Accessorials', valueOf: (s) => perMile(s.accessorials, s) },
  negotiable: { label: 'Freight + Acc.', valueOf: (s) => perMile(s.lineHaul + s.accessorials, s) },
  total: { label: 'Total cost', valueOf: (s) => perMile(s.totalCost, s) },
};

export const currency = (n) =>
  n == null || Number.isNaN(n)
    ? '—'
    : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// Rate per mile (freight / distance) — the headline benchmark. Freight only.
export const rpm = (n) =>
  n == null || Number.isNaN(n) || !Number.isFinite(n) ? '—' : `$${n.toFixed(2)}/mi`;

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Linear-interpolated percentile. `q` in [0, 1]. Accepts an already-sorted array.
function percentile(sorted, q) {
  if (!sorted.length) return NaN;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function stdDev(values, avg) {
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

// Per-carrier stats on a lane, ranked by a blended "dedicated-lane incumbent" score:
// price competitiveness + volume already run + pricing consistency.
// Returns { carrierStats, recommendedIncumbents }.
function rankCarriers(items, laneAvg, valueOf) {
  const byCarrier = new Map();
  for (const s of items) {
    if (!byCarrier.has(s.carrierName)) byCarrier.set(s.carrierName, []);
    byCarrier.get(s.carrierName).push(valueOf(s));
  }

  const stats = [...byCarrier].map(([carrierName, costs]) => {
    const a = mean(costs);
    const sd = stdDev(costs, a);
    return {
      carrierName,
      count: costs.length,
      avg: a,
      min: Math.min(...costs),
      cv: a > 0 ? sd / a : 0,
      share: costs.length / items.length,
    };
  });

  // Normalize each component to 0..1 across carriers (1 = best).
  const avgs = stats.map((s) => s.avg);
  const counts = stats.map((s) => s.count);
  const cvs = stats.map((s) => s.cv);
  const norm = (v, arr, invert) => {
    const lo = Math.min(...arr);
    const hi = Math.max(...arr);
    if (hi === lo) return 1;
    const t = (v - lo) / (hi - lo);
    return invert ? 1 - t : t;
  };
  for (const s of stats) {
    const priceScore = norm(s.avg, avgs, true); // cheaper = better
    const volumeScore = norm(s.count, counts, false); // more loads = better
    const consistencyScore = norm(s.cv, cvs, true); // steadier = better
    s.score = 0.45 * priceScore + 0.35 * volumeScore + 0.2 * consistencyScore;
  }
  stats.sort((a, b) => b.score - a.score);

  // Recommend the proven (>=2 loads), at-or-below-average carriers, capped at 3.
  // Always surface at least the single top-ranked carrier.
  const proven = stats.filter((s) => s.count >= 2);
  const pool = proven.length ? proven : stats;
  let recommended = pool.filter((s) => s.avg <= laneAvg).slice(0, 3);
  if (!recommended.length) recommended = pool.slice(0, 1);

  return { carrierStats: stats, recommendedIncumbents: recommended };
}

// Group shipments by their `lane` string and compute per-lane stats.
// `valueOf` selects which cost component to analyze (see COST_BASES).
export function groupByLane(shipments, valueOf = COST_BASES.linehaul.valueOf) {
  const map = new Map();
  for (const s of shipments) {
    if (!map.has(s.lane)) map.set(s.lane, []);
    map.get(s.lane).push(s);
  }

  const lanes = [];
  for (const [lane, items] of map) {
    const costs = items.map((s) => valueOf(s));
    const sorted = [...costs].sort((a, b) => a - b);
    const avg = mean(costs);
    const sd = stdDev(costs, avg);
    const cv = avg > 0 ? sd / avg : 0;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const med = percentile(sorted, 0.5);
    const p25 = percentile(sorted, 0.25);
    const p75 = percentile(sorted, 0.75);

    // Distance is constant per lane (lane = origin + destination + equipment).
    const miles = items[0].miles || 0;

    const carriers = [...new Set(items.map((s) => s.carrierName))];
    const directions = [...new Set(items.map((s) => s.direction))];
    const { carrierStats, recommendedIncumbents } = rankCarriers(items, avg, valueOf);

    // Recommended contractable band: P25 (achievable target) up to the median (typical rate).
    const contractLow = p25;
    const contractHigh = med;
    const contractTarget = p25;
    // Savings are real dollars: a $/mile delta becomes $ when multiplied by miles
    // and by the number of loads. (avg, contractHigh, min are all $/mile.)
    const contractSaving = Math.max(0, (avg - contractHigh) * miles * items.length);
    // Potential saving if every shipment were booked at (near) the best observed rate.
    const potentialSaving = (avg - min) * miles * items.length;
    const isOpportunity = items.length >= MIN_VOLUME && cv >= CV_THRESHOLD;
    // Score blends volatility and volume so high-impact lanes rank first.
    const opportunityScore = isOpportunity ? cv * Math.log10(items.length + 1) : 0;

    lanes.push({
      lane,
      shipments: items,
      count: items.length,
      min,
      max,
      avg,
      median: med,
      p25,
      p75,
      contractLow,
      contractHigh,
      contractTarget,
      contractSaving,
      stdDev: sd,
      cv,
      miles,
      carriers,
      carrierStats,
      recommendedIncumbents,
      directions,
      equipmentTypeDesc: items[0].equipmentTypeDesc,
      equipmentTypeCode: items[0].equipmentTypeCode,
      originCity: items[0].originCity,
      originState: items[0].originState,
      destCity: items[0].destCity,
      destState: items[0].destState,
      potentialSaving,
      isOpportunity,
      opportunityScore,
    });
  }
  return lanes;
}

// Build equal-width total-cost bins, with each bin broken down by carrier so the
// histogram can render carrier segments as a stacked bar.
// Returns { bins, carriers } where each bin has a count keyed by every carrier name.
export function histogramByCarrier(shipments, valueOf = COST_BASES.linehaul.valueOf, binCount = 12) {
  const carriers = [...new Set(shipments.map((s) => s.carrierName))].sort();
  if (!shipments.length) return { bins: [], carriers };

  const values = shipments.map((s) => valueOf(s));
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Values are $/mile (small), so label bins with cents precision rather than $k.
  const short = (n) => (max >= 100 ? `$${Math.round(n / 100) / 10}k` : `$${n.toFixed(2)}`);
  const emptyCounts = () => Object.fromEntries(carriers.map((c) => [c, 0]));

  if (min === max) {
    const bin = { rangeLabel: short(min), x0: min, x1: max, ...emptyCounts() };
    for (const s of shipments) bin[s.carrierName] += 1;
    return { bins: [bin], carriers };
  }

  const width = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    rangeLabel: short(min + i * width),
    ...emptyCounts(),
  }));
  for (const s of shipments) {
    let idx = Math.floor((valueOf(s) - min) / width);
    if (idx >= binCount) idx = binCount - 1; // max value lands in last bin
    bins[idx][s.carrierName] += 1;
  }
  return { bins, carriers };
}
