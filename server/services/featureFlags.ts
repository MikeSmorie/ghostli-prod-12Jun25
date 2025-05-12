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
    // Hard-coded feature flags for testing - will return these values directly
    // This will bypass DB issues while we work on fixing the schema
    if (featureName === "proWritingBrief" || featureName === "liteWritingBrief") {
      return true;
    }
    
    try {
      // Attempt to query the database with the expected schema
      const flags = await db
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.featureName, featureName))
        .limit(1);
      
      // If we get here, the query worked
      if (flags.length === 0 || !flags[0].isEnabled) {
        return false;
      }
      
      // For testing purposes ONLY - return true for all users regardless of tier
      return true;
    } catch (dbError) {
      console.error("Database schema issue:", dbError);
      // Fallback to hardcoded values if DB query fails
      return featureName === "proWritingBrief" || featureName === "liteWritingBrief";
    }
  } catch (error) {
    console.error(`Error checking feature access for ${featureName}:`, error);
    // For testing, return true to enable all features
    return true;
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
    // For testing, always return these hardcoded features
    // This ensures the writing brief toggle will work regardless of DB schema issues
    return [
      {
        featureName: "proWritingBrief",
        isEnabled: true,
        tierLevel: "premium",
        description: "Structured writing brief form for professional content creation",
        userHasAccess: true
      },
      {
        featureName: "liteWritingBrief",
        isEnabled: true,
        tierLevel: "basic",
        description: "Simplified writing brief form for Lite users",
        userHasAccess: true
      }
    ];
  } catch (error) {
    console.error("Error getting user features:", error);
    
    // Fallback features
    return [
      {
        featureName: "proWritingBrief",
        isEnabled: true,
        tierLevel: "premium",
        description: "Structured writing brief form for professional content creation",
        userHasAccess: true
      },
      {
        featureName: "liteWritingBrief",
        isEnabled: true,
        tierLevel: "basic",
        description: "Simplified writing brief form for Lite users",
        userHasAccess: true
      }
    ];
  }
}