import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { currency } from '../lib/stats.js';

function Stat({ label, value, color }) {
  return (
    <Box sx={{ textAlign: 'right' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.1 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, color: color ?? 'text.primary', lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function SummaryBar({ shipmentCount, laneCount, opportunityCount, totalSaving }) {
  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 3,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.container',
            color: 'primary.onContainer',
          }}
        >
          <LocalShippingIcon />
        </Box>
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.15 }}>
            Contractool
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Freight rate comparison by lane
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: { xs: 2.5, sm: 4 }, flexWrap: 'wrap' }}>
          <Stat label="Shipments" value={shipmentCount.toLocaleString()} />
          <Stat label="Lanes" value={laneCount.toLocaleString()} />
          <Stat label="Opportunities" value={opportunityCount.toLocaleString()} color="warning.main" />
          <Stat label="Est. savings" value={currency(totalSaving)} color="success.main" />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
