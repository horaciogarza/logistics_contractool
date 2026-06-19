import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { currency } from '../lib/stats.js';

function Metric({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function LaneCard({ lane, selected, onClick }) {
  return (
    <Card
      onClick={onClick}
      variant="outlined"
      sx={{
        cursor: 'pointer',
        flexShrink: 0,
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? 'action.selected' : 'background.paper',
        boxShadow: selected ? 4 : 0,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        '&:hover': { borderColor: 'primary.light', boxShadow: 1 },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {lane.originCity}, {lane.originState} → {lane.destCity}, {lane.destState}
          </Typography>
          {lane.isOpportunity && (
            <Chip label="Opportunity" color="warning" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 600 }} />
          )}
        </Box>

        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={lane.equipmentTypeCode} size="small" sx={{ height: 20, fontFamily: 'monospace' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {lane.equipmentTypeDesc} · {lane.count} shipments
          </Typography>
        </Box>

        <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
          <Metric label="Min" value={currency(lane.min)} />
          <Metric label="Avg" value={currency(lane.avg)} />
          <Metric label="Max" value={currency(lane.max)} />
        </Box>

        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
          Contract ~{' '}
          <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
            {currency(lane.contractLow)} – {currency(lane.contractHigh)}
          </Box>
        </Typography>

        <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{ color: lane.cv >= 0.15 ? 'warning.main' : 'text.secondary', fontWeight: lane.cv >= 0.15 ? 600 : 400 }}
          >
            Volatility {(lane.cv * 100).toFixed(0)}%
          </Typography>
          {lane.isOpportunity && (
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
              Save ~{currency(lane.potentialSaving)}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
