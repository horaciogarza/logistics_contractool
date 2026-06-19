import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { loadShipments } from './data/loadShipments.js';
import { groupByLane, COST_BASES, makeValueOf, currency, rpm } from './lib/stats.js';
import { getTheme } from './theme.js';
import SummaryBar from './components/SummaryBar.jsx';
import Filters from './components/Filters.jsx';
import LaneList from './components/LaneList.jsx';
import PriceHistogram from './components/PriceHistogram.jsx';

export default function App() {
  const [shipments, setShipments] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [equipment, setEquipment] = useState('');
  const [direction, setDirection] = useState('');
  const [sort, setSort] = useState('opportunity');
  const [onlyOpportunities, setOnlyOpportunities] = useState(false);
  const [costBasis, setCostBasis] = useState('linehaul');
  const [unit, setUnit] = useState('rpm'); // 'rpm' ($/mile) | 'absolute' ($)
  const [themeMode, setThemeMode] = useState(() => {
    const param = new URLSearchParams(window.location.search).get('theme');
    if (['light', 'dark', 'system'].includes(param)) return param;
    return localStorage.getItem('themeMode') || 'system';
  });
  const [selectedLane, setSelectedLane] = useState(null);

  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const changeThemeMode = (m) => {
    setThemeMode(m);
    localStorage.setItem('themeMode', m);
  };

  // Re-render when the OS theme changes while in "system" mode.
  useEffect(() => {
    if (themeMode !== 'system' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setThemeMode('system');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [themeMode]);

  useEffect(() => {
    loadShipments()
      .then((data) => {
        setShipments(data);
        setStatus('ready');
      })
      .catch((e) => {
        setError(e.message);
        setStatus('error');
      });
  }, []);

  const valueOf = useMemo(() => makeValueOf(costBasis, unit), [costBasis, unit]);
  const amountOf = COST_BASES[costBasis].amountOf;
  const basisLabel = COST_BASES[costBasis].label;
  const fmt = unit === 'rpm' ? rpm : currency;
  const lanes = useMemo(
    () => groupByLane(shipments, valueOf, amountOf),
    [shipments, valueOf, amountOf]
  );

  const equipmentOptions = useMemo(
    () => [...new Set(lanes.map((l) => l.equipmentTypeDesc))].sort(),
    [lanes]
  );
  const directionOptions = useMemo(
    () => [...new Set(shipments.map((s) => s.direction))].sort(),
    [shipments]
  );

  const filteredLanes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = lanes.filter((l) => {
      if (q && !l.lane.toLowerCase().includes(q)) return false;
      if (equipment && l.equipmentTypeDesc !== equipment) return false;
      if (direction && !l.directions.includes(direction)) return false;
      if (onlyOpportunities && !l.isOpportunity) return false;
      return true;
    });

    const comparators = {
      opportunity: (a, b) => b.opportunityScore - a.opportunityScore || b.count - a.count,
      count: (a, b) => b.count - a.count,
      avg: (a, b) => b.avg - a.avg,
      cv: (a, b) => b.cv - a.cv,
    };
    return [...result].sort(comparators[sort] ?? comparators.opportunity);
  }, [lanes, search, equipment, direction, onlyOpportunities, sort]);

  // Keep a valid selection as filters change.
  useEffect(() => {
    if (status !== 'ready') return;
    const stillVisible = filteredLanes.some((l) => l.lane === selectedLane);
    if (!stillVisible) setSelectedLane(filteredLanes[0]?.lane ?? null);
  }, [filteredLanes, selectedLane, status]);

  const selected = filteredLanes.find((l) => l.lane === selectedLane) ?? null;
  const opportunityCount = lanes.filter((l) => l.isOpportunity).length;
  const totalSaving = lanes
    .filter((l) => l.isOpportunity)
    .reduce((sum, l) => sum + l.contractSaving, 0);

  let body;
  if (status === 'loading') {
    body = (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading shipments…</Typography>
      </Box>
    );
  } else if (status === 'error') {
    body = (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 480 }}>
          <AlertTitle>Could not load data</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  } else {
    body = (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SummaryBar
          shipmentCount={shipments.length}
          laneCount={lanes.length}
          opportunityCount={opportunityCount}
          totalSaving={totalSaving}
          themeMode={themeMode}
          onThemeMode={changeThemeMode}
        />
        <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' } }}>
          <Paper
            square
            elevation={0}
            sx={{ borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <Filters
              search={search}
              onSearch={setSearch}
              equipment={equipment}
              onEquipment={setEquipment}
              equipmentOptions={equipmentOptions}
              direction={direction}
              onDirection={setDirection}
              directionOptions={directionOptions}
              sort={sort}
              onSort={setSort}
              onlyOpportunities={onlyOpportunities}
              onOnlyOpportunities={setOnlyOpportunities}
              costBasis={costBasis}
              onCostBasis={setCostBasis}
              unit={unit}
              onUnit={setUnit}
            />
            <Typography variant="caption" sx={{ px: 2, pt: 1, color: 'text.secondary' }}>
              {filteredLanes.length} lane{filteredLanes.length === 1 ? '' : 's'}
            </Typography>
            <LaneList lanes={filteredLanes} selectedLane={selectedLane} onSelect={setSelectedLane} fmt={fmt} />
          </Paper>
          <Box sx={{ overflowY: 'auto', bgcolor: 'background.default' }}>
            <PriceHistogram lane={selected} valueOf={valueOf} basisLabel={basisLabel} fmt={fmt} unit={unit} />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {body}
    </ThemeProvider>
  );
}
