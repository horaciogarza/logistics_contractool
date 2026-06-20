import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// Monthly average rate trend for the selected lane, with an optional market line.
export default function RateTrendChart({ series, fmt, marketValue, title }) {
  const theme = useTheme();
  if (!series || series.length < 2) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>{title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Not enough months of history on this lane to show a trend.
        </Typography>
      </Paper>
    );
  }
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>{title}</Typography>
      <Box sx={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} />
            <YAxis tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} width={56} tickFormatter={(v) => fmt(v)} />
            <Tooltip
              formatter={(v) => [fmt(v), 'Avg']}
              contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}
            />
            {marketValue != null && (
              <ReferenceLine
                y={marketValue}
                stroke={theme.palette.warning.main}
                strokeDasharray="5 4"
                label={{ value: `Market ${fmt(marketValue)}`, position: 'insideTopRight', fontSize: 11, fill: theme.palette.warning.main }}
              />
            )}
            <Line
              type="monotone"
              dataKey="avg"
              stroke={theme.palette.primary.main}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
