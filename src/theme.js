import { createTheme } from '@mui/material/styles';

// Material Design theme. Indigo primary / amber secondary, Roboto type scale.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#f59e0b' },
    success: { main: '#2e7d32' },
    warning: { main: '#ed6c02' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
  },
  shape: { borderRadius: 8 },
});

export default theme;
