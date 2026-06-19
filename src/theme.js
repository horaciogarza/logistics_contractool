import { createTheme } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// Material 3 (m3.material.io) light & dark schemes from a corporate blue seed.
// Color roles, tonal surface containers, the M3 type scale, shape, emphasized
// motion, and component defaults are centralized so the whole app inherits a
// consistent Material You look in either mode.
// ---------------------------------------------------------------------------

const light = {
  primary: '#415F91', onPrimary: '#FFFFFF', primaryContainer: '#D6E3FF', onPrimaryContainer: '#001B3E',
  secondary: '#565F71', onSecondary: '#FFFFFF', secondaryContainer: '#DAE2F9', onSecondaryContainer: '#131C2B',
  tertiary: '#3B6470', onTertiary: '#FFFFFF', tertiaryContainer: '#BFE9F8', onTertiaryContainer: '#001F28',
  error: '#BA1A1A', onError: '#FFFFFF', errorContainer: '#FFDAD6', onErrorContainer: '#410002',
  warning: '#7A5900', warningContainer: '#FFDF9B', onWarningContainer: '#261A00',
  background: '#F9F9FF', onBackground: '#191C20', surface: '#F9F9FF', onSurface: '#191C20',
  surfaceVariant: '#E0E2EC', onSurfaceVariant: '#43474E',
  surfaceDim: '#D8DAE0', surfaceBright: '#F9F9FF',
  surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#F2F3FA', surfaceContainer: '#ECEDF4',
  surfaceContainerHigh: '#E7E8EE', surfaceContainerHighest: '#E1E2E9',
  outline: '#74777F', outlineVariant: '#C4C6D0',
  textDisabled: '#9295A0',
};

const dark = {
  primary: '#AAC7FF', onPrimary: '#0A305F', primaryContainer: '#284777', onPrimaryContainer: '#D6E3FF',
  secondary: '#BEC6DC', onSecondary: '#283141', secondaryContainer: '#3E4759', onSecondaryContainer: '#DAE2F9',
  tertiary: '#A3CDDC', onTertiary: '#033541', tertiaryContainer: '#224C58', onTertiaryContainer: '#BFE9F8',
  error: '#FFB4AB', onError: '#690005', errorContainer: '#93000A', onErrorContainer: '#FFDAD6',
  warning: '#ECC069', warningContainer: '#5C4300', onWarningContainer: '#FFDF9B',
  background: '#111318', onBackground: '#E2E2E9', surface: '#111318', onSurface: '#E2E2E9',
  surfaceVariant: '#43474E', onSurfaceVariant: '#C4C6D0',
  surfaceDim: '#111318', surfaceBright: '#37393E',
  surfaceContainerLowest: '#0C0E13', surfaceContainerLow: '#191C20', surfaceContainer: '#1D2024',
  surfaceContainerHigh: '#282A2F', surfaceContainerHighest: '#33353A',
  outline: '#8E9099', outlineVariant: '#43474E',
  textDisabled: '#8A8D96',
};

function buildTheme(m3, mode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: m3.primary, contrastText: m3.onPrimary, container: m3.primaryContainer, onContainer: m3.onPrimaryContainer },
      secondary: { main: m3.secondary, contrastText: m3.onSecondary, container: m3.secondaryContainer, onContainer: m3.onSecondaryContainer },
      success: { main: m3.tertiary, contrastText: m3.onTertiary, container: m3.tertiaryContainer, onContainer: m3.onTertiaryContainer },
      warning: { main: m3.warning, contrastText: mode === 'light' ? '#FFFFFF' : m3.onWarningContainer, container: m3.warningContainer, onContainer: m3.onWarningContainer },
      error: { main: m3.error, contrastText: m3.onError, container: m3.errorContainer, onContainer: m3.onErrorContainer },
      info: { main: m3.secondary },
      background: { default: m3.background, paper: m3.surfaceContainerLow },
      text: { primary: m3.onSurface, secondary: m3.onSurfaceVariant, disabled: m3.textDisabled },
      divider: m3.outlineVariant,
      m3,
    },

    shape: { borderRadius: 12 },

    typography: {
      fontFamily: 'Aptos, Roboto, "Helvetica Neue", Arial, sans-serif',
      h4: { fontWeight: 400, letterSpacing: 0 },
      h5: { fontWeight: 400, letterSpacing: 0 },
      h6: { fontWeight: 500, letterSpacing: 0.15 },
      subtitle1: { fontWeight: 500, letterSpacing: 0.15 },
      subtitle2: { fontWeight: 500, letterSpacing: 0.1 },
      body1: { letterSpacing: 0.5 },
      body2: { letterSpacing: 0.25 },
      button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0.1 },
      overline: { letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 500 },
      caption: { letterSpacing: 0.4 },
    },

    transitions: {
      easing: {
        easeInOut: 'cubic-bezier(0.2, 0, 0, 1)',
        easeOut: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        easeIn: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        sharp: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      duration: { shortest: 100, shorter: 150, short: 200, standard: 250, complex: 350 },
    },

    components: {
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: m3.background } } },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'default' },
        styleOverrides: {
          root: { backgroundColor: m3.surface, color: m3.onSurface, borderBottom: `1px solid ${m3.outlineVariant}` },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: m3.outlineVariant } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: m3.surfaceContainerLow,
            transition: 'box-shadow 250ms cubic-bezier(0.2,0,0,1), border-color 250ms cubic-bezier(0.2,0,0,1), background-color 150ms',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 999, paddingInline: 20, minHeight: 40 } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8, fontWeight: 500 }, outlined: { borderColor: m3.outlineVariant } },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 500, borderColor: m3.outline, color: m3.onSurfaceVariant,
            '&.Mui-selected': {
              backgroundColor: m3.secondaryContainer, color: m3.onSecondaryContainer,
              '&:hover': { backgroundColor: m3.secondaryContainer },
            },
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: { borderRadius: 999 },
          grouped: {
            '&:first-of-type': { borderTopLeftRadius: 999, borderBottomLeftRadius: 999 },
            '&:last-of-type': { borderTopRightRadius: 999, borderBottomRightRadius: 999 },
          },
        },
      },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: m3.onSurface, color: m3.surface, borderRadius: 8, fontSize: 12, padding: '8px 12px', maxWidth: 320,
          },
          arrow: { color: m3.onSurface },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: m3.outlineVariant },
          head: { backgroundColor: m3.surfaceContainer, color: m3.onSurfaceVariant, fontWeight: 600 },
        },
      },
    },
  });
}

const lightTheme = buildTheme(light, 'light');
const darkTheme = buildTheme(dark, 'dark');

// mode: 'light' | 'dark' | 'system'
export function resolveMode(mode) {
  if (mode === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

export function getTheme(mode) {
  return resolveMode(mode) === 'dark' ? darkTheme : lightTheme;
}

export default lightTheme;
