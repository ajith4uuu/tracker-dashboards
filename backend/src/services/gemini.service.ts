import { GoogleGenerativeAI as GenAIClient } from '@google/generative-ai';
import { logger } from '../utils/logger';

interface InsightRequest {
  data: any;
  context?: string;
  type?: 'summary' | 'trends' | 'recommendations' | 'patterns';
}

interface InsightResponse {
  insights: string[];
  recommendations: string[];
  patterns: string[];
  summary: string;
  confidence: number;
  timestamp: Date;
}

class GeminiService {
  private genAI: GenAIClient | null = null;
  private model: any | null = null;
  private apiKey: string;
  private modelName: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.modelName = process.env.GEMINI_MODEL || 'gemini-pro';
    
    if (!this.apiKey) {
      logger.warn('Gemini API key not configured. AI insights will be unavailable.');
      return;
    }

    this.genAI = new GenAIClient(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  /**
   * Generate comprehensive insights from data
   */
  async generateInsights(request: InsightRequest): Promise<InsightResponse> {
    if (!this.model) {
      logger.warn('Gemini model not initialized');
      return this.getDefaultInsights();
    }

    try {
      const prompt = this.buildPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseInsightsResponse(text);
    } catch (error) {
      logger.error('Failed to generate insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Build prompt for Gemini
   */
  private buildPrompt(request: InsightRequest): string {
    const { data, context, type } = request;

    let prompt = `You are an AI analyst for a breast cancer patient survey and treatment tracking system. 
    Analyze the following data and provide insights.\n\n`;

    if (context) {
      prompt += `Context: ${context}\n\n`;
    }

    prompt += `Data:\n${JSON.stringify(data, null, 2)}\n\n`;

    switch (type) {
      case 'summary':
        prompt += `Provide a comprehensive summary of this data, highlighting:
        1. Key statistics and metrics
        2. Overall patient engagement levels
        3. Treatment progression patterns
        4. Notable findings or anomalies
        
        Format your response as a structured analysis.`;
        break;

      case 'trends':
        prompt += `Identify and analyze trends in this data:
        1. Temporal patterns (daily, weekly, monthly trends)
        2. Patient behavior patterns
        3. Response rate trends
        4. Completion rate patterns
        5. Any emerging or declining trends
        
        Focus on actionable insights that could improve patient outcomes.`;
        break;

      case 'recommendations':
        prompt += `Based on this data, provide specific recommendations for:
        1. Improving patient engagement
        2. Optimizing survey completion rates
        3. Enhancing data collection processes
        4. Supporting patient care
        5. Areas requiring immediate attention
        
        Make recommendations practical and actionable.`;
        break;

      case 'patterns':
        prompt += `Identify significant patterns in the patient data:
        1. Common patient journeys
        2. Correlation between different metrics
        3. Predictive indicators for outcomes
        4. Risk factors or warning signs
        5. Success patterns to replicate
        
        Focus on patterns that have clinical or operational significance.`;
        break;

      default:
        prompt += `Analyze this data and provide:
        1. Key Insights: 3-5 important observations
        2. Recommendations: 3-5 actionable suggestions
        3. Patterns: Any significant patterns or correlations
        4. Summary: A brief overview of the data
        
        Be specific and focus on actionable intelligence.`;
    }

    prompt += `\n\nIMPORTANT: Structure your response with clear sections:
    INSIGHTS:
    RECOMMENDATIONS:
    PATTERNS:
    SUMMARY:
    
    Keep each point concise and actionable. Focus on breast cancer patient care and outcomes.`;

    return prompt;
  }

  /**
   * Parse Gemini response into structured format
   */
  private parseInsightsResponse(text: string): InsightResponse {
    try {
      const sections = {
        insights: [] as string[],
        recommendations: [] as string[],
        patterns: [] as string[],
        summary: '',
      };

      // Parse sections from response
      const insightsMatch = text.match(/INSIGHTS:(.*?)(?=RECOMMENDATIONS:|PATTERNS:|SUMMARY:|$)/si);
      const recommendationsMatch = text.match(/RECOMMENDATIONS:(.*?)(?=INSIGHTS:|PATTERNS:|SUMMARY:|$)/si);
      const patternsMatch = text.match(/PATTERNS:(.*?)(?=INSIGHTS:|RECOMMENDATIONS:|SUMMARY:|$)/si);
      const summaryMatch = text.match(/SUMMARY:(.*?)(?=INSIGHTS:|RECOMMENDATIONS:|PATTERNS:|$)/si);

      if (insightsMatch) {
        sections.insights = this.extractBulletPoints(insightsMatch[1]);
      }

      if (recommendationsMatch) {
        sections.recommendations = this.extractBulletPoints(recommendationsMatch[1]);
      }

      if (patternsMatch) {
        sections.patterns = this.extractBulletPoints(patternsMatch[1]);
      }

      if (summaryMatch) {
        sections.summary = summaryMatch[1].trim();
      }

      // Fallback if parsing fails
      if (sections.insights.length === 0 && sections.recommendations.length === 0) {
        sections.insights = [text.substring(0, 200) + '...'];
        sections.summary = text.substring(0, 500);
      }

      return {
        ...sections,
        confidence: this.calculateConfidence(sections),
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to parse insights response:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Extract bullet points from text
   */
  private extractBulletPoints(text: string): string[] {
    const lines = text.split('\n');
    const points: string[] = [];

    for (const line of lines) {
      const cleaned = line.trim();
      if (cleaned.length > 10) {
        // Remove bullet point markers
        const point = cleaned.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
        if (point.length > 0) {
          points.push(point);
        }
      }
    }

    return points.slice(0, 5); // Limit to 5 points
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(sections: any): number {
    let score = 0;
    
    if (sections.insights.length > 0) score += 25;
    if (sections.recommendations.length > 0) score += 25;
    if (sections.patterns.length > 0) score += 25;
    if (sections.summary.length > 50) score += 25;

    return score;
  }

  /**
   * Get default insights when AI is unavailable
   */
  private getDefaultInsights(): InsightResponse {
    return {
      insights: [
        'Data has been successfully recorded',
        'Analysis pending further data collection',
      ],
      recommendations: [
        'Continue monitoring patient responses',
        'Ensure regular data collection',
      ],
      patterns: [
        'Insufficient data for pattern analysis',
      ],
      summary: 'Data collection is in progress. More comprehensive insights will be available as additional data is collected.',
      confidence: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Analyze patient journey
   */
  async analyzePatientJourney(patientData: any): Promise<InsightResponse> {
    const request: InsightRequest = {
      data: patientData,
      context: 'Individual patient journey analysis for breast cancer treatment tracking',
      type: 'patterns',
    };

    return this.generateInsights(request);
  }

  /**
   * Generate survey recommendations
   */
  async generateSurveyRecommendations(surveyData: any): Promise<InsightResponse> {
    const request: InsightRequest = {
      data: surveyData,
      context: 'Survey response data and completion rates',
      type: 'recommendations',
    };

    return this.generateInsights(request);
  }

  /**
   * Identify trends
   */
  async identifyTrends(historicalData: any): Promise<InsightResponse> {
    const request: InsightRequest = {
      data: historicalData,
      context: 'Historical patient data and treatment outcomes',
      type: 'trends',
    };

    return this.generateInsights(request);
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(aggregatedData: any): Promise<InsightResponse> {
    const request: InsightRequest = {
      data: aggregatedData,
      context: 'Aggregated metrics for executive reporting',
      type: 'summary',
    };

    return this.generateInsights(request);
  }

  /**
   * Batch process insights
   */
  async batchProcessInsights(dataPoints: any[]): Promise<InsightResponse[]> {
    const results: InsightResponse[] = [];

    for (const data of dataPoints) {
      const insights = await this.generateInsights({ data });
      results.push(insights);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Generate comparative analysis
   */
  async generateComparativeAnalysis(data1: any, data2: any, comparisonType: string): Promise<InsightResponse> {
    const request: InsightRequest = {
      data: {
        dataset1: data1,
        dataset2: data2,
        comparisonType,
      },
      context: `Comparative analysis: ${comparisonType}`,
      type: 'patterns',
    };

    return this.generateInsights(request);
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!this.model;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; model: string; configured: boolean } {
    return {
      available: this.isAvailable(),
      model: this.modelName,
      configured: !!this.apiKey,
    };
  }
}

// Create singleton instance
export const geminiService = new GeminiService();
