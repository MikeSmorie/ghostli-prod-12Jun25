import { db } from "@db";
import { users, creditTransactions } from "@db/schema";
import { eq } from "drizzle-orm";

export type SubscriptionTier = "FREE" | "PRO";

export interface TierLimits {
  maxWordCount: number;
  hasCloneMe: boolean;
  hasAnalytics: boolean;
  hasAIDetectionShield: boolean;
  hasDetailedBrief: boolean;
  creditMultiplier: number; // 1.0 for standard, 0.8 for discounted PRO
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  FREE: {
    maxWordCount: 1000,
    hasCloneMe: false,
    hasAnalytics: false,
    hasAIDetectionShield: false,
    hasDetailedBrief: false,
    creditMultiplier: 1.0
  },
  PRO: {
    maxWordCount: 5000,
    hasCloneMe: true,
    hasAnalytics: true,
    hasAIDetectionShield: true,
    hasDetailedBrief: true,
    creditMultiplier: 0.8
  }
};

export class SubscriptionService {
  static async getUserTier(userId: number): Promise<SubscriptionTier> {
    const [user] = await db
      .select({ subscriptionTier: users.subscriptionTier })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return (user?.subscriptionTier as SubscriptionTier) || "FREE";
  }

  static async upgradeToPro(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ subscriptionTier: "PRO" })
      .where(eq(users.id, userId));
  }

  static async downgradeTo(userId: number, tier: SubscriptionTier): Promise<void> {
    await db
      .update(users)
      .set({ subscriptionTier: tier })
      .where(eq(users.id, userId));
  }

  static getTierLimits(tier: SubscriptionTier): TierLimits {
    return TIER_LIMITS[tier];
  }

  static calculateCreditCost(tier: SubscriptionTier, baseCost: number): number {
    const limits = this.getTierLimits(tier);
    return Math.ceil(baseCost * limits.creditMultiplier);
  }

  static async checkFeatureAccess(userId: number, feature: keyof Omit<TierLimits, 'maxWordCount' | 'creditMultiplier'>): Promise<boolean> {
    const tier = await this.getUserTier(userId);
    const limits = this.getTierLimits(tier);
    return limits[feature];
  }

  static async shouldAutoUpgrade(userId: number): Promise<boolean> {
    // Check if user has made any credit purchases
    const [transaction] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .limit(1);

    return !!transaction;
  }

  static async autoUpgradeIfEligible(userId: number): Promise<void> {
    const shouldUpgrade = await this.shouldAutoUpgrade(userId);
    if (shouldUpgrade) {
      const currentTier = await this.getUserTier(userId);
      if (currentTier === "FREE") {
        await this.upgradeToPro(userId);
      }
    }
  }
}