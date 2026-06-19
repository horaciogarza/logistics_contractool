import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { currency } from '../lib/stats.js';

function Stat({ label, value, color }) {
  return (
    <Box sx={{ textAlign: 'right' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
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
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
        <LocalShippingIcon />
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            Contractool
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Freight rate comparison by lane
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: { xs: 2.5, sm: 4 }, color: 'common.white', flexWrap: 'wrap' }}>
          <Stat label="Shipments" value={shipmentCount.toLocaleString()} color="common.white" />
          <Stat label="Lanes" value={laneCount.toLocaleString()} color="common.white" />
          <Stat label="Opportunities" value={opportunityCount.toLocaleString()} color="#ffe082" />
          <Stat label="Est. savings" value={currency(totalSaving)} color="#a5d6a7" />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
