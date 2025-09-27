import { BigQuery, Dataset, Table } from '@google-cloud/bigquery';
import { logger } from '../utils/logger';

interface SurveyData {
  patientId: string;
  eventName: string;
  timestamp: Date;
  responses: Record<string, any>;
  metadata?: Record<string, any>;
}

interface AnalyticsResult {
  metric: string;
  value: number;
  dimension?: string;
  timestamp: Date;
}

interface PatientJourney {
  patientId: string;
  events: Array<{
    eventName: string;
    timestamp: Date;
    details: Record<string, any>;
  }>;
  metrics: {
    totalEvents: number;
    completionRate: number;
    engagementScore: number;
  };
}

class BigQueryService {
  private bigquery: BigQuery;
  private dataset: Dataset;
  private initialized: boolean = false;
  private projectId: string;
  private datasetId: string;
  private location: string;

  constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || '';
    this.datasetId = process.env.BIGQUERY_DATASET || 'progress_tracker';
    this.location = process.env.GCP_LOCATION || 'northamerica-northeast2';

    this.bigquery = new BigQuery({
      projectId: this.projectId,
    });

    this.dataset = this.bigquery.dataset(this.datasetId);
  }

  /**
   * Initialize BigQuery dataset and tables
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing BigQuery...');

      // Create dataset if it doesn't exist
      const [datasetExists] = await this.dataset.exists();
      if (!datasetExists) {
        await this.createDataset();
      }

      // Create tables if they don't exist
      await this.createTables();

      this.initialized = true;
      logger.info('BigQuery initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize BigQuery:', error);
      throw error;
    }
  }

  /**
   * Create BigQuery dataset
   */
  private async createDataset(): Promise<void> {
    try {
      await this.bigquery.createDataset(this.datasetId, {
        location: this.location,
      });
      logger.info(`Created dataset: ${this.datasetId}`);
    } catch (error) {
      logger.error('Failed to create dataset:', error);
      throw error;
    }
  }

  /**
   * Create BigQuery tables
   */
  private async createTables(): Promise<void> {
    const tables = [
      {
        name: 'survey_data',
        schema: [
          { name: 'patient_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'event_name', type: 'STRING', mode: 'REQUIRED' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'responses', type: 'JSON', mode: 'NULLABLE' },
          { name: 'metadata', type: 'JSON', mode: 'NULLABLE' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'updated_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
        ],
      },
      {
        name: 'analytics_results',
        schema: [
          { name: 'metric', type: 'STRING', mode: 'REQUIRED' },
          { name: 'value', type: 'FLOAT64', mode: 'REQUIRED' },
          { name: 'dimension', type: 'STRING', mode: 'NULLABLE' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'calculation_date', type: 'DATE', mode: 'REQUIRED' },
          { name: 'metadata', type: 'JSON', mode: 'NULLABLE' },
        ],
      },
      {
        name: 'patient_journeys',
        schema: [
          { name: 'patient_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'journey_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'events', type: 'JSON', mode: 'NULLABLE' },
          { name: 'total_events', type: 'INTEGER', mode: 'REQUIRED' },
          { name: 'completion_rate', type: 'FLOAT64', mode: 'NULLABLE' },
          { name: 'engagement_score', type: 'FLOAT64', mode: 'NULLABLE' },
          { name: 'first_event', type: 'TIMESTAMP', mode: 'NULLABLE' },
          { name: 'last_event', type: 'TIMESTAMP', mode: 'NULLABLE' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'updated_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
        ],
      },
    ];

    for (const tableConfig of tables) {
      const table = this.dataset.table(tableConfig.name);
      const [exists] = await table.exists();

      if (!exists) {
        await this.dataset.createTable(tableConfig.name, {
          schema: tableConfig.schema,
        });
        logger.info(`Created table: ${tableConfig.name}`);
      } else {
        logger.info(`Table already exists: ${tableConfig.name}`);
      }
    }
  }

  /**
   * Insert survey data
   */
  async insertSurveyData(data: SurveyData[]): Promise<void> {
    try {
      const table = this.dataset.table('survey_data');
      
      const rows = data.map(item => ({
        patient_id: item.patientId,
        event_name: item.eventName,
        timestamp: item.timestamp.toISOString(),
        responses: JSON.stringify(item.responses),
        metadata: JSON.stringify(item.metadata || {}),
        created_at: new Date().toISOString(),
        updated_at: null,
      }));

      await table.insert(rows);
      logger.info(`Inserted ${rows.length} survey records`);
    } catch (error) {
      logger.error('Failed to insert survey data:', error);
      throw error;
    }
  }

  /**
   * Query survey data
   */
  async querySurveyData(filters?: {
    patientId?: string;
    eventName?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]> {
    try {
      let query = `
        SELECT *
        FROM \`${this.projectId}.${this.datasetId}.survey_data\`
        WHERE 1=1
      `;

      const params: any = {};

      if (filters?.patientId) {
        query += ' AND patient_id = @patientId';
        params.patientId = filters.patientId;
      }

      if (filters?.eventName) {
        query += ' AND event_name = @eventName';
        params.eventName = filters.eventName;
      }

      if (filters?.startDate) {
        query += ' AND timestamp >= @startDate';
        params.startDate = filters.startDate.toISOString();
      }

      if (filters?.endDate) {
        query += ' AND timestamp <= @endDate';
        params.endDate = filters.endDate.toISOString();
      }

      query += ' ORDER BY timestamp DESC LIMIT 1000';

      const options = {
        query,
        params,
      };

      const [rows] = await this.bigquery.query(options);
      return rows;
    } catch (error) {
      logger.error('Failed to query survey data:', error);
      throw error;
    }
  }

  /**
   * Get analytics metrics
   */
  async getAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<any> {
    try {
      const queries = {
        totalPatients: `
          SELECT COUNT(DISTINCT patient_id) as value
          FROM \`${this.projectId}.${this.datasetId}.survey_data\`
          WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 ${timeRange.toUpperCase()})
        `,
        totalEvents: `
          SELECT COUNT(*) as value
          FROM \`${this.projectId}.${this.datasetId}.survey_data\`
          WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 ${timeRange.toUpperCase()})
        `,
        eventDistribution: `
          SELECT event_name, COUNT(*) as count
          FROM \`${this.projectId}.${this.datasetId}.survey_data\`
          WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 ${timeRange.toUpperCase()})
          GROUP BY event_name
          ORDER BY count DESC
        `,
        patientActivity: `
          SELECT 
            DATE(timestamp) as date,
            COUNT(DISTINCT patient_id) as unique_patients,
            COUNT(*) as total_events
          FROM \`${this.projectId}.${this.datasetId}.survey_data\`
          WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 ${timeRange.toUpperCase()})
          GROUP BY date
          ORDER BY date DESC
        `,
        completionRates: `
          SELECT 
            event_name,
            COUNT(DISTINCT patient_id) as started,
            COUNT(DISTINCT CASE WHEN JSON_VALUE(responses, '$.completed') = 'true' THEN patient_id END) as completed,
            SAFE_DIVIDE(
              COUNT(DISTINCT CASE WHEN JSON_VALUE(responses, '$.completed') = 'true' THEN patient_id END),
              COUNT(DISTINCT patient_id)
            ) * 100 as completion_rate
          FROM \`${this.projectId}.${this.datasetId}.survey_data\`
          WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 ${timeRange.toUpperCase()})
          GROUP BY event_name
        `,
      };

      const results: any = {};

      for (const [key, query] of Object.entries(queries)) {
        const [rows] = await this.bigquery.query(query);
        results[key] = rows;
      }

      return results;
    } catch (error) {
      logger.error('Failed to get analytics:', error);
      throw error;
    }
  }

  /**
   * Get patient journey
   */
  async getPatientJourney(patientId: string): Promise<PatientJourney> {
    try {
      const query = `
        SELECT 
          patient_id,
          event_name,
          timestamp,
          responses,
          metadata
        FROM \`${this.projectId}.${this.datasetId}.survey_data\`
        WHERE patient_id = @patientId
        ORDER BY timestamp ASC
      `;

      const [rows] = await this.bigquery.query({
        query,
        params: { patientId },
      });

      const events = rows.map(row => ({
        eventName: row.event_name,
        timestamp: new Date(row.timestamp.value),
        details: JSON.parse(row.responses || '{}'),
      }));

      const metrics = {
        totalEvents: events.length,
        completionRate: this.calculateCompletionRate(events),
        engagementScore: this.calculateEngagementScore(events),
      };

      return {
        patientId,
        events,
        metrics,
      };
    } catch (error) {
      logger.error('Failed to get patient journey:', error);
      throw error;
    }
  }

  /**
   * Store analytics results
   */
  async storeAnalyticsResults(results: AnalyticsResult[]): Promise<void> {
    try {
      const table = this.dataset.table('analytics_results');
      
      const rows = results.map(result => ({
        metric: result.metric,
        value: result.value,
        dimension: result.dimension || null,
        timestamp: result.timestamp.toISOString(),
        calculation_date: result.timestamp.toISOString().split('T')[0],
        metadata: JSON.stringify({}),
      }));

      await table.insert(rows);
      logger.info(`Stored ${rows.length} analytics results`);
    } catch (error) {
      logger.error('Failed to store analytics results:', error);
      throw error;
    }
  }

  /**
   * Calculate completion rate
   */
  private calculateCompletionRate(events: any[]): number {
    if (events.length === 0) return 0;
    
    const completedEvents = events.filter(e => 
      e.details?.completed === true || 
      e.details?.status === 'completed'
    );
    
    return (completedEvents.length / events.length) * 100;
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(events: any[]): number {
    if (events.length === 0) return 0;

    let score = 0;
    
    // Base score from number of events
    score += Math.min(events.length * 10, 50);
    
    // Bonus for completion
    const completionRate = this.calculateCompletionRate(events);
    score += completionRate * 0.3;
    
    // Bonus for consistency (events spread over time)
    if (events.length > 1) {
      const firstEvent = new Date(events[0].timestamp).getTime();
      const lastEvent = new Date(events[events.length - 1].timestamp).getTime();
      const daySpan = (lastEvent - firstEvent) / (1000 * 60 * 60 * 24);
      
      if (daySpan > 7) score += 10;
      if (daySpan > 30) score += 10;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Export data to CSV
   */
  async exportToCSV(tableName: string, filters?: any): Promise<string> {
    try {
      let query = `SELECT * FROM \`${this.projectId}.${this.datasetId}.${tableName}\``;
      
      if (filters) {
        // Add filter logic here based on requirements
      }
      
      query += ' LIMIT 10000';

      const [rows] = await this.bigquery.query(query);
      
      if (rows.length === 0) {
        return '';
      }

      // Convert to CSV format
      const headers = Object.keys(rows[0]).join(',');
      const csvRows = rows.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      );

      return [headers, ...csvRows].join('\n');
    } catch (error) {
      logger.error('Failed to export to CSV:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const bigqueryService = new BigQueryService();

// Export BigQuery instance for direct access
export const bigquery = bigqueryService.bigquery;

// Export initialization function
export const initializeBigQuery = async (): Promise<void> => {
  await bigqueryService.initialize();
};
