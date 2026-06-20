import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import FilterListIcon from '@mui/icons-material/FilterList';
import StraightenIcon from '@mui/icons-material/Straighten';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';

const UNIT_OPTIONS = [
  { value: 'rpm', label: 'Per mile', icon: <StraightenIcon fontSize="small" /> },
  { value: 'absolute', label: 'Per load', icon: <PaymentsOutlinedIcon fontSize="small" /> },
];

const COST_BASIS_OPTIONS = [
  { value: 'linehaul', label: 'Freight (negotiable)' },
  { value: 'accessorials', label: 'Accessorials (negotiable)' },
  { value: 'negotiable', label: 'Freight + Accessorials (negotiable)' },
  { value: 'total', label: 'Total cost' },
];

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
  costBasis,
  onCostBasis,
  unit,
  onUnit,
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
      <Chip
        label="Opportunities only"
        clickable
        onClick={() => onOnlyOpportunities(!onlyOpportunities)}
        icon={onlyOpportunities ? <CheckIcon fontSize="small" /> : <FilterListIcon fontSize="small" />}
        variant={onlyOpportunities ? 'filled' : 'outlined'}
        sx={{
          alignSelf: 'flex-start',
          borderRadius: 2,
          height: 36,
          fontWeight: 500,
          ...(onlyOpportunities
            ? {
                bgcolor: 'secondary.container',
                color: 'secondary.onContainer',
                '& .MuiChip-icon': { color: 'secondary.onContainer' },
                '&:hover': { bgcolor: 'secondary.container' },
              }
            : { '& .MuiChip-icon': { color: 'text.secondary' } }),
        }}
      />

      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}>
          Show metrics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {UNIT_OPTIONS.map((o) => {
            const active = unit === o.value;
            return (
              <Chip
                key={o.value}
                label={o.label}
                clickable
                onClick={() => onUnit(o.value)}
                icon={active ? <CheckIcon fontSize="small" /> : o.icon}
                variant={active ? 'filled' : 'outlined'}
                sx={{
                  flex: 1,
                  borderRadius: 2,
                  height: 36,
                  fontWeight: 500,
                  ...(active
                    ? {
                        bgcolor: 'secondary.container',
                        color: 'secondary.onContainer',
                        '& .MuiChip-icon': { color: 'secondary.onContainer' },
                        '&:hover': { bgcolor: 'secondary.container' },
                      }
                    : { '& .MuiChip-icon': { color: 'text.secondary' } }),
                }}
              />
            );
          })}
        </Box>
      </Box>
      <TextField
        select
        size="small"
        fullWidth
        label={`Rate basis (${unit === 'rpm' ? '$/mile' : '$'})`}
        value={costBasis}
        onChange={(e) => onCostBasis(e.target.value)}
        helperText={`Metrics shown ${unit === 'rpm' ? 'as $/mile' : 'in absolute $ per load'}. Only Freight & Accessorials are negotiable; Fuel & Tax are fixed pass-throughs.`}
      >
        {COST_BASIS_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
