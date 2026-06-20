// Lane aggregation, volatility metrics, opportunity scoring, and histogram binning.

// A lane is flagged as a negotiation opportunity when it has enough volume AND
// the freight price is volatile enough that a locked contract rate could beat spot.
export const MIN_VOLUME = 10;
export const CV_THRESHOLD = 0.15; // coefficient of variation (stdDev / avg)

// Cost bases the dashboard can analyze, each exposing the per-load dollar amount.
// Only freight (linehaul) and accessorials are negotiable; fuel and tax are
// pass-throughs, so "Negotiable" excludes them. Freight is the default.
export const COST_BASES = {
  linehaul: { label: 'Freight', amountOf: (s) => s.lineHaul },
  accessorials: { label: 'Accessorials', amountOf: (s) => s.accessorials },
  negotiable: { label: 'Freight + Acc.', amountOf: (s) => s.lineHaul + s.accessorials },
  total: { label: 'Total cost', amountOf: (s) => s.totalCost },
};

// Build a value accessor for a basis: RPM ($/mile) or absolute per-load dollars.
export function makeValueOf(basisKey, unit) {
  const amountOf = (COST_BASES[basisKey] ?? COST_BASES.linehaul).amountOf;
  if (unit === 'absolute') return amountOf;
  return (s) => (s.miles > 0 ? amountOf(s) / s.miles : 0); // $/mile
}

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
// `valueOf` is the displayed metric ($/mile or absolute $); `amountOf` is always
// the per-load dollar amount, used so savings stay in real dollars either way.
export function groupByLane(
  shipments,
  valueOf = makeValueOf('linehaul', 'rpm'),
  amountOf = COST_BASES.linehaul.amountOf,
  marketByLane = new Map(),
  fairModel = null
) {
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

    // Market benchmark comparison — always against this lane's freight $/mile,
    // independent of the active basis/unit toggles.
    const freightRpmAvg = miles > 0 ? mean(items.map((s) => s.lineHaul)) / miles : 0;
    const market = marketByLane.get(lane);
    const marketRpm = market ? market.marketRpm : null;
    const marketDeltaPct = marketRpm ? (freightRpmAvg - marketRpm) / marketRpm : null;

    // Modeled "fair" freight rate per mile for this equipment + distance.
    const fairRpm = fairModel ? fairModel.predict(items[0].equipmentTypeCode, miles) : null;
    const fairDeltaPct = fairRpm ? (freightRpmAvg - fairRpm) / fairRpm : null;

    const carriers = [...new Set(items.map((s) => s.carrierName))];
    const directions = [...new Set(items.map((s) => s.direction))];
    const { carrierStats, recommendedIncumbents } = rankCarriers(items, avg, valueOf);

    // Recommended contractable band: P25 (achievable target) up to the median (typical rate).
    const contractLow = p25;
    const contractHigh = med;
    const contractTarget = p25;
    // Savings are always real dollars, computed from per-load amounts (independent
    // of whether the display unit is $/mile or absolute $). The realistic, single
    // source of truth: move the average down to the P25 contract target (a quarter
    // of loads already run there), so it's always a sensible non-negative figure.
    const amtSorted = items.map((s) => amountOf(s)).sort((a, b) => a - b);
    const amtAvg = mean(amtSorted);
    const contractSaving = Math.max(0, (amtAvg - percentile(amtSorted, 0.25)) * items.length);
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
      freightRpmAvg,
      marketRpm,
      marketDeltaPct,
      fairRpm,
      fairDeltaPct,
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
      originLat: items[0].originLat,
      originLng: items[0].originLng,
      destLat: items[0].destLat,
      destLng: items[0].destLng,
      isOpportunity,
      opportunityScore,
    });
  }
  return lanes;
}

// Build equal-width total-cost bins, with each bin broken down by carrier so the
// histogram can render carrier segments as a stacked bar.
// Returns { bins, carriers } where each bin has a count keyed by every carrier name.
export function histogramByCarrier(shipments, valueOf = makeValueOf('linehaul', 'rpm'), binCount = 12) {
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Monthly average of the chosen metric for one lane's shipments (rate trend).
export function monthlySeries(shipments, valueOf) {
  const m = new Map();
  for (const s of shipments) {
    const key = (s.shipmentDate || '').slice(0, 7); // YYYY-MM
    if (!key) continue;
    if (!m.has(key)) m.set(key, []);
    m.get(key).push(valueOf(s));
  }
  return [...m.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, vals]) => {
      const [y, mo] = key.split('-');
      return {
        month: key,
        label: `${MONTHS[Number(mo) - 1]} '${y.slice(2)}`,
        avg: vals.reduce((x, y2) => x + y2, 0) / vals.length,
        count: vals.length,
      };
    });
}

