import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { bigqueryService } from '../services/bigquery.service';
import { geminiService } from '../services/gemini.service';
import { logger } from '../utils/logger';

const router = Router();

// Get dashboard analytics
router.get('/dashboard',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const timeRange = (req.query.timeRange as string) || 'week';
      
      // Validate time range
      if (!['day', 'week', 'month', 'year'].includes(timeRange)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time range. Must be: day, week, month, or year',
        });
      }

      const analytics = await bigqueryService.getAnalytics(timeRange as any);
      
      // Generate AI insights
      const insights = await geminiService.generateInsights({
        data: analytics,
        context: `Dashboard analytics for ${timeRange}`,
        type: 'summary',
      });

      return res.json({
        success: true,
        timeRange,
        data: {
          totalPatients: analytics.totalPatients[0]?.value || 0,
          totalEvents: analytics.totalEvents[0]?.value || 0,
          eventDistribution: analytics.eventDistribution,
          patientActivity: analytics.patientActivity,
          completionRates: analytics.completionRates,
        },
        insights: {
          summary: insights.summary,
          keyPoints: insights.insights,
          recommendations: insights.recommendations,
        },
      });
    } catch (error) {
      logger.error('Error fetching dashboard analytics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics data',
      });
    }
});

// Get trends analysis
router.get('/trends',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      let start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let end = endDate ? new Date(endDate as string) : new Date();

      const query = `
        SELECT 
          DATE(timestamp) as date,
          COUNT(DISTINCT patient_id) as unique_patients,
          COUNT(*) as total_events,
          AVG(CAST(JSON_VALUE(responses, '$.satisfaction_score') AS FLOAT64)) as avg_satisfaction,
          AVG(CAST(JSON_VALUE(responses, '$.pain_level') AS FLOAT64)) as avg_pain_level
        FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
        WHERE timestamp BETWEEN @startDate AND @endDate
        GROUP BY date
        ORDER BY date ASC
      `;

      const [rows] = await bigqueryService.bigquery.query({
        query,
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });

      // Generate trend insights with Gemini
      const insights = await geminiService.identifyTrends(rows);

      return res.json({
        success: true,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        trends: rows,
        insights: {
          patterns: insights.patterns,
          predictions: insights.recommendations,
          summary: insights.summary,
        },
      });
    } catch (error) {
      logger.error('Error fetching trends:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch trends data',
      });
    }
});

// Get comparative analysis
router.get('/compare',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { period1Start, period1End, period2Start, period2End } = req.query;
      
      if (!period1Start || !period1End || !period2Start || !period2End) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all period dates',
        });
      }

      // Query for period 1
      const query1 = `
        SELECT 
          'Period 1' as period,
          COUNT(DISTINCT patient_id) as unique_patients,
          COUNT(*) as total_events,
          AVG(CAST(JSON_VALUE(responses, '$.completion_time') AS FLOAT64)) as avg_completion_time,
          AVG(CAST(JSON_VALUE(responses, '$.satisfaction_score') AS FLOAT64)) as avg_satisfaction
        FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
        WHERE timestamp BETWEEN @startDate AND @endDate
      `;

      const [period1Data] = await bigqueryService.bigquery.query({
        query: query1,
        params: {
          startDate: new Date(period1Start as string).toISOString(),
          endDate: new Date(period1End as string).toISOString(),
        },
      });

      // Query for period 2
      const [period2Data] = await bigqueryService.bigquery.query({
        query: query1.replace('Period 1', 'Period 2'),
        params: {
          startDate: new Date(period2Start as string).toISOString(),
          endDate: new Date(period2End as string).toISOString(),
        },
      });

      // Generate comparative insights
      const insights = await geminiService.generateComparativeAnalysis(
        period1Data[0],
        period2Data[0],
        'Time period comparison'
      );

      return res.json({
        success: true,
        comparison: {
          period1: {
            dates: { start: period1Start, end: period1End },
            metrics: period1Data[0],
          },
          period2: {
            dates: { start: period2Start, end: period2End },
            metrics: period2Data[0],
          },
          changes: calculateChanges(period1Data[0], period2Data[0]),
        },
        insights: {
          analysis: insights.insights,
          recommendations: insights.recommendations,
          summary: insights.summary,
        },
      });
    } catch (error) {
      logger.error('Error in comparative analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate comparative analysis',
      });
    }
});

