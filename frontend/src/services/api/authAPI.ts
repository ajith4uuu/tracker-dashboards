import apiClient from './apiClient';

export const authAPI = {
  sendOTP: (email: string) => {
    return apiClient.post('/api/auth/send-otp', { email });
  },

  verifyOTP: (email: string, otp: string) => {
    return apiClient.post('/api/auth/verify-otp', { email, otp });
  },

  logout: () => {
    return apiClient.post('/api/auth/logout');
  },

  refreshToken: () => {
    return apiClient.post('/api/auth/refresh-token');
  },

  validateToken: () => {
    return apiClient.post('/api/auth/validate');
  },

  getCurrentUser: () => {
    return apiClient.get('/api/auth/me');
  },
};
