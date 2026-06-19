import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { currency } from '../lib/stats.js';

// Horizontal track from min -> max, with the contractable band (P25 -> median)
// highlighted and a marker for the current average (spot) rate.
export default function ContractRangeBar({ min, max, contractLow, contractHigh, avg }) {
  const span = max - min;
  const pct = (v) => (span > 0 ? ((v - min) / span) * 100 : 0);
  const bandLeft = pct(contractLow);
  const bandWidth = Math.max(pct(contractHigh) - bandLeft, 0.5);
  const avgLeft = Math.min(Math.max(pct(avg), 0), 100);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Recommended contract range
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
          {currency(contractLow)} – {currency(contractHigh)}
        </Typography>
      </Box>

      {/* Track */}
      <Box sx={{ position: 'relative', height: 14, borderRadius: 7, bgcolor: 'grey.200' }}>
        {/* Contractable band */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${bandLeft}%`,
            width: `${bandWidth}%`,
            borderRadius: 7,
            bgcolor: 'success.main',
            opacity: 0.85,
          }}
        />
        {/* Average (spot) marker */}
        <Box
          title={`Current avg (spot) ${currency(avg)}`}
          sx={{
            position: 'absolute',
            top: -3,
            bottom: -3,
            left: `calc(${avgLeft}% - 1px)`,
            width: 2,
            bgcolor: 'warning.main',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          min {currency(min)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'warning.main' }}>
          avg (spot) {currency(avg)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          max {currency(max)}
        </Typography>
      </Box>
    </Box>
  );
}
