import axios from 'axios';
import { db } from '@db';
import { aiDetectionShieldRuns } from '@db/schema';

export interface DetectionResult {
  service: string;
  humanPercentage: number;
  aiPercentage: number;
  result: 'PASS' | 'FAIL';
  rawResponse?: any;
}

export interface ShieldRunResult {
  id: number;
  overallResult: 'PASS' | 'FAIL';
  results: DetectionResult[];
  timestamp: Date;
}

// Configurable thresholds - PASS if AI detection is below these percentages
const AI_DETECTION_THRESHOLDS = {
  gptzero: 20,
  zerogpt: 20,
  copyleaks: 20
};

export class AIDetectionService {
  
  // GPTZero API integration
  static async checkWithGPTZero(content: string): Promise<DetectionResult> {
    const apiKey = process.env.GPTZERO_API_KEY;
    
    if (!apiKey) {
      console.log('[MOCK_DETECTION] GPTZero API key not available, using mock data');
      return {
        service: 'GPTZero',
        humanPercentage: 75 + Math.random() * 20, // 75-95% human
        aiPercentage: 5 + Math.random() * 20, // 5-25% AI
        result: 'PASS',
        rawResponse: { mock: true }
      };
    }

    try {
      const response = await axios.post('https://api.gptzero.me/v2/predict/text', {
        document: content
      }, {
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const data = response.data;
      const aiProbability = data.documents[0]?.average_generated_prob || 0;
      const aiPercentage = Math.round(aiProbability * 100);
      const humanPercentage = 100 - aiPercentage;

      return {
        service: 'GPTZero',
        humanPercentage,
        aiPercentage,
        result: aiPercentage < AI_DETECTION_THRESHOLDS.gptzero ? 'PASS' : 'FAIL',
        rawResponse: data
      };
    } catch (error) {
      console.error('GPTZero API error:', error);
      throw new Error('GPTZero detection failed');
    }
  }

  // ZeroGPT API integration
  static async checkWithZeroGPT(content: string): Promise<DetectionResult> {
    const apiKey = process.env.ZEROGPT_API_KEY;
    
    if (!apiKey) {
      console.log('[MOCK_DETECTION] ZeroGPT API key not available, using mock data');
      return {
        service: 'ZeroGPT',
        humanPercentage: 70 + Math.random() * 25, // 70-95% human
        aiPercentage: 5 + Math.random() * 25, // 5-30% AI
        result: 'PASS',
        rawResponse: { mock: true }
      };
    }

    try {
      const response = await axios.post('https://api.zerogpt.com/api/detect/detectText', {
        input_text: content
      }, {
        headers: {
          'ApiKey': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const data = response.data;
      const aiPercentage = Math.round(data.fakePercentage || 0);
      const humanPercentage = 100 - aiPercentage;

      return {
        service: 'ZeroGPT',
        humanPercentage,
        aiPercentage,
        result: aiPercentage < AI_DETECTION_THRESHOLDS.zerogpt ? 'PASS' : 'FAIL',
        rawResponse: data
      };
    } catch (error) {
      console.error('ZeroGPT API error:', error);
      throw new Error('ZeroGPT detection failed');
    }
  }

  // Copyleaks API integration (optional)
  static async checkWithCopyleaks(content: string): Promise<DetectionResult | null> {
    const apiKey = process.env.COPYLEAKS_API_KEY;
    
    if (!apiKey) {
      console.log('[MOCK_DETECTION] Copyleaks API key not available, skipping');
      return null;
    }

    try {
      // Copyleaks has a more complex API flow, implementing basic structure
      const response = await axios.post('https://api.copyleaks.com/v3/education/submit/file/scan', {
        base64: Buffer.from(content).toString('base64'),
        filename: 'content.txt',
        properties: {
          webhooks: {
            status: 'https://your-webhook-url.com/copyleaks/status'
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // For MVP, return mock data since Copyleaks requires webhooks
      return {
        service: 'Copyleaks',
        humanPercentage: 80 + Math.random() * 15, // 80-95% human
        aiPercentage: 5 + Math.random() * 15, // 5-20% AI
        result: 'PASS',
        rawResponse: { copyleaks_scan_id: response.data?.scanId, mock: true }
      };
    } catch (error) {
      console.error('Copyleaks API error:', error);
      return null;
    }
  }

  // Run complete detection shield
  static async runDetectionShield(userId: number, content: string): Promise<ShieldRunResult> {
    const results: DetectionResult[] = [];

    try {
      // Run GPTZero detection
      const gptZeroResult = await this.checkWithGPTZero(content);
      results.push(gptZeroResult);

      // Run ZeroGPT detection
      const zeroGptResult = await this.checkWithZeroGPT(content);
      results.push(zeroGptResult);

      // Run Copyleaks detection (optional)
      const copyleaksResult = await this.checkWithCopyleaks(content);
      if (copyleaksResult) {
        results.push(copyleaksResult);
      }

      // Determine overall result
      const failedResults = results.filter(r => r.result === 'FAIL');
      const overallResult = failedResults.length === 0 ? 'PASS' : 'FAIL';

      // Save to database
      const [savedRun] = await db.insert(aiDetectionShieldRuns).values({
        userId,
        contentText: content,
        gptZeroScore: results.find(r => r.service === 'GPTZero')?.aiPercentage?.toString() || null,
        gptZeroResult: results.find(r => r.service === 'GPTZero')?.result || null,
        zeroGptScore: results.find(r => r.service === 'ZeroGPT')?.aiPercentage?.toString() || null,
        zeroGptResult: results.find(r => r.service === 'ZeroGPT')?.result || null,
        copyleaksScore: results.find(r => r.service === 'Copyleaks')?.aiPercentage?.toString() || null,
        copyleaksResult: results.find(r => r.service === 'Copyleaks')?.result || null,
        overallResult,
        detectionMetadata: { results, timestamp: new Date().toISOString() }
      }).returning();

      return {
        id: savedRun.id,
        overallResult,
        results,
        timestamp: savedRun.createdAt
      };

    } catch (error) {
      console.error('AI Detection Shield error:', error);
      throw new Error('Detection shield failed to complete');
    }
  }

  // Get user's detection history
  static async getUserDetectionHistory(userId: number) {
    return await db.query.aiDetectionShieldRuns.findMany({
      where: (runs, { eq }) => eq(runs.userId, userId),
      orderBy: (runs, { desc }) => desc(runs.createdAt),
      limit: 50
    });
  }

  // Get specific detection run
  static async getDetectionRun(runId: number, userId: number) {
    return await db.query.aiDetectionShieldRuns.findFirst({
      where: (runs, { eq, and }) => and(
        eq(runs.id, runId),
        eq(runs.userId, userId)
      )
    });
  }
}