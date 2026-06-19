import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LaneCard from './LaneCard.jsx';

export default function LaneList({ lanes, selectedLane, onSelect, fmt }) {
  if (!lanes.length) {
    return (
      <Typography sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }} variant="body2">
        No lanes match your filters.
      </Typography>
    );
  }
  return (
    <Box sx={{ flex: 1, minHeight: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto' }}>
      {lanes.map((lane) => (
        <LaneCard
          key={lane.lane}
          lane={lane}
          selected={selectedLane === lane.lane}
          onClick={() => onSelect(lane.lane)}
          fmt={fmt}
        />
      ))}
    </Box>
  );
}
