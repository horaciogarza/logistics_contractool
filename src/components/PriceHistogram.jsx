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

export default function PriceHistogram({ lane, valueOf, basisLabel = 'Freight', fmt = rpm, unit = 'rpm' }) {
  const theme = useTheme();
  const unitSuffix = unit === 'rpm' ? ' $/mi' : '';
  const unitWord = unit === 'rpm' ? 'rate per mile' : 'cost per load';

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

      {/* Headline metric: rate per mile for the selected basis (M3 tonal highlight) */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: 'primary.container', color: 'primary.onContainer' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.8, lineHeight: 1.2, display: 'block' }}>
              {unit === 'rpm' ? 'Rate per mile' : 'Cost per load'} · {basisLabel}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {fmt(lane.avg)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>avg</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', lineHeight: 1 }}>
                Range
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {fmt(lane.min)} – {fmt(lane.max)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', lineHeight: 1 }}>
                Contract target
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {fmt(lane.contractLow)} – {fmt(lane.contractHigh)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', lineHeight: 1 }}>
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
          label={`Min${unitSuffix}`}
          value={fmt(lane.min)}
          tip={
            <Explain
              what={`Lowest ${basisLabel.toLowerCase()} ${unitWord} on this lane.`}
              example={`The cheapest of the ${lane.count} loads was ${fmt(lane.min)}.`}
            />
          }
        />
        <StatChip
          label={`Avg${unitSuffix}`}
          value={fmt(lane.avg)}
          tip={
            <Explain
              what={`Average (mean) ${basisLabel.toLowerCase()} ${unitWord} — what you typically pay on the spot market today.`}
              example={`Mean of the ${lane.count} loads' ${basisLabel.toLowerCase()} = ${fmt(lane.avg)}.`}
            />
          }
        />
        <StatChip
          label={`Max${unitSuffix}`}
          value={fmt(lane.max)}
          tip={
            <Explain
              what={`Highest ${basisLabel.toLowerCase()} ${unitWord} on this lane — the worst spot rate you got hit with.`}
              example={`The most expensive of the ${lane.count} loads was ${fmt(lane.max)}.`}
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
              example={`std dev ${fmt(lane.stdDev)} ÷ avg ${fmt(lane.avg)} = ${(lane.cv * 100).toFixed(0)}%.`}
            />
          }
        />
        <StatChip
          label={`Contract${unitSuffix}`}
          value={`${fmt(lane.contractLow)} – ${fmt(lane.contractHigh)}`}
          color="success.main"
          tip={
            <Explain
              what={`${unit === 'rpm' ? 'Rate-per-mile' : 'Per-load cost'} band you could realistically lock in a contract: from the 25th percentile (a quarter of loads were this cheap or cheaper) up to the median (half were).`}
              example={`A quarter of loads were ≤ ${fmt(lane.contractLow)} and half ≤ ${fmt(lane.contractHigh)}, so aim to contract in that band.`}
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
          format={fmt}
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
                example={`Up to 3 carriers that price at or below the ${fmt(lane.avg)} lane average and have proven they can run the volume.`}
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
                  {c.count} loads ({(c.share * 100).toFixed(0)}% of lane) · avg {fmt(c.avg)} ·{' '}
                  {(c.cv * 100).toFixed(0)}% volatility
                </Typography>
              </Box>
              <Chip
                label={c.avg <= lane.avg ? `${fmt(lane.avg - c.avg)} under avg` : 'top ranked'}
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
          Target a contract between {fmt(lane.contractLow)} and {fmt(lane.contractHigh)} (vs{' '}
          {fmt(lane.avg)} avg spot) — locking the band could save ~{currency(lane.contractSaving)}.
        </Alert>
      )}

      {lane.contractSaving > 0 && (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'm3.surfaceContainerHigh' }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
            How the savings estimate works
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Right now these {lane.count} shipments average {fmt(lane.avg)} on the spot market
            ({lane.miles.toLocaleString()} mi). A quarter of the loads have already moved at{' '}
            {fmt(lane.contractLow)} or less, and half at {fmt(lane.contractHigh)} or less, so a contract
            anywhere in that band is realistic rather than wishful. Booking every load at the top of the
            band ({fmt(lane.contractHigh)}) instead of today's average adds up to about
            {' '}{currency(lane.contractSaving)} saved across the lane; negotiating toward the low end
            ({fmt(lane.contractLow)}) would save more.
          </Typography>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          {basisLabel} {unit === 'rpm' ? '$/mile' : '$'} distribution by carrier
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
