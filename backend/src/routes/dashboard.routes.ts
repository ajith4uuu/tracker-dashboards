import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { dashboardService } from '../services/dashboard.service';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all dashboard routes
router.use(authMiddleware);

// Survey-focused dashboards

// 1. Executive Overview Dashboard
router.get('/executive-overview', async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query;
    const data = await dashboardService.getExecutiveOverview(timeRange as string);
    res.json(data);
  } catch (error) {
    logger.error('Error fetching executive overview:', error);
    res.status(500).json({ error: 'Failed to fetch executive overview' });
  }
});

// 2. Response Quality & Bias Dashboard
router.get('/response-quality', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, surveyId } = req.query;
    const data = await dashboardService.getResponseQuality({
      startDate: startDate as string,
      endDate: endDate as string,
      surveyId: surveyId as string,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching response quality:', error);
    res.status(500).json({ error: 'Failed to fetch response quality data' });
  }
});

// 3. Engagement Funnel Dashboard
router.get('/engagement-funnel', async (req: Request, res: Response) => {
  try {
    const { cohort, surveyId, timeRange } = req.query;
    const data = await dashboardService.getEngagementFunnel({
      cohort: cohort as string,
      surveyId: surveyId as string,
      timeRange: timeRange as string,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching engagement funnel:', error);
    res.status(500).json({ error: 'Failed to fetch engagement funnel' });
  }
});

// 4. CAHPS Dashboard
router.get('/cahps', async (req: Request, res: Response) => {
  try {
    const { timeRange, facility, provider } = req.query;
    const data = await dashboardService.getCAHPSMetrics({
      timeRange: timeRange as string,
      facility: facility as string,
      provider: provider as string,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching CAHPS metrics:', error);
    res.status(500).json({ error: 'Failed to fetch CAHPS metrics' });
  }
});

// 5. PROMIS Domain Scores Dashboard
router.get('/promis', async (req: Request, res: Response) => {
  try {
    const { patientId, domain, timeRange } = req.query;
    const data = await dashboardService.getPROMISScores({
      patientId: patientId as string,
      domain: domain as string,
      timeRange: timeRange as string,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching PROMIS scores:', error);
    res.status(500).json({ error: 'Failed to fetch PROMIS scores' });
  }
});

// 6. Cohort Comparisons Dashboard
router.get('/cohort-comparison', async (req: Request, res: Response) => {
  try {
    const { dimension, metric, adjustForRisk } = req.query;
    const data = await dashboardService.getCohortComparisons({
      dimension: dimension as any,
      metric: metric as string,
      adjustForRisk: adjustForRisk === 'true',
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching cohort comparisons:', error);
    res.status(500).json({ error: 'Failed to fetch cohort comparisons' });
  }
});

// 7. Longitudinal Change Dashboard
router.get('/longitudinal-change', async (req: Request, res: Response) => {
  try {
    const { cohortId, interventionDate, metric } = req.query;
    const data = await dashboardService.getLongitudinalChange({
      cohortId: cohortId as string,
      interventionDate: interventionDate as string,
      metric: metric as string,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching longitudinal change:', error);
    res.status(500).json({ error: 'Failed to fetch longitudinal change' });
  }
});

// 8. Text Insights Dashboard
router.get('/text-insights', async (req: Request, res: Response) => {
  try {
    const { timeRange, minFrequency, sentimentFilter } = req.query;
    const data = await dashboardService.getTextInsights({
      timeRange: timeRange as string,
      minFrequency: parseInt(minFrequency as string) || 5,
      sentimentFilter: sentimentFilter as string,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching text insights:', error);
    res.status(500).json({ error: 'Failed to fetch text insights' });
  }
});

// 9. Operations & SLA Dashboard
router.get('/operations-sla', async (req: Request, res: Response) => {
  try {
    const { timeRange, campaign } = req.query;
    const data = await dashboardService.getOperationsSLA({
      timeRange: timeRange as string,
      campaign: campaign as string,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching operations SLA:', error);
    res.status(500).json({ error: 'Failed to fetch operations SLA' });
  }
});

// 10. Data Health Dashboard
router.get('/data-health', async (req: Request, res: Response) => {
  try {
    const data = await dashboardService.getDataHealth();
    res.json(data);
  } catch (error) {
    logger.error('Error fetching data health:', error);
    res.status(500).json({ error: 'Failed to fetch data health' });
  }
});

// Patient-focused dashboards

// 11. Patient 360 Dashboard
router.get('/patient-360/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const data = await dashboardService.getPatient360(patientId);
    res.json(data);
  } catch (error) {
    logger.error('Error fetching patient 360:', error);
    res.status(500).json({ error: 'Failed to fetch patient 360' });
  }
});

// 12. Patient Journey Map
router.get('/patient-journey/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const data = await dashboardService.getPatientJourneyMap(patientId);
    res.json(data);
  } catch (error) {
    logger.error('Error fetching patient journey:', error);
    res.status(500).json({ error: 'Failed to fetch patient journey' });
  }
});

// 13. Risk & Alerting Dashboard
router.get('/risk-alerting', async (req: Request, res: Response) => {
  try {
    const { severity, domain, unacknowledgedOnly } = req.query;
    const data = await dashboardService.getRiskAlerting({
      severity: severity as any,
      domain: domain as string,
      unacknowledgedOnly: unacknowledgedOnly === 'true',
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching risk alerts:', error);
    res.status(500).json({ error: 'Failed to fetch risk alerts' });
  }
});

// 14. Adherence & Activity Dashboard
router.get('/adherence-activity', async (req: Request, res: Response) => {
  try {
    const { patientId, clinicianId, timeRange } = req.query;
    const data = await dashboardService.getAdherenceActivity({
      patientId: patientId as string,
      clinicianId: clinicianId as string,
      timeRange: timeRange as string,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching adherence activity:', error);
    res.status(500).json({ error: 'Failed to fetch adherence activity' });
  }
});

// 15. Symptom Trajectories Dashboard
router.get('/symptom-trajectories', async (req: Request, res: Response) => {
  try {
    const { cohort, domain, visualizationType } = req.query;
    const data = await dashboardService.getSymptomTrajectories({
      cohort: cohort as string,
      domain: domain as string,
      visualizationType: visualizationType as any,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching symptom trajectories:', error);
    res.status(500).json({ error: 'Failed to fetch symptom trajectories' });
  }
});

// 16. Care Team Panel Dashboard
router.get('/care-team-panel', async (req: Request, res: Response) => {
  try {
    const { clinicianId } = req.query;
    const data = await dashboardService.getCareTeamPanel(clinicianId as string);
    res.json(data);
  } catch (error) {
    logger.error('Error fetching care team panel:', error);
    res.status(500).json({ error: 'Failed to fetch care team panel' });
  }
});

// 17. Equity Lens Dashboard
router.get('/equity-lens', async (req: Request, res: Response) => {
  try {
    const { dimension, metric, suppressSmallCells } = req.query;
    const data = await dashboardService.getEquityLens({
      dimension: dimension as any,
      metric: metric as string,
      suppressSmallCells: suppressSmallCells === 'true',
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching equity lens:', error);
    res.status(500).json({ error: 'Failed to fetch equity lens' });
  }
});

// 18. Intervention Outcomes Dashboard
router.get('/intervention-outcomes', async (req: Request, res: Response) => {
  try {
    const { interventionId, beforePeriod, afterPeriod, subgroupAnalysis } = req.query;
    const data = await dashboardService.getInterventionOutcomes({
      interventionId: interventionId as string,
      beforePeriod: beforePeriod as string,
      afterPeriod: afterPeriod as string,
      subgroupAnalysis: subgroupAnalysis === 'true',
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching intervention outcomes:', error);
    res.status(500).json({ error: 'Failed to fetch intervention outcomes' });
  }
});

// 19. PROMIS Scorecard Dashboard
router.get('/promis-scorecard', async (req: Request, res: Response) => {
  try {
    const { domain, timeRange, normReference } = req.query;
    const data = await dashboardService.getPROMISScorecard({
      domain: domain as string,
      timeRange: timeRange as string,
      normReference: normReference as string,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching PROMIS scorecard:', error);
    res.status(500).json({ error: 'Failed to fetch PROMIS scorecard' });
  }
});

// 20. Experience + Outcomes Dashboard
router.get('/experience-outcomes', async (req: Request, res: Response) => {
  try {
    const { timeRange, minSampleSize } = req.query;
    const data = await dashboardService.getExperienceOutcomes({
      timeRange: timeRange as string,
      minSampleSize: parseInt(minSampleSize as string) || 30,
    });
    res.json(data);
  } catch (error) {
    logger.error('Error fetching experience outcomes:', error);
    res.status(500).json({ error: 'Failed to fetch experience outcomes' });
  }
});

// Utility endpoints
router.get('/export/:dashboardType', async (req: Request, res: Response) => {
  try {
    const { dashboardType } = req.params;
    const { format, ...params } = req.query;
    
    const data = await dashboardService.exportDashboard(
      dashboardType,
      format as any,
      params
    );

    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 
                                  format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                                  'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dashboardType}-${Date.now()}.${format}"`);
    res.send(data);
  } catch (error) {
    logger.error('Error exporting dashboard:', error);
    res.status(500).json({ error: 'Failed to export dashboard' });
  }
});

router.post('/refresh/:dashboardType', async (req: Request, res: Response) => {
  try {
    const { dashboardType } = req.params;
    const result = await dashboardService.refreshDashboardData(dashboardType);
    res.json(result);
  } catch (error) {
    logger.error('Error refreshing dashboard:', error);
    res.status(500).json({ error: 'Failed to refresh dashboard data' });
  }
});

router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { dashboardType, email, webhook, thresholds, frequency } = req.body;
    const result = await dashboardService.subscribeToAlerts({
      dashboardType,
      email,
      webhook,
      thresholds,
      frequency,
    });
    res.json(result);
  } catch (error) {
    logger.error('Error subscribing to alerts:', error);
    res.status(500).json({ error: 'Failed to subscribe to alerts' });
  }
});

router.get('/benchmarks', async (req: Request, res: Response) => {
  try {
    const benchmarks = await dashboardService.getAvailableBenchmarks();
    res.json(benchmarks);
  } catch (error) {
    logger.error('Error fetching benchmarks:', error);
    res.status(500).json({ error: 'Failed to fetch benchmarks' });
  }
});

export default router;