// Simple linear regression y = a + b*x over [[x, y], ...].
function linreg(pts) {
  const n = pts.length;
  if (!n) return { a: 0, b: 0 };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const d = n * sxx - sx * sx;
  if (d === 0) return { a: sy / n, b: 0 };
  const b = (n * sxy - sx * sy) / d;
  return { a: (sy - b * sx) / n, b };
}

// Fair-rate model: predicts an expected freight $/mile from equipment + distance.
// Per-equipment linear regression of RPM on miles (RPM falls as distance rises),
// with a global fallback for unseen equipment.
export function fitFairRateModel(shipments) {
  const groups = {};
  const all = [];
  for (const s of shipments) {
    if (!s.miles) continue;
    const pt = [s.miles, s.lineHaul / s.miles];
    (groups[s.equipmentTypeCode] ??= []).push(pt);
    all.push(pt);
  }
  const byEquip = {};
  for (const [eq, pts] of Object.entries(groups)) byEquip[eq] = linreg(pts);
  const global = linreg(all);
  return {
    byEquip,
    global,
    predict(eq, miles) {
      const m = byEquip[eq] || global;
      return Math.max(0, m.a + m.b * miles);
    },
  };
}

// Tukey IQR fences for outlier detection on a numeric series.
export function iqrBounds(values) {
  if (values.length < 4) return { lo: -Infinity, hi: Infinity };
  const s = [...values].sort((a, b) => a - b);
  const q1 = percentile(s, 0.25);
  const q3 = percentile(s, 0.75);
  const iqr = q3 - q1;
  return { lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr };
}

// Network-wide spend by lane (Pareto) and a carrier scorecard.
export function portfolioStats(shipments, marketByLane = new Map()) {
  const laneMap = new Map();
  const carrierMap = new Map();
  let totalSpend = 0;

  for (const s of shipments) {
    totalSpend += s.totalCost;

    if (!laneMap.has(s.lane)) {
      laneMap.set(s.lane, {
        lane: s.lane, originCity: s.originCity, originState: s.originState,
        destCity: s.destCity, destState: s.destState, equipmentTypeCode: s.equipmentTypeCode,
        spend: 0, loads: 0,
      });
    }
    const lo = laneMap.get(s.lane);
    lo.spend += s.totalCost;
    lo.loads += 1;

    if (!carrierMap.has(s.carrierName)) {
      carrierMap.set(s.carrierName, { carrier: s.carrierName, spend: 0, loads: 0, lhSum: 0, mileSum: 0, lanes: new Set(), rpmSum: 0, mktSum: 0 });
    }
    const c = carrierMap.get(s.carrierName);
    c.spend += s.totalCost;
    c.loads += 1;
    c.lhSum += s.lineHaul;
    c.mileSum += s.miles;
    c.lanes.add(s.lane);
    const mk = marketByLane.get(s.lane);
    if (mk && s.miles > 0) { c.rpmSum += s.lineHaul / s.miles; c.mktSum += mk.marketRpm; }
  }

  const laneSpend = [...laneMap.values()].sort((a, b) => b.spend - a.spend);
  let cum = 0;
  for (const l of laneSpend) { cum += l.spend; l.spendShare = l.spend / totalSpend; l.cumPct = cum / totalSpend; }

  const carrierScores = [...carrierMap.values()]
    .map((c) => ({
      carrier: c.carrier,
      loads: c.loads,
      spend: c.spend,
      spendShare: c.spend / totalSpend,
      freightRpm: c.mileSum > 0 ? c.lhSum / c.mileSum : 0,
      marketDeltaPct: c.mktSum > 0 ? (c.rpmSum - c.mktSum) / c.mktSum : null,
      lanes: c.lanes.size,
    }))
    .sort((a, b) => b.spend - a.spend);

  return { totalSpend, laneSpend, carrierScores };
}
