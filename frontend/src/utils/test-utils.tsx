import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import '@testing-library/jest-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import { theme } from '../theme/theme';

// Create a test store factory
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      // Add other reducers as needed
    },
    preloadedState,
  });
}

// Create a test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });
}

// Custom render function that includes all providers
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <SnackbarProvider maxSnack={3}>
                {children}
              </SnackbarProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    );
  }

  return { 
    store, 
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }) 
  };
}

// Mock API responses
export const mockApiResponses = {
  sendOTP: {
    success: true,
    message: 'OTP sent successfully',
  },
  verifyOTP: {
    success: true,
    token: 'mock-jwt-token',
    user: {
      userId: 'test-user-123',
      email: 'test@example.com',
    },
  },
  dashboard: {
    data: {
      totalPatients: 150,
      totalEvents: 450,
      eventDistribution: [
        { eventName: 'Registration', count: 150 },
        { eventName: 'Survey', count: 300 },
      ],
      patientActivity: [
        { date: '2024-01-01', uniquePatients: 25, totalEvents: 75 },
        { date: '2024-01-02', uniquePatients: 30, totalEvents: 90 },
      ],
      completionRates: [
        { eventName: 'Survey', completionRate: 85 },
      ],
    },
    insights: {
      summary: 'Overall engagement is high',
      keyPoints: ['Point 1', 'Point 2'],
      recommendations: ['Recommendation 1'],
    },
  },
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { fireEvent, waitFor, screen };
