import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import SearchIcon from '@mui/icons-material/Search';

export const SORTS = [
  { value: 'opportunity', label: 'Opportunity score' },
  { value: 'count', label: 'Shipment count' },
  { value: 'avg', label: 'Avg cost' },
  { value: 'cv', label: 'Price volatility' },
];

export default function Filters({
  search,
  onSearch,
  equipment,
  onEquipment,
  equipmentOptions,
  direction,
  onDirection,
  directionOptions,
  sort,
  onSort,
  onlyOpportunities,
  onOnlyOpportunities,
}) {
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <TextField
        size="small"
        fullWidth
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search lane…"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          select
          size="small"
          fullWidth
          label="Equipment"
          value={equipment}
          onChange={(e) => onEquipment(e.target.value)}
        >
          <MenuItem value="">All equipment</MenuItem>
          {equipmentOptions.map((e) => (
            <MenuItem key={e} value={e}>{e}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          fullWidth
          label="Direction"
          value={direction}
          onChange={(e) => onDirection(e.target.value)}
        >
          <MenuItem value="">All directions</MenuItem>
          {directionOptions.map((d) => (
            <MenuItem key={d} value={d}>{d}</MenuItem>
          ))}
        </TextField>
      </Box>
      <TextField select size="small" fullWidth label="Sort by" value={sort} onChange={(e) => onSort(e.target.value)}>
        {SORTS.map((s) => (
          <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
        ))}
      </TextField>
      <FormControlLabel
        control={<Switch checked={onlyOpportunities} onChange={(e) => onOnlyOpportunities(e.target.checked)} />}
        label="Opportunities only"
      />
    </Box>
  );
}
