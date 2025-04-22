import { db } from "@db";
import { featureFlags, userSubscriptions, subscriptionPlans, tierLevelEnum } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { TierLevel } from "@db/schema";

// Map subscription plan names to tier levels
const planToTierMap: Record<string, TierLevel> = {
  "Free": "free",
  "Basic": "basic",
  "Premium": "premium",
  "Enterprise": "enterprise"
};

// Order of tiers from lowest to highest for comparison
const tierOrder: TierLevel[] = ["free", "basic", "premium", "enterprise"];

/**
 * Check if a tier level meets the minimum required tier
 * @param userTier The user's tier level
 * @param requiredTier The minimum tier level required for access
 * @returns boolean indicating if the user's tier is sufficient
 */
export function tierMeetsRequirement(userTier: TierLevel, requiredTier: TierLevel): boolean {
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  
  if (userTierIndex === -1 || requiredTierIndex === -1) {
    return false;
  }
  
  return userTierIndex >= requiredTierIndex;
}

/**
 * Get a user's subscription tier
 * @param userId The user's ID
 * @returns The user's tier level or 'free' if not subscribed
 */
export async function getUserTier(userId: number): Promise<TierLevel> {
  try {
    // Get user's active subscription
    const subscriptions = await db
      .select({
        planId: userSubscriptions.planId,
        status: userSubscriptions.status
      })
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, "active")
        )
      )
      .limit(1);
    
    if (subscriptions.length === 0) {
      return "free";
    }
    
    // Get subscription plan details
    const plans = await db
      .select({
        name: subscriptionPlans.name
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscriptions[0].planId))
      .limit(1);
    
    if (plans.length === 0) {
      return "free";
    }
    
    // Map plan name to tier level
    return planToTierMap[plans[0].name] || "free";
  } catch (error) {
    console.error("Error getting user tier:", error);
    return "free";
  }
}

/**
 * Check if a feature is enabled for a user
 * @param featureName The name of the feature to check
 * @param userId The user's ID
 * @returns boolean indicating if the feature is enabled for the user
 */
export async function isFeatureEnabled(featureName: string, userId: number): Promise<boolean> {
  try {
    // Get feature flag details
    const flags = await db
      .select({
        isEnabled: featureFlags.isEnabled,
        tierLevel: featureFlags.tierLevel
      })
      .from(featureFlags)
      .where(eq(featureFlags.featureName, featureName))
      .limit(1);
    
    // If feature flag doesn't exist or is disabled, return false
    if (flags.length === 0 || !flags[0].isEnabled) {
      return false;
    }
    
    // Get user's tier level
    const userTier = await getUserTier(userId);
    
    // Check if user's tier meets the requirement
    return tierMeetsRequirement(userTier, flags[0].tierLevel as TierLevel);
  } catch (error) {
    console.error(`Error checking feature access for ${featureName}:`, error);
    return false;
  }
}

/**
 * Get all feature flags with their status for a specific user
 * @param userId The user's ID
 * @returns Array of feature flags with their status for the user
 */
export async function getUserFeatures(userId: number): Promise<Array<{
  featureName: string;
  isEnabled: boolean;
  tierLevel: string;
  description: string | null;
  userHasAccess: boolean;
}>> {
  try {
    // Get all feature flags
    const allFlags = await db
      .select({
        featureName: featureFlags.featureName,
        isEnabled: featureFlags.isEnabled,
        tierLevel: featureFlags.tierLevel,
        description: featureFlags.description
      })
      .from(featureFlags);
    
    // Get user's tier level
    const userTier = await getUserTier(userId);
    
    // Add userHasAccess property to each feature flag
    return allFlags.map(flag => ({
      ...flag,
      isEnabled: flag.isEnabled === null ? false : flag.isEnabled, 
      userHasAccess: (flag.isEnabled === true) && tierMeetsRequirement(userTier, flag.tierLevel as TierLevel)
    }));
  } catch (error) {
    console.error("Error getting user features:", error);
    return [];
  }
}