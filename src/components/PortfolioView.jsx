import { useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import { portfolioStats, currency, rpm } from '../lib/stats.js';

const compact = (n) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${Math.round(n)}`;

export default function PortfolioView({ shipments, marketByLane }) {
  const theme = useTheme();
  const { totalSpend, laneSpend, carrierScores } = useMemo(
    () => portfolioStats(shipments, marketByLane),
    [shipments, marketByLane]
  );

  const TOP = 12;
  const pareto = laneSpend.slice(0, TOP).map((l) => ({
    name: `${l.originCity.slice(0, 3).toUpperCase()}–${l.destCity.slice(0, 3).toUpperCase()} ${l.equipmentTypeCode}`,
    spend: Math.round(l.spend),
    cumPct: Math.round(l.cumPct * 100),
  }));
  const topShare = laneSpend.slice(0, TOP).reduce((s, l) => s + l.spendShare, 0);

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', height: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <Paper variant="outlined" sx={{ px: 2, py: 1.5, flex: 1, minWidth: 160 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>Total spend</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{currency(totalSpend)}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ px: 2, py: 1.5, flex: 1, minWidth: 160 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>Lanes</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{laneSpend.length}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ px: 2, py: 1.5, flex: 1, minWidth: 160 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>Carriers</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{carrierScores.length}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ px: 2, py: 1.5, flex: 1, minWidth: 200 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>Top {TOP} lanes = spend share</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{(topShare * 100).toFixed(0)}%</Typography>
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
          Spend concentration by lane (Pareto) — focus negotiation where the money is
        </Typography>
        <Box sx={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={pareto} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke={theme.palette.text.secondary} angle={-35} textAnchor="end" interval={0} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} tickFormatter={compact} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                formatter={(v, n) => (n === 'Cumulative %' ? [`${v}%`, n] : [currency(v), 'Spend'])}
                contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="spend" name="Spend" fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} />
              <Line yAxisId="r" type="monotone" dataKey="cumPct" name="Cumulative %" stroke={theme.palette.warning.main} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
          Carrier scorecard — across the whole network
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Carrier</TableCell>
                <TableCell align="right">Loads</TableCell>
                <TableCell align="right">Spend</TableCell>
                <TableCell align="right">% of spend</TableCell>
                <TableCell align="right">Lanes</TableCell>
                <TableCell align="right">Freight $/mi</TableCell>
                <TableCell align="right">vs Market</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carrierScores.map((c) => (
                <TableRow key={c.carrier} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{c.carrier}</TableCell>
                  <TableCell align="right">{c.loads}</TableCell>
                  <TableCell align="right">{currency(c.spend)}</TableCell>
                  <TableCell align="right">{(c.spendShare * 100).toFixed(1)}%</TableCell>
                  <TableCell align="right">{c.lanes}</TableCell>
                  <TableCell align="right">{rpm(c.freightRpm)}</TableCell>
                  <TableCell align="right">
                    {c.marketDeltaPct == null ? (
                      '—'
                    ) : (
                      <Chip
                        size="small"
                        label={`${c.marketDeltaPct >= 0 ? '+' : ''}${(c.marketDeltaPct * 100).toFixed(0)}%`}
                        sx={{
                          height: 20,
                          fontWeight: 600,
                          bgcolor: c.marketDeltaPct > 0.02 ? 'warning.container' : c.marketDeltaPct < -0.02 ? 'success.container' : 'transparent',
                          color: c.marketDeltaPct > 0.02 ? 'warning.onContainer' : c.marketDeltaPct < -0.02 ? 'success.onContainer' : 'text.secondary',
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
