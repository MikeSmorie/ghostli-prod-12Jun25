import { db } from "@db";
import { users, userSubscriptions, subscriptionPlans, featureFlags } from "@db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Service to handle checking subscription-based access to features
 */

export async function hasFeatureAccess(userId: number, featureName: string): Promise<boolean> {
  try {
    // First check if the feature exists and which tier it requires
    const feature = await db.query.featureFlags.findFirst({
      where: eq(featureFlags.featureName, featureName)
    });
    
    if (!feature) {
      console.warn(`Feature flag "${featureName}" not found in database`);
      return false;
    }
    
    // If feature is disabled globally, nobody has access
    if (!feature.isEnabled) {
      return false;
    }
    
    // Free tier features are accessible to everyone
    if (feature.tierLevel === "free") {
      return true;
    }
    
    // For other tiers, check user's subscription
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    // Supergods have access to everything
    if (user && user.role === "supergod") {
      return true;
    }
    
    // Check for active subscription
    const subscription = await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active")
      ),
      with: {
        plan: true
      }
    });
    
    if (!subscription) {
      return false;
    }
    
    // Parse features JSON to check subscription tier
    let planFeatures: any = [];
    try {
      planFeatures = subscription.plan.features ? JSON.parse(subscription.plan.features) : [];
    } catch (e) {
      console.error("Error parsing subscription plan features:", e);
    }
    
    // Check subscription tier against required feature tier
    const tierLevels = ["free", "basic", "premium", "enterprise"];
    const requiredTierIndex = tierLevels.indexOf(feature.tierLevel);
    
    // Find the user's tier level from the subscription plan features
    let userTierIndex = 0; // Default to free tier
    for (const planFeature of planFeatures) {
      if (typeof planFeature === "string" && planFeature.toLowerCase().includes("tier")) {
        const tierMatch = planFeature.toLowerCase().match(/tier:\s*(free|basic|premium|enterprise)/i);
        if (tierMatch && tierMatch[1]) {
          const userTier = tierMatch[1].toLowerCase();
          userTierIndex = Math.max(userTierIndex, tierLevels.indexOf(userTier));
        }
      }
    }
    
    // User has access if their tier level is greater than or equal to the required tier
    return userTierIndex >= requiredTierIndex;
  } catch (error) {
    console.error("Error checking feature access:", error);
    return false;
  }
}

/**
 * Updates a user's feature flags based on their subscription
 * Used when a subscription is created or updated
 */
export async function updateUserFeatureAccess(userId: number, subscriptionId: number): Promise<void> {
  try {
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.id, subscriptionId),
      with: {
        plan: true
      }
    });
    
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    
    // Get all possible features
    const allFeatures = await db.query.featureFlags.findMany();
    
    // Parse the plan features
    let planFeatures: any = [];
    let userTierLevel = "free";
    
    try {
      planFeatures = subscription.plan.features ? JSON.parse(subscription.plan.features) : [];
      
      // Determine the user's tier level
      for (const feature of planFeatures) {
        if (typeof feature === "string" && feature.toLowerCase().includes("tier")) {
          const tierMatch = feature.toLowerCase().match(/tier:\s*(free|basic|premium|enterprise)/i);
          if (tierMatch && tierMatch[1]) {
            userTierLevel = tierMatch[1].toLowerCase();
            break;
          }
        }
      }
    } catch (e) {
      console.error("Error parsing subscription features:", e);
    }
    
    console.log(`User ${userId} has subscription tier: ${userTierLevel}`);
    
    // No need to update the database - feature access is checked dynamically
    // This function can be extended later to store user-specific feature overrides
  } catch (error) {
    console.error("Error updating user feature access:", error);
    throw error;
  }
}