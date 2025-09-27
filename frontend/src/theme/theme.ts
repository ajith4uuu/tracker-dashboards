import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#FF69B4', // Pink for breast cancer awareness
      light: '#FFB6C1',
      dark: '#FF1493',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4A90E2',
      light: '#6CA5E6',
      dark: '#3676C8',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#4CAF50',
      light: '#6FBF73',
      dark: '#388E3C',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C3E50',
      secondary: '#7F8C8D',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.05)',
    '0px 8px 16px rgba(0,0,0,0.05)',
    '0px 16px 24px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 2px 4px rgba(0,0,0,0.08)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 8px 16px rgba(0,0,0,0.08)',
    '0px 16px 24px rgba(0,0,0,0.08)',
    '0px 24px 32px rgba(0,0,0,0.08)',
    '0px 2px 4px rgba(0,0,0,0.12)',
    '0px 4px 8px rgba(0,0,0,0.12)',
    '0px 8px 16px rgba(0,0,0,0.12)',
    '0px 16px 24px rgba(0,0,0,0.12)',
    '0px 24px 32px rgba(0,0,0,0.12)',
    '0px 2px 4px rgba(0,0,0,0.16)',
    '0px 4px 8px rgba(0,0,0,0.16)',
    '0px 8px 16px rgba(0,0,0,0.16)',
    '0px 16px 24px rgba(0,0,0,0.16)',
    '0px 24px 32px rgba(0,0,0,0.16)',
    '0px 2px 4px rgba(0,0,0,0.20)',
    '0px 4px 8px rgba(0,0,0,0.20)',
    '0px 8px 16px rgba(0,0,0,0.20)',
    '0px 24px 32px rgba(0,0,0,0.20)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 8px rgba(0,0,0,0.05)',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Dark theme variant
export const darkTheme = createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF69B4',
      light: '#FFB6C1',
      dark: '#FF1493',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4A90E2',
      light: '#6CA5E6',
      dark: '#3676C8',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
  },
});
