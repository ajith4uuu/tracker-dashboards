import apiClient from './apiClient';

export const analyticsAPI = {
  getDashboard: (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') => {
    return apiClient.get('/api/analytics/dashboard', {
      params: { timeRange },
    });
  },

  getTrends: (params: {
    startDate?: string;
    endDate?: string;
    metric?: string;
  }) => {
    return apiClient.get('/api/analytics/trends', { params });
  },

  getComparison: (params: {
    period1Start: string;
    period1End: string;
    period2Start: string;
    period2End: string;
  }) => {
    return apiClient.get('/api/analytics/compare', { params });
  },

  getFunnelAnalysis: (params: {
    events: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiClient.get('/api/analytics/funnel', { params });
  },

  getCohortAnalysis: (params: {
    cohortBy?: string;
    metric?: string;
  }) => {
    return apiClient.get('/api/analytics/cohorts', { params });
  },

  exportData: (params: {
    format: 'csv' | 'json';
    table: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiClient.get('/api/analytics/export', {
      params,
      responseType: params.format === 'csv' ? 'blob' : 'json',
    });
  },
};
