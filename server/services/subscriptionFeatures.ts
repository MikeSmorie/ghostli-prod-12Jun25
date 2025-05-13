import { db } from "@db";
import { featureFlags, planFeatures, userSubscriptions, subscriptionPlans } from "@db/schema";
import { getFeaturesForTier } from "./subscriptionTiers";
import { and, eq } from "drizzle-orm";

/**
 * Service for managing user access to features based on their subscription
 */

/**
 * Gets user's active feature flags based on their subscription
 */
export async function getUserFeatures(userId: number) {
  try {
    // Get the user's active subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, "active")
        )
      )
      .limit(1);

    if (!subscription) {
      // Return free tier features if no active subscription
      return {
        features: getFeaturesForTier("free"),
        tier: "free"
      };
    }

    // Get the subscription plan
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription.planId))
      .limit(1);

    if (!plan) {
      // Return free tier features if plan not found
      return {
        features: getFeaturesForTier("free"),
        tier: "free"
      };
    }

    // Return features for the user's subscription tier
    return {
      features: getFeaturesForTier(plan.tierLevel),
      tier: plan.tierLevel
    };
  } catch (error) {
    console.error("Error getting user features:", error);
    // Return free tier features on error
    return {
      features: getFeaturesForTier("free"),
      tier: "free"
    };
  }
}

/**
 * Checks if a user has access to a specific feature
 */
export async function hasFeatureAccess(userId: number, featureName: string): Promise<boolean> {
  const { features } = await getUserFeatures(userId);
  return features[featureName] === true;
}

/**
 * Gets the user's subscription tier level
 */
export async function getUserSubscriptionTier(userId: number): Promise<string> {
  const { tier } = await getUserFeatures(userId);
  return tier;
}

/**
 * Updates a user's subscription
 */
export async function updateUserSubscription(
  userId: number,
  planId: number,
  status: string = "active"
): Promise<boolean> {
  try {
    // Check for existing subscription
    const existingSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (existingSubscriptions.length > 0) {
      // Update existing subscription
      await db
        .update(userSubscriptions)
        .set({
          planId,
          status,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.userId, userId));
    } else {
      // Create new subscription
      await db.insert(userSubscriptions).values({
        userId,
        planId,
        status,
        startDate: new Date(),
        endDate: null, // Open-ended subscription
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return false;
  }
}