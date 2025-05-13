import { db } from "@db";
import { users, userSubscriptions, subscriptionPlans } from "@db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { 
  SubscriptionNotificationService, 
  SubscriptionMessageType 
} from "./subscriptionNotifications";

/**
 * Service that manages subscription lifecycle events and notifications
 */
export class SubscriptionLifecycleService {
  private notificationService: SubscriptionNotificationService;
  
  constructor(notificationService: SubscriptionNotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Process a new subscription and send welcome message
   */
  async processNewSubscription(userId: number, subscriptionId: number): Promise<boolean> {
    try {
      // Get subscription details
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.id, subscriptionId))
        .limit(1);

      if (!subscription) {
        console.error(`Subscription not found: ${subscriptionId}`);
        return false;
      }

      // Get user details
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        console.error(`User not found: ${userId}`);
        return false;
      }

      // Get plan details
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription.planId))
        .limit(1);

      if (!plan) {
        console.error(`Plan not found: ${subscription.planId}`);
        return false;
      }

      // Check if this is a premium plan (checking for tier level > "free")
      const planMetadata = plan.metadata ? JSON.parse(plan.metadata) : {};
      if (!planMetadata.tierLevel || planMetadata.tierLevel === "free") {
        console.log("Not sending welcome message for free tier subscription");
        return true;
      }

      // Check for recent message to avoid duplicates
      const hasRecentMessage = await this.notificationService.hasRecentMessage(
        userId,
        SubscriptionMessageType.WELCOME_PRO
      );

      if (hasRecentMessage) {
        console.log(`User ${userId} already received a recent welcome message`);
        return true;
      }

      // Send welcome message
      return await this.notificationService.sendProWelcomeMessage(
        userId,
        user.username || "valued customer",
        plan.name,
        subscription.endDate || undefined
      );
    } catch (error) {
      console.error("Error processing new subscription:", error);
      return false;
    }
  }

  /**
   * Send upgrade reminder when a user hits a feature limit
   */
  async sendUpgradeReminder(userId: number, featureTriggered: string): Promise<boolean> {
    try {
      // Get user details
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        console.error(`User not found: ${userId}`);
        return false;
      }

      // Check if user has an active premium subscription already
      const activePremiumSub = await this.hasActivePremiumSubscription(userId);
      if (activePremiumSub) {
        console.log(`User ${userId} already has premium subscription, not sending upgrade reminder`);
        return true;
      }

      // Check for recent message to avoid duplicates
      const hasRecentMessage = await this.notificationService.hasRecentMessage(
        userId,
        SubscriptionMessageType.UPGRADE_REMINDER
      );

      if (hasRecentMessage) {
        console.log(`User ${userId} already received a recent upgrade reminder`);
        return true;
      }

      // Send upgrade reminder
      return await this.notificationService.sendUpgradeReminder(
        userId,
        user.username || "valued customer",
        featureTriggered
      );
    } catch (error) {
      console.error("Error sending upgrade reminder:", error);
      return false;
    }
  }

  /**
   * Process expiring subscriptions and send notices
   */
  async processExpiringSubscriptions(): Promise<{ success: number; failed: number }> {
    try {
      const now = new Date();
      const notificationThresholds = [3, 7, 14, 30]; // Days before expiration to send notice
      let successCount = 0;
      let failureCount = 0;

      // Find subscriptions expiring within the next 30 days
      const expiringSubscriptions = await db
        .select()
        .from(userSubscriptions)
        .innerJoin(users, eq(users.id, userSubscriptions.userId))
        .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, userSubscriptions.planId))
        .where(
          and(
            eq(userSubscriptions.status, "active"),
            gte(userSubscriptions.endDate!, new Date(now.getTime())),
            lte(
              userSubscriptions.endDate!,
              new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            )
          )
        );

      for (const { user_subscriptions, users, subscription_plans } of expiringSubscriptions) {
        if (!user_subscriptions.endDate) continue;

        const daysToExpiration = Math.ceil(
          (user_subscriptions.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if we should send a notification for this threshold
        for (const threshold of notificationThresholds) {
          if (daysToExpiration === threshold) {
            // Check plan is premium
            const planMetadata = subscription_plans.metadata 
              ? JSON.parse(subscription_plans.metadata) 
              : {};
              
            if (!planMetadata.tierLevel || planMetadata.tierLevel === "free") {
              continue; // Skip free plans
            }

            // Check for recent message to avoid duplicates
            const hasRecentMessage = await this.notificationService.hasRecentMessage(
              users.id,
              SubscriptionMessageType.EXPIRATION_NOTICE
            );

            if (hasRecentMessage) {
              console.log(`User ${users.id} already received a recent expiration notice`);
              continue;
            }

            // Send expiration notice
            const success = await this.notificationService.sendExpirationNotice(
              users.id,
              users.username || "valued customer",
              daysToExpiration,
              user_subscriptions.endDate
            );

            if (success) {
              successCount++;
            } else {
              failureCount++;
            }
          }
        }
      }

      return { success: successCount, failed: failureCount };
    } catch (error) {
      console.error("Error processing expiring subscriptions:", error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Check if a user has an active premium subscription
   * Public method for API access
   */
  async hasActivePremiumSubscription(userId: number): Promise<boolean> {
    const activeSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, userSubscriptions.planId))
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, "active")
        )
      );

    return activeSubscriptions.some(({ subscription_plans }) => {
      const metadata = subscription_plans.metadata ? JSON.parse(subscription_plans.metadata) : {};
      return metadata.tierLevel && metadata.tierLevel !== "free";
    });
  }

  /**
   * Initialize the service with required dependencies
   */
  static async initialize(): Promise<SubscriptionLifecycleService> {
    const notificationService = await SubscriptionNotificationService.initialize();
    return new SubscriptionLifecycleService(notificationService);
  }
}