// Get event funnel analysis
router.get('/funnel',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { events, startDate, endDate } = req.query;
      
      if (!events) {
        return res.status(400).json({
          success: false,
          message: 'Please provide events for funnel analysis',
        });
      }

      const eventList = (events as string).split(',');
      const funnelData = [];

      for (let i = 0; i < eventList.length; i++) {
        const query = `
          SELECT 
            @eventName as event,
            COUNT(DISTINCT patient_id) as patients,
            @step as step
          FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
          WHERE event_name = @eventName
          ${startDate ? 'AND timestamp >= @startDate' : ''}
          ${endDate ? 'AND timestamp <= @endDate' : ''}
        `;

        const [rows] = await bigqueryService.bigquery.query({
          query,
          params: {
            eventName: eventList[i],
            step: i + 1,
            ...(startDate && { startDate: new Date(startDate as string).toISOString() }),
            ...(endDate && { endDate: new Date(endDate as string).toISOString() }),
          },
        });

        funnelData.push(rows[0]);
      }

      // Calculate conversion rates
      const conversions = [];
      for (let i = 1; i < funnelData.length; i++) {
        const rate = (funnelData[i].patients / funnelData[i - 1].patients) * 100;
        conversions.push({
          from: funnelData[i - 1].event,
          to: funnelData[i].event,
          rate: rate.toFixed(2),
        });
      }

      return res.json({
        success: true,
        funnel: funnelData,
        conversions,
        overallConversion: ((funnelData[funnelData.length - 1].patients / funnelData[0].patients) * 100).toFixed(2),
      });
    } catch (error) {
      logger.error('Error in funnel analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate funnel analysis',
      });
    }
});

// Get cohort analysis
router.get('/cohorts',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { cohortBy, metric } = req.query;
      const cohortField = cohortBy || 'month';
      const analysisMetric = metric || 'retention';

      const query = `
        WITH cohorts AS (
          SELECT 
            patient_id,
            DATE_TRUNC(MIN(timestamp), ${cohortField === 'week' ? 'WEEK' : 'MONTH'}) as cohort,
            MIN(timestamp) as first_event
          FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
          GROUP BY patient_id
        ),
        activities AS (
          SELECT 
            c.patient_id,
            c.cohort,
            DATE_DIFF(DATE(s.timestamp), DATE(c.first_event), DAY) as days_since_first,
            s.event_name
          FROM cohorts c
          JOIN \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\` s
          ON c.patient_id = s.patient_id
        )
        SELECT 
          cohort,
          COUNTIF(days_since_first = 0) as day_0,
          COUNTIF(days_since_first BETWEEN 1 AND 7) as week_1,
          COUNTIF(days_since_first BETWEEN 8 AND 14) as week_2,
          COUNTIF(days_since_first BETWEEN 15 AND 30) as month_1,
          COUNTIF(days_since_first > 30) as after_month
        FROM activities
        GROUP BY cohort
        ORDER BY cohort DESC
        LIMIT 12
      `;

      const [rows] = await bigqueryService.bigquery.query(query);

      return res.json({
        success: true,
        cohortBy: cohortField,
        metric: analysisMetric,
        cohorts: rows,
      });
    } catch (error) {
      logger.error('Error in cohort analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate cohort analysis',
      });
    }
});

// Export analytics data
router.get('/export',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { format, table, startDate, endDate } = req.query;
      
      if (!table) {
        return res.status(400).json({
          success: false,
          message: 'Please specify table to export',
        });
      }

      const filters = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
      };

      const csvData = await bigqueryService.exportToCSV(table as string, filters);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${table}-export-${Date.now()}.csv"`);
        return res.send(csvData);
      } else {
        return res.json({
          success: true,
          data: csvData,
        });
      }
    } catch (error) {
      logger.error('Error exporting data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to export data',
      });
    }
});

// Helper function to calculate changes
function calculateChanges(period1: any, period2: any): any {
  const changes: any = {};
  
  for (const key in period1) {
    if (typeof period1[key] === 'number' && typeof period2[key] === 'number') {
      const change = period2[key] - period1[key];
      const percentChange = period1[key] !== 0 ? (change / period1[key]) * 100 : 0;
      
      changes[key] = {
        absolute: change,
        percent: percentChange.toFixed(2),
        direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no change',
      };
    }
  }
  
  return changes;
}

export default router;
