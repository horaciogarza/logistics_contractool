import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { useTheme } from '@mui/material/styles';
import { histogramByCarrier, currency } from '../lib/stats.js';
import ContractRangeBar from './ContractRangeBar.jsx';

// Distinct colors for carrier segments in the stacked histogram.
const CARRIER_COLORS = [
  '#1976d2', '#ef6c00', '#2e7d32', '#7b1fa2', '#c62828',
  '#00838f', '#f9a825', '#5d4037', '#455a64', '#ad1457',
];

function StatChip({ label, value, color }) {
  return (
    <Paper variant="outlined" sx={{ px: 1.5, py: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, color: color ?? 'text.primary' }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function PriceHistogram({ lane }) {
  const theme = useTheme();

  if (!lane) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
        <Typography variant="body2">Select a lane to see its freight price distribution.</Typography>
      </Box>
    );
  }

  const { bins, carriers } = histogramByCarrier(lane.shipments);
  const colorFor = (carrier) => CARRIER_COLORS[carriers.indexOf(carrier) % CARRIER_COLORS.length];

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {lane.originCity}, {lane.originState} → {lane.destCity}, {lane.destState}
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', wordBreak: 'break-all' }}>
          {lane.lane}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.5 }}>
        <StatChip label="Shipments" value={lane.count} />
        <StatChip label="Min" value={currency(lane.min)} />
        <StatChip label="Avg" value={currency(lane.avg)} />
        <StatChip label="Max" value={currency(lane.max)} />
        <StatChip label="Volatility" value={`${(lane.cv * 100).toFixed(0)}%`} color={lane.cv >= 0.15 ? 'warning.main' : 'text.primary'} />
        <StatChip
          label="Contract range"
          value={`${currency(lane.contractLow)} – ${currency(lane.contractHigh)}`}
          color="success.main"
        />
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <ContractRangeBar
          min={lane.min}
          max={lane.max}
          contractLow={lane.contractLow}
          contractHigh={lane.contractHigh}
          avg={lane.avg}
        />
      </Paper>

      {lane.isOpportunity && (
        <Alert severity="warning">
          <AlertTitle>Negotiation opportunity</AlertTitle>
          Freight on this lane varies by {(lane.cv * 100).toFixed(0)}% across {lane.count} shipments.
          Target a contract between {currency(lane.contractLow)} and {currency(lane.contractHigh)} (vs{' '}
          {currency(lane.avg)} avg spot) — locking the band could save ~{currency(lane.contractSaving)}.
        </Alert>
      )}

      {lane.contractSaving > 0 && (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
            How the savings estimate works
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Right now these {lane.count} shipments cost about {currency(lane.avg)} each on the spot
            market — roughly {currency(lane.avg * lane.count)} in total. A quarter of the loads have
            already moved at {currency(lane.contractLow)} or less, and half at {currency(lane.contractHigh)}
            {' '}or less, so a contract anywhere in that band is realistic rather than wishful. If every
            load were booked at the top of the band ({currency(lane.contractHigh)}), each shipment would
            cost about {currency(lane.avg - lane.contractHigh)} less than today's average, which adds up
            to the ~{currency(lane.contractSaving)} estimate across the lane. Negotiating toward the low
            end ({currency(lane.contractLow)}) would save more.
          </Typography>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          Total freight cost distribution by carrier
        </Typography>
        <Box sx={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bins} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis dataKey="rangeLabel" tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} />
              <Tooltip formatter={(v, name) => [`${v} shipments`, name]} labelFormatter={(l) => `~${l}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {carriers.map((carrier, i) => (
                <Bar
                  key={carrier}
                  dataKey={carrier}
                  stackId="cost"
                  fill={colorFor(carrier)}
                  radius={i === carriers.length - 1 ? [3, 3, 0, 0] : 0}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          Carriers on this lane
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {carriers.map((c) => (
            <Chip
              key={c}
              label={c}
              size="small"
              variant="outlined"
              sx={{ borderColor: colorFor(c), '& .MuiChip-label': { color: colorFor(c) } }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
