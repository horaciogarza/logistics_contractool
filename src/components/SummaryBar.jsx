import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Tooltip from '@mui/material/Tooltip';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { currency } from '../lib/stats.js';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: <LightModeOutlinedIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeOutlinedIcon fontSize="small" /> },
  { value: 'system', label: 'System', icon: <SettingsBrightnessOutlinedIcon fontSize="small" /> },
];

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

export default function SummaryBar({ shipmentCount, laneCount, opportunityCount, totalSaving, themeMode, onThemeMode }) {
  const [anchorEl, setAnchorEl] = useState(null);

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

        <Tooltip title="Settings" arrow>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }} aria-label="settings">
            <SettingsOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '32px' }}>Appearance</ListSubheader>
          {THEME_OPTIONS.map((opt) => (
            <MenuItem
              key={opt.value}
              selected={themeMode === opt.value}
              onClick={() => {
                onThemeMode(opt.value);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>{opt.icon}</ListItemIcon>
              <ListItemText>{opt.label}</ListItemText>
              {themeMode === opt.value && <CheckIcon fontSize="small" sx={{ ml: 2, color: 'primary.main' }} />}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
