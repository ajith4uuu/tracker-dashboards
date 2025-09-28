import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { bigqueryService } from '../services/bigquery.service';
import { geminiService } from '../services/gemini.service';
import { logger } from '../utils/logger';

const router = Router();

// Get all patients
router.get('/',
  authMiddleware,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { page = 1, limit = 20, search, sortBy = 'lastActivity', sortOrder = 'desc' } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      
      let query = `
        WITH patient_summary AS (
          SELECT 
            patient_id,
            COUNT(*) as total_events,
            MIN(timestamp) as first_event,
            MAX(timestamp) as last_event,
            COUNT(DISTINCT event_name) as unique_events,
            AVG(CAST(JSON_VALUE(responses, '$.satisfaction_score') AS FLOAT64)) as avg_satisfaction
          FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
          ${search ? 'WHERE patient_id LIKE @search' : ''}
          GROUP BY patient_id
        )
        SELECT 
          patient_id,
          total_events,
          first_event,
          last_event,
          unique_events,
          avg_satisfaction,
          DATE_DIFF(CURRENT_DATE(), DATE(last_event), DAY) as days_inactive
        FROM patient_summary
        ORDER BY ${sortBy === 'patientId' ? 'patient_id' : sortBy === 'totalEvents' ? 'total_events' : 'last_event'} ${sortOrder}
        LIMIT @limit
        OFFSET @offset
      `;

      const [patients] = await bigqueryService.bigquery.query({
        query,
        params: {
          limit: Number(limit),
          offset,
          ...(search && { search: `%${search}%` }),
        },
      });

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT patient_id) as total
        FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
        ${search ? 'WHERE patient_id LIKE @search' : ''}
      `;

      const [countResult] = await bigqueryService.bigquery.query({
        query: countQuery,
        params: search ? { search: `%${search}%` } : {},
      });

      return res.json({
        success: true,
        patients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching patients:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch patients',
      });
    }
});

// Get patient journey details
router.get('/:patientId/journey',
  authMiddleware,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { patientId } = req.params;
      
      const journey = await bigqueryService.getPatientJourney(patientId);
      
      // Generate AI insights for the patient journey
      const insights = await geminiService.analyzePatientJourney(journey);

      return res.json({
        success: true,
        journey: {
          ...journey,
          insights: {
            summary: insights.summary,
            patterns: insights.patterns,
            recommendations: insights.recommendations,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching patient journey:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch patient journey',
      });
    }
});

// Get patient timeline
router.get('/:patientId/timeline',
  authMiddleware,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { patientId } = req.params;
      const { startDate, endDate } = req.query;
      
      let query = `
        SELECT 
          event_name,
          timestamp,
          responses,
          metadata
        FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
        WHERE patient_id = @patientId
      `;

      const params: any = { patientId };

      if (startDate) {
        query += ' AND timestamp >= @startDate';
        params.startDate = new Date(startDate as string).toISOString();
      }

      if (endDate) {
        query += ' AND timestamp <= @endDate';
        params.endDate = new Date(endDate as string).toISOString();
      }

      query += ' ORDER BY timestamp DESC';

      const [timeline] = await bigqueryService.bigquery.query({
        query,
        params,
      });

      return res.json({
        success: true,
        patientId,
        timeline: timeline.map((event: any) => ({
          eventName: event.event_name,
          timestamp: event.timestamp,
          details: JSON.parse(event.responses || '{}'),
          metadata: JSON.parse(event.metadata || '{}'),
        })),
      });
    } catch (error) {
      logger.error('Error fetching patient timeline:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch patient timeline',
      });
    }
});

// Get patient analytics
router.get('/:patientId/analytics',
  authMiddleware,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { patientId } = req.params;
      
      // Get patient metrics
      const query = `
        WITH patient_data AS (
          SELECT 
            patient_id,
            event_name,
            timestamp,
            JSON_VALUE(responses, '$.satisfaction_score') as satisfaction_score,
            JSON_VALUE(responses, '$.pain_level') as pain_level,
            JSON_VALUE(responses, '$.mood_score') as mood_score,
            JSON_VALUE(responses, '$.energy_level') as energy_level
          FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
          WHERE patient_id = @patientId
        )
        SELECT 
          COUNT(*) as total_surveys,
          COUNT(DISTINCT event_name) as unique_events,
          AVG(CAST(satisfaction_score AS FLOAT64)) as avg_satisfaction,
          AVG(CAST(pain_level AS FLOAT64)) as avg_pain,
          AVG(CAST(mood_score AS FLOAT64)) as avg_mood,
          AVG(CAST(energy_level AS FLOAT64)) as avg_energy,
          MIN(timestamp) as first_survey,
          MAX(timestamp) as last_survey,
          DATE_DIFF(DATE(MAX(timestamp)), DATE(MIN(timestamp)), DAY) as days_active
        FROM patient_data
        GROUP BY patient_id
      `;

      const [metrics] = await bigqueryService.bigquery.query({
        query,
        params: { patientId },
      });

      // Get trend data
      const trendQuery = `
        SELECT 
          DATE(timestamp) as date,
          AVG(CAST(JSON_VALUE(responses, '$.satisfaction_score') AS FLOAT64)) as satisfaction,
          AVG(CAST(JSON_VALUE(responses, '$.pain_level') AS FLOAT64)) as pain,
          AVG(CAST(JSON_VALUE(responses, '$.mood_score') AS FLOAT64)) as mood
        FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
        WHERE patient_id = @patientId
        GROUP BY date
        ORDER BY date ASC
        LIMIT 30
      `;

      const [trends] = await bigqueryService.bigquery.query({
        query: trendQuery,
        params: { patientId },
      });

      return res.json({
        success: true,
        patientId,
        analytics: {
          metrics: metrics[0] || {},
          trends,
        },
      });
    } catch (error) {
      logger.error('Error fetching patient analytics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch patient analytics',
      });
    }
});

// Add patient note
router.post('/:patientId/notes',
  authMiddleware,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { patientId } = req.params;
      const { note } = req.body;
      const user = (req as any).user;

      if (!note) {
        return res.status(400).json({
          success: false,
          message: 'Note content is required',
        });
      }

      // Store note as a special event
      const noteData = [{
        patientId,
        eventName: 'clinical_note',
        timestamp: new Date(),
        responses: {
          note,
          author: user.email,
          type: 'manual_note',
        },
        metadata: {
          createdBy: user.email,
          createdAt: new Date(),
        },
      }];

      await bigqueryService.insertSurveyData(noteData);

      return res.json({
        success: true,
        message: 'Note added successfully',
      });
    } catch (error) {
      logger.error('Error adding patient note:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add note',
      });
    }
});

// Get patient notes
router.get('/:patientId/notes',
  authMiddleware,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { patientId } = req.params;
      
      const query = `
        SELECT 
          timestamp,
          JSON_VALUE(responses, '$.note') as note,
          JSON_VALUE(responses, '$.author') as author,
          metadata
        FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
        WHERE patient_id = @patientId
        AND event_name = 'clinical_note'
        ORDER BY timestamp DESC
      `;

      const [notes] = await bigqueryService.bigquery.query({
        query,
        params: { patientId },
      });

      return res.json({
        success: true,
        notes: notes.map((note: any) => ({
          timestamp: note.timestamp,
          content: note.note,
          author: note.author,
          metadata: JSON.parse(note.metadata || '{}'),
        })),
      });
    } catch (error) {
      logger.error('Error fetching patient notes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notes',
      });
    }
});

// Get patient risk assessment
router.get('/:patientId/risk',
  authMiddleware,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { patientId } = req.params;
      
      // Get recent patient data
      const query = `
        SELECT 
          event_name,
          timestamp,
          responses
        FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.survey_data\`
        WHERE patient_id = @patientId
        AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        ORDER BY timestamp DESC
      `;

      const [recentData] = await bigqueryService.bigquery.query({
        query,
        params: { patientId },
      });

      // Calculate risk factors
      const riskFactors = {
        lowEngagement: recentData.length < 5,
        decliningScores: false, // Would need trend analysis
        missedSurveys: false, // Would need expected vs actual comparison
        highPainLevels: false, // Would need pain score analysis
      };

      // Generate AI-based risk assessment
      const riskAssessment = await geminiService.generateInsights({
        data: {
          patientId,
          recentActivity: recentData,
          riskFactors,
        },
        context: 'Patient risk assessment for early intervention',
        type: 'patterns',
      });

      return res.json({
        success: true,
        patientId,
        riskAssessment: {
          level: calculateRiskLevel(riskFactors),
          factors: riskFactors,
          insights: riskAssessment.insights,
          recommendations: riskAssessment.recommendations,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error generating risk assessment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate risk assessment',
      });
    }
});

// Helper function to calculate risk level
function calculateRiskLevel(factors: any): string {
  const riskCount = Object.values(factors).filter(v => v === true).length;
  
  if (riskCount >= 3) return 'high';
  if (riskCount >= 2) return 'medium';
  if (riskCount >= 1) return 'low';
  return 'minimal';
}

export default router;
