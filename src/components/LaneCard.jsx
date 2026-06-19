import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { currency, rpm } from '../lib/stats.js';

export default function LaneCard({ lane, selected, onClick, fmt = rpm }) {
  return (
    <Card
      onClick={onClick}
      variant="outlined"
      sx={{
        cursor: 'pointer',
        flexShrink: 0,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'secondary.container' : 'm3.surfaceContainerLow',
        '&:hover': {
          bgcolor: selected ? 'secondary.container' : 'm3.surfaceContainerHigh',
          boxShadow: 1,
        },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {lane.originCity}, {lane.originState} → {lane.destCity}, {lane.destState}
          </Typography>
          {lane.isOpportunity && (
            <Chip
              label="Opportunity"
              size="small"
              sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: 'warning.container', color: 'warning.onContainer' }}
            />
          )}
        </Box>

        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={lane.equipmentTypeCode} size="small" sx={{ height: 20, fontFamily: 'monospace' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {lane.equipmentTypeDesc} · {lane.count} shipments
          </Typography>
        </Box>

        {/* Headline metric: selected basis in the selected unit */}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
            {fmt(lane.avg)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            avg · {lane.miles.toLocaleString()} mi · {fmt(lane.min)}–{fmt(lane.max)}
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
          Contract ~{' '}
          <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
            {fmt(lane.contractLow)} – {fmt(lane.contractHigh)}
          </Box>
        </Typography>

        {lane.recommendedIncumbents.length > 0 && (
          <Typography variant="caption" sx={{ mt: 0.25, display: 'block', color: 'text.secondary' }} noWrap>
            Dedicate to:{' '}
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
              {lane.recommendedIncumbents.map((c) => c.carrierName).join(', ')}
            </Box>
          </Typography>
        )}

        <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{ color: lane.cv >= 0.15 ? 'warning.main' : 'text.secondary', fontWeight: lane.cv >= 0.15 ? 600 : 400 }}
          >
            Volatility {(lane.cv * 100).toFixed(0)}%
          </Typography>
          {lane.isOpportunity && (
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
              Save ~{currency(lane.contractSaving)}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
