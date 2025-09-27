// Dashboard Types and Interfaces for Healthcare Analytics

export interface DashboardMetric {
  id: string;
  name: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  target?: number;
  status?: 'success' | 'warning' | 'error';
  unit?: string;
  description?: string;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  category?: string;
  confidence?: number;
}

// Survey-focused dashboards
export interface ExecutiveOverviewDashboard {
  submissions: {
    total: number;
    trend30Days: ChartDataPoint[];
    changePercent: number;
  };
  completionRate: {
    current: number;
    target: number;
    trend30Days: ChartDataPoint[];
  };
  medianTimeToComplete: {
    minutes: number;
    distribution: ChartDataPoint[];
  };
  topBoxSatisfaction: {
    percent: number;
    nps: number;
    trend30Days: ChartDataPoint[];
  };
  ahrqBenchmark: {
    score: number;
    percentile: number;
    comparison: 'above' | 'at' | 'below';
  };
}

export interface ResponseQualityDashboard {
  itemNonresponse: {
    rate: number;
    byQuestion: Array<{
      questionId: string;
      questionText: string;
      nonresponseRate: number;
    }>;
  };
  straightLining: {
    detectedCount: number;
    percentOfResponses: number;
    patterns: Array<{
      pattern: string;
      count: number;
    }>;
  };
  timePerQuestion: {
    median: number;
    distribution: ChartDataPoint[];
    outliers: Array<{
      responseId: string;
      timeSeconds: number;
      flagged: boolean;
    }>;
  };
  deviceMix: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  languageMix: {
    [language: string]: number;
  };
}

export interface EngagementFunnelDashboard {
  funnel: {
    invited: number;
    opened: number;
    started: number;
    completed: number;
  };
  dropOffBySection: Array<{
    section: string;
    startedCount: number;
    completedCount: number;
    dropOffRate: number;
  }>;
  dropOffByQuestion: Array<{
    questionId: string;
    questionText: string;
    dropOffCount: number;
    dropOffRate: number;
  }>;
  reasonsFlagged: Array<{
    reason: string;
    count: number;
    examples: string[];
  }>;
}

export interface CAHPSDashboard {
  domains: {
    provider: {
      topBoxPercent: number;
      score: number;
      items: Array<{
        question: string;
        topBoxPercent: number;
      }>;
    };
    access: {
      topBoxPercent: number;
      score: number;
      items: Array<{
        question: string;
        topBoxPercent: number;
      }>;
    };
    communication: {
      topBoxPercent: number;
      score: number;
      items: Array<{
        question: string;
        topBoxPercent: number;
      }>;
    };
  };
  globalRatings: {
    overallRating: number;
    recommendRating: number;
  };
  npsView: {
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
  };
  cmsBenchmark: {
    percentile: number;
    starRating: number;
  };
}

export interface PROMISDashboard {
  domains: Array<{
    name: 'pain' | 'fatigue' | 'anxiety' | 'physicalFunction' | 'socialFunction';
    tScore: number;
    standardError: number;
    percentile: number;
    severity: 'normal' | 'mild' | 'moderate' | 'severe';
  }>;
  clinicallyMeaningfulChange: {
    improved: string[];
    worsened: string[];
    stable: string[];
  };
  mcidBands: {
    [domain: string]: {
      current: number;
      mcidThreshold: number;
      withinMCID: boolean;
    };
  };
  itemResponseTheory: {
    theta: number;
    information: ChartDataPoint[];
  };
}

export interface CohortComparisonDashboard {
  comparisons: Array<{
    dimension: 'site' | 'clinician' | 'stage' | 'age' | 'sex' | 'region';
    groups: Array<{
      name: string;
      n: number;
      mean: number;
      ci95Lower: number;
      ci95Upper: number;
      riskAdjustedDelta?: number;
    }>;
  }>;
  statisticalTests: {
    pValue: number;
    effectSize: number;
    interpretation: string;
  };
  adjustmentFactors: string[];
}

export interface LongitudinalChangeDashboard {
  trajectories: {
    preIntervention: ChartDataPoint[];
    postIntervention: ChartDataPoint[];
    changeScore: number;
    pValue: number;
  };
  followUpPoints: Array<{
    timepoint: string;
    n: number;
    mean: number;
    sd: number;
  }>;
  spcAnalysis: {
    controlLimits: {
      upper: number;
      center: number;
      lower: number;
    };
    violations: Array<{
      type: string;
      timepoint: Date;
      value: number;
    }>;
  };
}

