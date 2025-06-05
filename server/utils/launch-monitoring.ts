// Launch monitoring utility for tracking key user events
export class LaunchMonitoring {
  private static events: Array<{
    type: string;
    timestamp: string;
    userId?: number;
    details?: any;
  }> = [];

  static logEvent(eventType: string, userId?: number, metadata?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${eventType}] ${timestamp} User:${userId || 'anonymous'} ${metadata ? JSON.stringify(metadata) : ''}`;
    
    // Store event for metrics
    this.events.push({
      type: eventType,
      timestamp,
      userId,
      details: metadata
    });
    
    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // Log to console for immediate visibility
    console.log(logMessage);
    
    // In production, this could also log to a monitoring service
    // Example: send to analytics, monitoring dashboard, etc.
  }

  // Key launch events
  static userRegistered(userId: number, username: string) {
    this.logEvent('EVENT_USER_REGISTERED', userId, { username });
  }

  static firstGeneration(userId: number, contentType: string, wordCount: number) {
    this.logEvent('EVENT_FIRST_GENERATION', userId, { contentType, wordCount });
  }

  static firstDetectionShield(userId: number, contentLength: number) {
    this.logEvent('EVENT_FIRST_DETECTION_SHIELD', userId, { contentLength });
  }

  static firstPurchase(userId: number, amount: number, credits: number) {
    this.logEvent('EVENT_FIRST_PURCHASE', userId, { amount, credits });
  }

  static firstCloneMe(userId: number, sampleLength: number) {
    this.logEvent('EVENT_FIRST_CLONE_ME', userId, { sampleLength });
  }

  // General activity tracking
  static contentGenerated(userId: number, generationCount: number) {
    if (generationCount === 1) {
      this.firstGeneration(userId, 'content', 0);
    }
    this.logEvent('EVENT_CONTENT_GENERATED', userId, { generationCount });
  }

  static aiDetectionRun(userId: number, detectionCount: number) {
    if (detectionCount === 1) {
      this.firstDetectionShield(userId, 0);
    }
    this.logEvent('EVENT_AI_DETECTION_RUN', userId, { detectionCount });
  }

  static async getMetrics() {
    try {
      const { db } = await import('@db');
      const { users } = await import('@db/schema');
      const { count, sql } = await import('drizzle-orm');

      // Get basic user metrics
      const totalUsersResult = await db.select({ count: count() }).from(users);
      const totalUsers = totalUsersResult[0]?.count || 0;

      // Get users active in the last week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(sql`${users.lastLogin} >= ${oneWeekAgo}`);
      const activeUsersThisWeek = activeUsersResult[0]?.count || 0;

      // Get users registered today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const newUsersTodayResult = await db
        .select({ count: count() })
        .from(users)
        .where(sql`${users.createdAt} >= ${startOfToday}`);
      const newUsersToday = newUsersTodayResult[0]?.count || 0;

      // Calculate metrics based on stored events
      const totalGenerations = this.events.filter(e => e.type === 'EVENT_CONTENT_GENERATED').length;
      const totalDetectionRuns = this.events.filter(e => e.type === 'EVENT_AI_DETECTION_RUN').length;
      const totalCreditsPurchased = this.events
        .filter(e => e.type === 'EVENT_FIRST_PURCHASE')
        .reduce((sum, e) => sum + (e.details?.amount || 0), 0);

      const averageGenerationsPerUser = totalUsers > 0 ? totalGenerations / totalUsers : 0;

      // Get recent activity (last 20 events)
      const recentActivity = this.events
        .slice(-20)
        .reverse()
        .map(event => ({
          type: event.type,
          timestamp: event.timestamp,
          userId: event.userId || 0,
          details: event.details
        }));

      return {
        totalUsers,
        activeUsersThisWeek,
        totalGenerations,
        totalDetectionRuns,
        totalCreditsPurchased,
        averageGenerationsPerUser,
        newUsersToday,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting launch metrics:', error);
      return {
        totalUsers: 0,
        activeUsersThisWeek: 0,
        totalGenerations: 0,
        totalDetectionRuns: 0,
        totalCreditsPurchased: 0,
        averageGenerationsPerUser: 0,
        newUsersToday: 0,
        recentActivity: []
      };
    }
  }
}