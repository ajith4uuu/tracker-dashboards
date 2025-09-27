import apiClient from './apiClient';
import type {
  ExecutiveOverviewDashboard,
  ResponseQualityDashboard,
  EngagementFunnelDashboard,
  CAHPSDashboard,
  PROMISDashboard,
  CohortComparisonDashboard,
  LongitudinalChangeDashboard,
  TextInsightsDashboard,
  OperationsSLADashboard,
  DataHealthDashboard,
  Patient360Dashboard,
  PatientJourneyMap,
  RiskAlertingDashboard,
  AdherenceActivityDashboard,
  SymptomTrajectoriesDashboard,
  CareTeamPanelDashboard,
  EquityLensDashboard,
  InterventionOutcomesDashboard,
  PROMISScorecardDashboard,
  ExperienceOutcomesDashboard,
} from '../../types/dashboards';

export const dashboardAPI = {
  // Survey-focused dashboards
  getExecutiveOverview: (timeRange: string = '30d'): Promise<ExecutiveOverviewDashboard> => {
    return apiClient.get('/api/dashboards/executive-overview', {
      params: { timeRange }
    }).then(res => res.data);
  },

  getResponseQuality: (params?: {
    startDate?: string;
    endDate?: string;
    surveyId?: string;
  }): Promise<ResponseQualityDashboard> => {
    return apiClient.get('/api/dashboards/response-quality', { params })
      .then(res => res.data);
  },

  getEngagementFunnel: (params?: {
    cohort?: string;
    surveyId?: string;
    timeRange?: string;
  }): Promise<EngagementFunnelDashboard> => {
    return apiClient.get('/api/dashboards/engagement-funnel', { params })
      .then(res => res.data);
  },

  getCAHPSMetrics: (params?: {
    timeRange?: string;
    facility?: string;
    provider?: string;
  }): Promise<CAHPSDashboard> => {
    return apiClient.get('/api/dashboards/cahps', { params })
      .then(res => res.data);
  },

  getPROMISScores: (params?: {
    patientId?: string;
    domain?: string;
    timeRange?: string;
  }): Promise<PROMISDashboard> => {
    return apiClient.get('/api/dashboards/promis', { params })
      .then(res => res.data);
  },

  getCohortComparisons: (params: {
    dimension: 'site' | 'clinician' | 'stage' | 'age' | 'sex' | 'region';
    metric: string;
    adjustForRisk?: boolean;
  }): Promise<CohortComparisonDashboard> => {
    return apiClient.get('/api/dashboards/cohort-comparison', { params })
      .then(res => res.data);
  },

  getLongitudinalChange: (params: {
    cohortId?: string;
    interventionDate?: string;
    metric: string;
  }): Promise<LongitudinalChangeDashboard> => {
    return apiClient.get('/api/dashboards/longitudinal-change', { params })
      .then(res => res.data);
  },

  getTextInsights: (params?: {
    timeRange?: string;
    minFrequency?: number;
    sentimentFilter?: string;
  }): Promise<TextInsightsDashboard> => {
    return apiClient.get('/api/dashboards/text-insights', { params })
      .then(res => res.data);
  },

  getOperationsSLA: (params?: {
    timeRange?: string;
    campaign?: string;
  }): Promise<OperationsSLADashboard> => {
    return apiClient.get('/api/dashboards/operations-sla', { params })
      .then(res => res.data);
  },

  getDataHealth: (): Promise<DataHealthDashboard> => {
    return apiClient.get('/api/dashboards/data-health')
      .then(res => res.data);
  },

  // Patient-focused dashboards
  getPatient360: (patientId: string): Promise<Patient360Dashboard> => {
    return apiClient.get(`/api/dashboards/patient-360/${patientId}`)
      .then(res => res.data);
  },

  getPatientJourneyMap: (patientId: string): Promise<PatientJourneyMap> => {
    return apiClient.get(`/api/dashboards/patient-journey/${patientId}`)
      .then(res => res.data);
  },

  getRiskAlerting: (params?: {
    severity?: 'all' | 'critical' | 'warning';
    domain?: string;
    unacknowledgedOnly?: boolean;
  }): Promise<RiskAlertingDashboard> => {
    return apiClient.get('/api/dashboards/risk-alerting', { params })
      .then(res => res.data);
  },

  getAdherenceActivity: (params?: {
    patientId?: string;
    clinicianId?: string;
    timeRange?: string;
  }): Promise<AdherenceActivityDashboard> => {
    return apiClient.get('/api/dashboards/adherence-activity', { params })
      .then(res => res.data);
  },

  getSymptomTrajectories: (params: {
    cohort?: string;
    domain: string;
    visualizationType: 'spaghetti' | 'ridge' | 'heatmap';
  }): Promise<SymptomTrajectoriesDashboard> => {
    return apiClient.get('/api/dashboards/symptom-trajectories', { params })
      .then(res => res.data);
  },

  getCareTeamPanel: (clinicianId?: string): Promise<CareTeamPanelDashboard> => {
    return apiClient.get('/api/dashboards/care-team-panel', {
      params: { clinicianId }
    }).then(res => res.data);
  },

  getEquityLens: (params?: {
    dimension: 'race' | 'ethnicity' | 'language' | 'income' | 'zip';
    metric: string;
    suppressSmallCells?: boolean;
  }): Promise<EquityLensDashboard> => {
    return apiClient.get('/api/dashboards/equity-lens', { params })
      .then(res => res.data);
  },

  getInterventionOutcomes: (params: {
    interventionId: string;
    beforePeriod: string;
    afterPeriod: string;
    subgroupAnalysis?: boolean;
  }): Promise<InterventionOutcomesDashboard> => {
    return apiClient.get('/api/dashboards/intervention-outcomes', { params })
      .then(res => res.data);
  },

  getPROMISScorecard: (params?: {
    domain?: string;
    timeRange?: string;
    normReference?: string;
  }): Promise<PROMISScorecardDashboard> => {
    return apiClient.get('/api/dashboards/promis-scorecard', { params })
      .then(res => res.data);
  },

  getExperienceOutcomes: (params?: {
    timeRange?: string;
    minSampleSize?: number;
  }): Promise<ExperienceOutcomesDashboard> => {
    return apiClient.get('/api/dashboards/experience-outcomes', { params })
      .then(res => res.data);
  },

  // Utility endpoints
  exportDashboard: (dashboardType: string, format: 'pdf' | 'excel' | 'csv', params?: any) => {
    return apiClient.get(`/api/dashboards/export/${dashboardType}`, {
      params: { format, ...params },
      responseType: 'blob'
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dashboardType}-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  },

  subscribeToAlerts: (dashboardType: string, config: {
    email?: string;
    webhook?: string;
    thresholds?: any;
    frequency?: 'realtime' | 'hourly' | 'daily';
  }) => {
    return apiClient.post('/api/dashboards/subscribe', {
      dashboardType,
      ...config
    });
  },

  getAvailableBenchmarks: () => {
    return apiClient.get('/api/dashboards/benchmarks')
      .then(res => res.data);
  },

  refreshDashboardData: (dashboardType: string) => {
    return apiClient.post(`/api/dashboards/refresh/${dashboardType}`)
      .then(res => res.data);
  },
};
