import OpenAI from 'openai';
import { ProductionConfig } from '../production-config';
import { db } from "@db";
import { apiUsageLogs, costTracking } from "@db/schema";

export class OpenAIMonitor {
  private static instance: OpenAIMonitor;
  private client: OpenAI;
  private requestCount: number = 0;
  private tokenCount: number = 0;
  private lastResetTime: number = Date.now();

  private constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: ProductionConfig.openai.timeout,
      maxRetries: ProductionConfig.openai.maxRetries,
    });
  }

  public static getInstance(): OpenAIMonitor {
    if (!OpenAIMonitor.instance) {
      OpenAIMonitor.instance = new OpenAIMonitor();
    }
    return OpenAIMonitor.instance;
  }

  private resetCountersIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastResetTime >= 60000) { // Reset every minute
      this.requestCount = 0;
      this.tokenCount = 0;
      this.lastResetTime = now;
    }
  }

  private async checkRateLimits(): Promise<boolean> {
    this.resetCountersIfNeeded();
    
    const { requestsPerMinute, tokensPerMinute } = ProductionConfig.openai.rateLimits;
    
    if (this.requestCount >= requestsPerMinute) {
      console.warn(`[OPENAI_MONITOR] Request rate limit exceeded: ${this.requestCount}/${requestsPerMinute}`);
      return false;
    }
    
    if (this.tokenCount >= tokensPerMinute) {
      console.warn(`[OPENAI_MONITOR] Token rate limit exceeded: ${this.tokenCount}/${tokensPerMinute}`);
      return false;
    }
    
    return true;
  }

  private calculateCost(model: string, tokens: number): number {
    const isGPT4 = model.includes('gpt-4');
    const costPerToken = isGPT4 
      ? ProductionConfig.openai.costTracking.gpt4 / 1000
      : ProductionConfig.openai.costTracking.gpt35 / 1000;
    
    return tokens * costPerToken;
  }

  public async createCompletion(
    messages: any[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      userId?: number;
      endpoint?: string;
    } = {}
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const startTime = Date.now();
    
    // Check rate limits
    if (!(await this.checkRateLimits())) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const model = options.model || 'gpt-4o';
    const maxTokens = options.maxTokens || ProductionConfig.openai.maxTokens.free;

    try {
      this.requestCount++;
      
      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: options.temperature || 0.7,
      });

      const responseTime = Date.now() - startTime;
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(model, tokensUsed);

      this.tokenCount += tokensUsed;

      // Log usage for monitoring
      await this.logUsage({
        service: 'openai',
        endpoint: options.endpoint || 'chat/completions',
        userId: options.userId,
        tokens: tokensUsed,
        cost,
        responseTime,
        status: 'success',
        timestamp: new Date(),
      });

      console.log(`[OPENAI_MONITOR] Request completed: ${tokensUsed} tokens, $${cost.toFixed(4)}, ${responseTime}ms`);

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      await this.logUsage({
        service: 'openai',
        endpoint: options.endpoint || 'chat/completions',
        userId: options.userId,
        tokens: 0,
        cost: 0,
        responseTime,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });

      console.error(`[OPENAI_MONITOR] Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async logUsage(usage: {
    service: string;
    endpoint: string;
    userId?: number;
    tokens: number;
    cost: number;
    responseTime: number;
    status: string;
    errorMessage?: string;
    timestamp: Date;
  }): Promise<void> {
    try {
      await db.insert(apiUsageLogs).values({
        service: usage.service,
        endpoint: usage.endpoint,
        userId: usage.userId,
        tokens: usage.tokens,
        cost: usage.cost.toString(),
        responseTime: usage.responseTime,
        status: usage.status,
        errorMessage: usage.errorMessage,
        timestamp: usage.timestamp,
      });
    } catch (error) {
      console.error('[OPENAI_MONITOR] Failed to log usage:', error);
    }
  }

  public async getDailyStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const stats = await db.query.apiUsageLogs.findMany({
        where: (logs, { gte, eq }) => 
          gte(logs.timestamp, today) && eq(logs.service, 'openai'),
      });

      const totalCost = stats.reduce((sum, log) => sum + parseFloat(log.cost || '0'), 0);
      const totalTokens = stats.reduce((sum, log) => sum + (log.tokens || 0), 0);
      const avgResponseTime = stats.length > 0 
        ? stats.reduce((sum, log) => sum + log.responseTime, 0) / stats.length 
        : 0;

      return {
        totalRequests: stats.length,
        totalCost,
        totalTokens,
        avgResponseTime,
        successRate: stats.filter(s => s.status === 'success').length / stats.length,
      };
    } catch (error) {
      console.error('[OPENAI_MONITOR] Failed to get daily stats:', error);
      return null;
    }
  }
}