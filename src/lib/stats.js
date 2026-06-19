// Lane aggregation, volatility metrics, opportunity scoring, and histogram binning.

// A lane is flagged as a negotiation opportunity when it has enough volume AND
// the freight price is volatile enough that a locked contract rate could beat spot.
export const MIN_VOLUME = 10;
export const CV_THRESHOLD = 0.15; // coefficient of variation (stdDev / avg)

export const currency = (n) =>
  n == null || Number.isNaN(n)
    ? '—'
    : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

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

// Group shipments by their `lane` string and compute per-lane stats.
export function groupByLane(shipments) {
  const map = new Map();
  for (const s of shipments) {
    if (!map.has(s.lane)) map.set(s.lane, []);
    map.get(s.lane).push(s);
  }

  const lanes = [];
  for (const [lane, items] of map) {
    const costs = items.map((s) => s.totalCost);
    const sorted = [...costs].sort((a, b) => a - b);
    const avg = mean(costs);
    const sd = stdDev(costs, avg);
    const cv = avg > 0 ? sd / avg : 0;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const med = percentile(sorted, 0.5);
    const p25 = percentile(sorted, 0.25);
    const p75 = percentile(sorted, 0.75);

    const carriers = [...new Set(items.map((s) => s.carrierName))];
    const directions = [...new Set(items.map((s) => s.direction))];

    // Recommended contractable band: P25 (achievable target) up to the median (typical rate).
    const contractLow = p25;
    const contractHigh = med;
    const contractTarget = p25;
    // Conservative saving: every load booked at the top of the band (median) vs current avg.
    const contractSaving = Math.max(0, (avg - contractHigh) * items.length);
    // Potential saving if every shipment were booked at (near) the best observed rate.
    const potentialSaving = (avg - min) * items.length;
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
      carriers,
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
export function histogramByCarrier(shipments, binCount = 12) {
  const carriers = [...new Set(shipments.map((s) => s.carrierName))].sort();
  if (!shipments.length) return { bins: [], carriers };

  const values = shipments.map((s) => s.totalCost);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const short = (n) => `$${Math.round(n / 100) / 10}k`;
  const emptyCounts = () => Object.fromEntries(carriers.map((c) => [c, 0]));

  if (min === max) {
    const bin = { rangeLabel: currency(min), x0: min, x1: max, ...emptyCounts() };
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
    let idx = Math.floor((s.totalCost - min) / width);
    if (idx >= binCount) idx = binCount - 1; // max value lands in last bin
    bins[idx][s.carrierName] += 1;
  }
  return { bins, carriers };
}
