import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import MuiTooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import { histogramByCarrier, currency, rpm } from '../lib/stats.js';
import ContractRangeBar from './ContractRangeBar.jsx';

// Distinct colors for carrier segments in the stacked histogram.
const CARRIER_COLORS = [
  '#1976d2', '#ef6c00', '#2e7d32', '#7b1fa2', '#c62828',
  '#00838f', '#f9a825', '#5d4037', '#455a64', '#ad1457',
];

// Tooltip body: what the metric means + a worked example using this lane's numbers.
function Explain({ what, example }) {
  return (
    <Box sx={{ py: 0.5 }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
        {what}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', opacity: 0.85 }}>
        e.g. {example}
      </Typography>
    </Box>
  );
}

function StatChip({ label, value, color, tip }) {
  const chip = (
    <Paper
      variant="outlined"
      sx={{ px: 1.5, py: 1, height: '100%', cursor: tip ? 'help' : 'default' }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, color: color ?? 'text.primary' }}>
        {value}
      </Typography>
    </Paper>
  );
  if (!tip) return chip;
  return (
    <MuiTooltip title={tip} arrow placement="top" enterTouchDelay={0}>
      {chip}
    </MuiTooltip>
  );
}

export default function PriceHistogram({ lane, valueOf, basisLabel = 'Total cost' }) {
  const theme = useTheme();

  if (!lane) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
        <Typography variant="body2">Select a lane to see its freight price distribution.</Typography>
      </Box>
    );
  }

  const { bins, carriers } = histogramByCarrier(lane.shipments, valueOf);
  const colorFor = (carrier) => CARRIER_COLORS[carriers.indexOf(carrier) % CARRIER_COLORS.length];

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {lane.originCity}, {lane.originState} → {lane.destCity}, {lane.destState}
          </Typography>
          <Chip label={`Analyzing: ${basisLabel}`} size="small" color="primary" variant="outlined" />
        </Box>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', wordBreak: 'break-all' }}>
          {lane.lane}
        </Typography>
      </Box>

      {/* Headline metric: rate per mile for the selected basis */}
      <Paper variant="outlined" sx={{ p: 2, borderColor: 'primary.main', borderWidth: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.2, display: 'block' }}>
              Rate per mile · {basisLabel}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
                {rpm(lane.avg)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>avg</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
                Range
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {rpm(lane.min)} – {rpm(lane.max)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
                Contract target
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                {rpm(lane.contractLow)} – {rpm(lane.contractHigh)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
                Distance
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {lane.miles.toLocaleString()} mi
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.5 }}>
        <StatChip
          label="Shipments"
          value={lane.count}
          tip={
            <Explain
              what="Number of individual loads moved on this lane in the dataset. More loads make the price stats and contract recommendation more reliable."
              example={`${lane.count} loads were shipped from ${lane.originCity} to ${lane.destCity}.`}
            />
          }
        />
        <StatChip
          label="Min $/mi"
          value={rpm(lane.min)}
          tip={
            <Explain
              what={`Lowest ${basisLabel.toLowerCase()} rate per mile on this lane (the metric ÷ the lane's ${lane.miles.toLocaleString()} miles).`}
              example={`The cheapest of the ${lane.count} loads ran at ${rpm(lane.min)}.`}
            />
          }
        />
        <StatChip
          label="Avg $/mi"
          value={rpm(lane.avg)}
          tip={
            <Explain
              what={`Average (mean) ${basisLabel.toLowerCase()} per mile — what you typically pay on the spot market today, normalized by distance so lanes are comparable.`}
              example={`Averaging the ${lane.count} loads' ${basisLabel.toLowerCase()} $/mi = ${rpm(lane.avg)} (≈ ${currency(lane.avg * lane.miles)} per load over ${lane.miles.toLocaleString()} mi).`}
            />
          }
        />
        <StatChip
          label="Max $/mi"
          value={rpm(lane.max)}
          tip={
            <Explain
              what={`Highest ${basisLabel.toLowerCase()} rate per mile on this lane — the worst spot rate you got hit with.`}
              example={`The most expensive of the ${lane.count} loads ran at ${rpm(lane.max)}.`}
            />
          }
        />
        <StatChip
          label="Volatility"
          value={`${(lane.cv * 100).toFixed(0)}%`}
          color={lane.cv >= 0.15 ? 'warning.main' : 'text.primary'}
          tip={
            <Explain
              what="Coefficient of variation = standard deviation ÷ average. How spread out rates are relative to the average — higher means more inconsistent, harder-to-budget pricing (and a bigger reason to contract). It's the same whether measured in $ or $/mi."
              example={`std dev ${rpm(lane.stdDev)} ÷ avg ${rpm(lane.avg)} = ${(lane.cv * 100).toFixed(0)}%.`}
            />
          }
        />
        <StatChip
          label="Contract $/mi"
          value={`${rpm(lane.contractLow)} – ${rpm(lane.contractHigh)}`}
          color="success.main"
          tip={
            <Explain
              what="Rate-per-mile band you could realistically lock in a contract: from the 25th percentile (a quarter of loads were this cheap or cheaper) up to the median (half were)."
              example={`A quarter of loads ran ≤ ${rpm(lane.contractLow)} and half ≤ ${rpm(lane.contractHigh)}, so aim to contract in that band.`}
            />
          }
        />
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <ContractRangeBar
          min={lane.min}
          max={lane.max}
          contractLow={lane.contractLow}
          contractHigh={lane.contractHigh}
          avg={lane.avg}
          format={rpm}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Recommended incumbent{lane.recommendedIncumbents.length > 1 ? 's' : ''} for a dedicated lane
          </Typography>
          <MuiTooltip
            arrow
            placement="top"
            title={
              <Explain
                what="Carrier(s) best suited to own this lane exclusively, ranked by a blend of price (45%), volume already run (35%), and pricing consistency (20%). Giving them the lane as dedicated capacity rewards the strongest performers and cuts the volatility from spreading loads across everyone."
                example={`Up to 3 carriers that price at or below the ${rpm(lane.avg)} lane average and have proven they can run the volume.`}
              />
            }
          >
            <Box component="span" sx={{ cursor: 'help', color: 'text.disabled', fontSize: 13 }}>ⓘ</Box>
          </MuiTooltip>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {lane.recommendedIncumbents.map((c, i) => (
            <Box key={c.carrierName} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={`#${i + 1}`}
                size="small"
                sx={{ bgcolor: colorFor(c.carrierName), color: '#fff', fontWeight: 600, height: 22 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {c.carrierName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {c.count} loads ({(c.share * 100).toFixed(0)}% of lane) · avg {rpm(c.avg)} ·{' '}
                  {(c.cv * 100).toFixed(0)}% volatility
                </Typography>
              </Box>
              <Chip
                label={c.avg <= lane.avg ? `${rpm(lane.avg - c.avg)} under avg` : 'top ranked'}
                size="small"
                variant="outlined"
                color={c.avg <= lane.avg ? 'success' : 'default'}
              />
            </Box>
          ))}
        </Box>
      </Paper>

      {lane.isOpportunity && (
        <Alert severity="warning">
          <AlertTitle>Negotiation opportunity</AlertTitle>
          {basisLabel} on this lane varies by {(lane.cv * 100).toFixed(0)}% across {lane.count} shipments.
          Target a contract between {rpm(lane.contractLow)} and {rpm(lane.contractHigh)} (vs{' '}
          {rpm(lane.avg)} avg spot) — locking the band could save ~{currency(lane.contractSaving)}.
        </Alert>
      )}

      {lane.contractSaving > 0 && (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
            How the savings estimate works
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Right now these {lane.count} shipments average {rpm(lane.avg)} on the spot market over the
            lane's {lane.miles.toLocaleString()} miles (≈ {currency(lane.avg * lane.miles)} per load). A
            quarter of the loads have already moved at {rpm(lane.contractLow)} or less, and half at{' '}
            {rpm(lane.contractHigh)} or less, so a contract anywhere in that band is realistic rather than
            wishful. Booking every load at the top of the band ({rpm(lane.contractHigh)}) would cut about
            {' '}{rpm(lane.avg - lane.contractHigh)} per mile — roughly{' '}
            {currency((lane.avg - lane.contractHigh) * lane.miles)} per load — which adds up to the
            ~{currency(lane.contractSaving)} estimate across the lane. Negotiating toward the low end
            ({rpm(lane.contractLow)}) would save more.
          </Typography>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          {basisLabel} $/mile distribution by carrier
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

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          Individual shipments ({lane.count}) — raw data
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Carrier</TableCell>
                <TableCell>SCAC</TableCell>
                <TableCell>Equip</TableCell>
                <TableCell align="right">Miles</TableCell>
                <TableCell align="right">Freight</TableCell>
                <TableCell align="right">$/mi</TableCell>
                <TableCell align="right">Accessorials</TableCell>
                <TableCell align="right">Fuel</TableCell>
                <TableCell align="right">Tax</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Shipper</TableCell>
                <TableCell>Consignee</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...lane.shipments]
                .sort((a, b) => (a.shipmentDate < b.shipmentDate ? 1 : -1))
                .map((s, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{s.shipmentDate}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Box component="span" sx={{ color: colorFor(s.carrierName), fontWeight: 600 }}>●</Box>{' '}
                      {s.carrierName}
                    </TableCell>
                    <TableCell>{s.scac}</TableCell>
                    <TableCell>{s.equipmentTypeCode}</TableCell>
                    <TableCell align="right">{s.miles.toLocaleString()}</TableCell>
                    {/* Negotiable components emphasized */}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{currency(s.lineHaul)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {s.miles > 0 ? rpm(s.lineHaul / s.miles) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{currency(s.accessorials)}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.disabled' }}>{currency(s.fuel)}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.disabled' }}>{currency(s.tax)}</TableCell>
                    <TableCell align="right">{currency(s.totalCost)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{s.direction}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{s.shipper}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{s.consignee}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
          Freight &amp; Accessorials (bold) are negotiable; Fuel &amp; Tax (greyed) are fixed pass-throughs.
        </Typography>
      </Box>
    </Box>
  );
}
