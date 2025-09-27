import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AnalyticsData {
  totalPatients: number;
  totalEvents: number;
  eventDistribution: Array<{ eventName: string; count: number }>;
  patientActivity: Array<{
    date: string;
    uniquePatients: number;
    totalEvents: number;
  }>;
  completionRates: Array<{
    eventName: string;
    started: number;
    completed: number;
    completionRate: number;
  }>;
}

interface AnalyticsState {
  data: AnalyticsData | null;
  trends: any[];
  insights: {
    summary: string;
    keyPoints: string[];
    recommendations: string[];
  } | null;
  loading: boolean;
  error: string | null;
  timeRange: 'day' | 'week' | 'month' | 'year';
}

const initialState: AnalyticsState = {
  data: null,
  trends: [],
  insights: null,
  loading: false,
  error: null,
  timeRange: 'week',
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setAnalyticsData: (state, action: PayloadAction<AnalyticsData>) => {
      state.data = action.payload;
    },
    setTrends: (state, action: PayloadAction<any[]>) => {
      state.trends = action.payload;
    },
    setInsights: (state, action: PayloadAction<typeof initialState.insights>) => {
      state.insights = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTimeRange: (state, action: PayloadAction<typeof initialState.timeRange>) => {
      state.timeRange = action.payload;
    },
  },
});

export const {
  setAnalyticsData,
  setTrends,
  setInsights,
  setLoading,
  setError,
  setTimeRange,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
