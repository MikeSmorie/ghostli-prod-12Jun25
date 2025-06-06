import { db } from "@db";
import { users, creditTransactions, aiDetectionShieldRuns, apiUsageLogs } from "@db/schema";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";

export class DatabaseOptimizer {
  // Optimized user queries with connection pooling
  static async getUserById(id: number) {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        password: false, // Exclude sensitive data
      }
    });
  }

  static async getUserWithCredits(id: number) {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        username: true,
        credits: true,
        subscriptionTier: true,
        creditExempt: true,
      }
    });
  }

  // Optimized credit transaction queries
  static async getUserCreditHistory(userId: number, limit: number = 50) {
    return await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, userId),
      orderBy: desc(creditTransactions.createdAt),
      limit,
    });
  }

  // Optimized AI detection queries
  static async getUserDetectionHistory(userId: number, limit: number = 20) {
    return await db.query.aiDetectionShieldRuns.findMany({
      where: eq(aiDetectionShieldRuns.userId, userId),
      orderBy: desc(aiDetectionShieldRuns.createdAt),
      limit,
      columns: {
        id: true,
        overallResult: true,
        createdAt: true,
        contentText: false, // Exclude large text content for performance
      }
    });
  }

  // Batch operations for better performance
  static async batchUpdateCredits(updates: { userId: number; credits: number }[]) {
    const promises = updates.map(update =>
      db.update(users)
        .set({ credits: update.credits })
        .where(eq(users.id, update.userId))
    );
    
    return await Promise.all(promises);
  }

  // Performance monitoring queries
  static async getSystemStats() {
    const [userCount, activeUsers, totalCreditsUsed, apiCallsToday] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(gte(users.lastLogin, new Date(Date.now() - 24 * 60 * 60 * 1000))),
      db.select({ sum: sql<number>`sum(${creditTransactions.amount})` })
        .from(creditTransactions)
        .where(eq(creditTransactions.transactionType, 'CONSUMPTION')),
      db.select({ count: sql<number>`count(*)` })
        .from(apiUsageLogs)
        .where(gte(apiUsageLogs.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)))
    ]);

    return {
      totalUsers: userCount[0]?.count || 0,
      activeUsers: activeUsers[0]?.count || 0,
      totalCreditsUsed: Math.abs(totalCreditsUsed[0]?.sum || 0),
      apiCallsToday: apiCallsToday[0]?.count || 0,
    };
  }

  // Database health check
  static async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await db.select({ test: sql`1` });
      const latency = Date.now() - startTime;
      
      return {
        healthy: true,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  // Cleanup old data for performance
  static async cleanupOldData() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    try {
      // Clean up old API usage logs (keep last 30 days)
      const deletedLogs = await db.delete(apiUsageLogs)
        .where(lte(apiUsageLogs.timestamp, thirtyDaysAgo));
      
      console.log(`[DB_CLEANUP] Removed old API usage logs`);
      
      return { success: true };
    } catch (error) {
      console.error('[DB_CLEANUP] Cleanup failed:', error);
      return { success: false, error };
    }
  }
}