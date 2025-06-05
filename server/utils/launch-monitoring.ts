// Launch monitoring utility for tracking key user events
export class LaunchMonitoring {
  static logEvent(eventType: string, userId?: number, metadata?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${eventType}] ${timestamp} User:${userId || 'anonymous'} ${metadata ? JSON.stringify(metadata) : ''}`;
    
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
}