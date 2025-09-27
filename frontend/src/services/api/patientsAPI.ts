import apiClient from './apiClient';

export const patientsAPI = {
  getPatients: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    return apiClient.get('/api/patients', { params });
  },

  getPatientJourney: (patientId: string) => {
    return apiClient.get(`/api/patients/${patientId}/journey`);
  },

  getPatientTimeline: (
    patientId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ) => {
    return apiClient.get(`/api/patients/${patientId}/timeline`, { params });
  },

  getPatientAnalytics: (patientId: string) => {
    return apiClient.get(`/api/patients/${patientId}/analytics`);
  },

  addPatientNote: (patientId: string, note: string) => {
    return apiClient.post(`/api/patients/${patientId}/notes`, { note });
  },

  getPatientNotes: (patientId: string) => {
    return apiClient.get(`/api/patients/${patientId}/notes`);
  },

  getPatientRiskAssessment: (patientId: string) => {
    return apiClient.get(`/api/patients/${patientId}/risk`);
  },
};
