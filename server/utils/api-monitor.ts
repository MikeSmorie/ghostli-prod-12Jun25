import { db } from "@db";
import { apiUsageLogs } from "@db/schema";

export interface APIUsageMetrics {
  service: 'openai' | 'paypal' | 'other';
  endpoint: string;
  userId?: number;
  tokens?: number;
  cost?: number;
  responseTime: number;
  status: 'success' | 'error';
  errorMessage?: string;
  timestamp: Date;
}

export class APIMonitor {
  private static instance: APIMonitor;
  private usageBuffer: APIUsageMetrics[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  private constructor() {
    // Flush buffer periodically
    setInterval(() => {
      this.flushBuffer();
    }, this.FLUSH_INTERVAL);
  }

  public static getInstance(): APIMonitor {
    if (!APIMonitor.instance) {
      APIMonitor.instance = new APIMonitor();
    }
    return APIMonitor.instance;
  }

  public async logAPIUsage(metrics: APIUsageMetrics): Promise<void> {
    this.usageBuffer.push(metrics);
    
    if (this.usageBuffer.length >= this.BUFFER_SIZE) {
      await this.flushBuffer();
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.usageBuffer.length === 0) return;

    try {
      const records = this.usageBuffer.splice(0, this.usageBuffer.length);
      
      // Log to database in batches for better performance
      await db.insert(apiUsageLogs).values(records.map(record => ({
        service: record.service,
        endpoint: record.endpoint,
        userId: record.userId,
        tokens: record.tokens,
        cost: record.cost ? record.cost.toString() : null,
        responseTime: record.responseTime,
        status: record.status,
        errorMessage: record.errorMessage,
        timestamp: record.timestamp,
      })));
      
      console.log(`[API_MONITOR] Logged ${records.length} API usage records`);
    } catch (error) {
      console.error('[API_MONITOR] Failed to log API usage:', error);
      // Re-add records to buffer for retry
      this.usageBuffer.unshift(...this.usageBuffer);
    }
  }

  public async getUsageStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    const now = new Date();
    const timeAgo = new Date();
    
    switch (timeframe) {
      case 'hour':
        timeAgo.setHours(now.getHours() - 1);
        break;
      case 'day':
        timeAgo.setDate(now.getDate() - 1);
        break;
      case 'week':
        timeAgo.setDate(now.getDate() - 7);
        break;
    }

    try {
      const stats = await db.query.apiUsageLogs.findMany({
        where: (logs, { gte }) => gte(logs.timestamp, timeAgo),
      });

      return {
        totalRequests: stats.length,
        successRequests: stats.filter(s => s.status === 'success').length,
        errorRequests: stats.filter(s => s.status === 'error').length,
        totalTokens: stats.reduce((sum, s) => sum + (s.tokens || 0), 0),
        totalCost: stats.reduce((sum, s) => sum + parseFloat(s.cost || '0'), 0),
        avgResponseTime: stats.reduce((sum, s) => sum + s.responseTime, 0) / stats.length,
        serviceBreakdown: this.groupByService(stats),
      };
    } catch (error) {
      console.error('[API_MONITOR] Failed to get usage stats:', error);
      return null;
    }
  }

  private groupByService(stats: any[]): Record<string, any> {
    return stats.reduce((acc, stat) => {
      if (!acc[stat.service]) {
        acc[stat.service] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          avgResponseTime: 0,
        };
      }
      
      acc[stat.service].requests++;
      acc[stat.service].tokens += stat.tokens || 0;
      acc[stat.service].cost += parseFloat(stat.cost || '0');
      acc[stat.service].avgResponseTime += stat.responseTime;
      
      return acc;
    }, {});
  }
}

// Middleware for automatic API monitoring
export function createAPIMonitorMiddleware(service: string, endpoint: string) {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const monitor = APIMonitor.getInstance();
    
    // Capture original res.json to monitor responses
    const originalJson = res.json;
    res.json = function(body: any) {
      const responseTime = Date.now() - startTime;
      
      // Log API usage
      monitor.logAPIUsage({
        service: service as any,
        endpoint,
        userId: req.user?.id,
        responseTime,
        status: res.statusCode >= 400 ? 'error' : 'success',
        errorMessage: res.statusCode >= 400 ? body.error || body.message : undefined,
        timestamp: new Date(),
      });
      
      return originalJson.call(this, body);
    };
    
    next();
  };
}