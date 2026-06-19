# Contractool

A React dashboard for comparing freight rates on the same **lane** (origin → destination +
equipment type). It groups shipments by lane, shows each lane as a card with rate stats, and
renders a histogram of the freight price distribution so you can spot lanes where rates are
volatile — signalling an opportunity to move off **spot rates** and negotiate a fixed contract.

## Stack
- Vite + React 18 (JavaScript)
- Tailwind CSS
- Recharts (histogram)
- PapaParse (CSV parsing)

## Getting started
```bash
npm install
npm run gen:data   # regenerate public/shipments.csv (1000 fake intra-US shipments)
npm run dev        # start the dev server
npm run build      # production build
```

The dataset is committed at `public/shipments.csv`, so `npm run dev` works without first
running `gen:data`. The generator is seeded (deterministic) — re-running it reproduces the
same data.

## How opportunities are flagged
A lane is flagged as a negotiation opportunity when it has enough volume
(`count >= 10`) and high price volatility (coefficient of variation `cv >= 0.15`).
Thresholds live in `src/lib/stats.js`.

## Layout
- `scripts/generateData.mjs` — data generator → `public/shipments.csv`
- `src/data/loadShipments.js` — fetch + parse CSV, derive `totalCost`
- `src/lib/stats.js` — lane aggregation, volatility, opportunity score, histogram bins
- `src/components/` — `SummaryBar`, `Filters`, `LaneList`, `LaneCard`, `PriceHistogram`
- `src/App.jsx` — state, filtering, sorting, layout