export interface TextInsightsDashboard {
  themes: Array<{
    theme: string;
    frequency: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    keywords: string[];
  }>;
  sentimentByTheme: {
    [theme: string]: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  exampleVerbatims: Array<{
    text: string;
    theme: string;
    sentiment: string;
    patientId?: string;
  }>;
}

export interface OperationsSLADashboard {
  invitationThroughput: {
    sent: number;
    delivered: number;
    opened: number;
    ratePerHour: number;
  };
  bounceMetrics: {
    bounceRate: number;
    undeliverableRate: number;
    invalidEmails: string[];
  };
  reminderEfficacy: {
    remindersent: number;
    responseRate: number;
    optimalTiming: string;
  };
  costMetrics: {
    costPerInvite: number;
    costPerComplete: number;
    totalCost: number;
    roi: number;
  };
}

export interface DataHealthDashboard {
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
  };
  anomalies: {
    lateSubmissions: number;
    duplicates: number;
    schemaDrift: Array<{
      field: string;
      expectedType: string;
      foundType: string;
    }>;
  };
  refreshStatus: {
    lastRefresh: Date;
    nextScheduled: Date;
    status: 'success' | 'running' | 'failed';
  };
  bigQueryUsage: {
    slotHours: number;
    bytesProcessed: number;
    costUSD: number;
    queryCount: number;
  };
}

// Patient-focused dashboards
export interface Patient360Dashboard {
  patientId: string;
  latestScores: {
    [domain: string]: {
      value: number;
      band: 'red' | 'amber' | 'green';
      change: number;
      lastUpdated: Date;
    };
  };
  recentNotes: Array<{
    date: Date;
    author: string;
    note: string;
    type: 'clinical' | 'patient' | 'system';
  }>;
  nextTasks: Array<{
    task: string;
    dueDate: Date;
    priority: 'high' | 'medium' | 'low';
    assigned?: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
  }>;
}

export interface PatientJourneyMap {
  events: Array<{
    date: Date;
    type: 'referral' | 'diagnosis' | 'treatment' | 'followup' | 'pro';
    description: string;
    outcome?: string;
  }>;
  proTrends: {
    [domain: string]: ChartDataPoint[];
  };
  milestones: Array<{
    name: string;
    date: Date;
    achieved: boolean;
  }>;
}

export interface RiskAlertingDashboard {
  activeAlerts: Array<{
    patientId: string;
    domain: string;
    threshold: number;
    currentValue: number;
    triggered: Date;
    action: string;
  }>;
  mcidViolations: Array<{
    patientId: string;
    domain: string;
    direction: 'worsened' | 'improved';
    magnitude: number;
  }>;
  outreachWindows: Array<{
    patientId: string;
    reason: string;
    windowStart: Date;
    windowEnd: Date;
    contacted: boolean;
  }>;
}

export interface AdherenceActivityDashboard {
  completionCadence: {
    onTime: number;
    late: number;
    missed: number;
  };
  missedWindows: Array<{
    patientId: string;
    scheduledDate: Date;
    daysMissed: number;
    remindersent: number;
  }>;
  reminderOutcomes: {
    sent: number;
    opened: number;
    completed: number;
    effectiveness: number;
  };
}

export interface SymptomTrajectoriesDashboard {
  trajectoryPlots: {
    type: 'spaghetti' | 'ridge' | 'heatmap';
    data: Array<{
      patientId: string;
      trajectory: ChartDataPoint[];
      cluster?: string;
    }>;
  };
  responderAnalysis: {
    responders: string[];
    nonResponders: string[];
    undetermined: string[];
    criteria: string;
  };
  patterns: Array<{
    pattern: string;
    prevalence: number;
    patientIds: string[];
  }>;
}

export interface CareTeamPanelDashboard {
  workload: {
    [clinicianId: string]: {
      activePatients: number;
      pendingReviews: number;
      averageAcuity: number;
    };
  };
  highRiskQueue: Array<{
    patientId: string;
    riskScore: number;
    reasons: string[];
    lastReview?: Date;
  }>;
  sdmQueue: Array<{
    patientId: string;
    decision: string;
    proRelevance: string[];
    scheduledDate?: Date;
  }>;
}

export interface EquityLensDashboard {
  disparities: Array<{
    dimension: 'race' | 'ethnicity' | 'language' | 'income' | 'zip';
    groups: Array<{
      name: string;
      n: number;
      accessGap?: number;
      experienceGap?: number;
      outcomeGap?: number;
    }>;
  }>;
  smallCellSuppression: boolean;
  recommendations: string[];
}

export interface InterventionOutcomesDashboard {
  cohorts: {
    before: {
      n: number;
      mean: number;
      sd: number;
    };
    after: {
      n: number;
      mean: number;
      sd: number;
    };
  };
  effectSize: {
    cohensD: number;
    ci95: [number, number];
    interpretation: string;
  };
  subgroupAnalysis: Array<{
    subgroup: string;
    n: number;
    effectSize: number;
    pValue: number;
  }>;
}

export interface PROMISScorecardDashboard {
  tScoreDistribution: {
    histogram: ChartDataPoint[];
    mean: number;
    median: number;
    sd: number;
  };
  normComparison: {
    aboveNorm: number;
    atNorm: number;
    belowNorm: number;
  };
  itemAnalysis: Array<{
    item: string;
    difficulty: number;
    discrimination: number;
    infit: number;
    outfit: number;
  }>;
}

export interface ExperienceOutcomesDashboard {
  correlations: Array<{
    cahpsDomain: string;
    proDomain: string;
    correlation: number;
    pValue: number;
    scatterplot: ChartDataPoint[];
  }>;
  improvementLevers: Array<{
    lever: string;
    impact: number;
    feasibility: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
}
