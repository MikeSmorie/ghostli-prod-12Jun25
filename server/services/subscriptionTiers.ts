import { db } from "@db";
import { 
  users, 
  userSubscriptions, 
  subscriptionPlans, 
  featureFlags, 
  features,
  planFeatures 
} from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

// Constants for tier definitions
export const TIER_LITE = "free";
export const TIER_PRO = "premium";

// Feature keys
export const FEATURES = {
  // Basic features (available to Lite/Free users)
  CONTENT_GENERATION_BASIC: "content_generation_basic",
  WRITING_BRIEF_LITE: "writing_brief_lite",
  EXPORT_BASIC: "export_basic",
  
  // Pro features
  CONTENT_GENERATION_PREMIUM: "content_generation_premium",
  WRITING_BRIEF_PRO: "writing_brief_pro",
  CLONE_ME: "clone_me",
  HUMANIZATION_SETTINGS: "humanization_settings",
  VOCABULARY_CONTROL: "vocabulary_control",
  PLAGIARISM_DETECTION: "plagiarism_detection",
  SEO_OPTIMIZATION: "seo_optimization",
  MULTIPLE_EXPORT_FORMATS: "multilple_export_formats"
};

// Mapping of features to their tier levels
const FEATURE_TIER_MAP: Record<string, string> = {
  [FEATURES.CONTENT_GENERATION_BASIC]: TIER_LITE,
  [FEATURES.WRITING_BRIEF_LITE]: TIER_LITE,
  [FEATURES.EXPORT_BASIC]: TIER_LITE,
  
  [FEATURES.CONTENT_GENERATION_PREMIUM]: TIER_PRO,
  [FEATURES.WRITING_BRIEF_PRO]: TIER_PRO,
  [FEATURES.CLONE_ME]: TIER_PRO, 
  [FEATURES.HUMANIZATION_SETTINGS]: TIER_PRO,
  [FEATURES.VOCABULARY_CONTROL]: TIER_PRO,
  [FEATURES.PLAGIARISM_DETECTION]: TIER_PRO,
  [FEATURES.SEO_OPTIMIZATION]: TIER_PRO,
  [FEATURES.MULTIPLE_EXPORT_FORMATS]: TIER_PRO,
};

/**
 * Checks if a user has access to a specific feature based on their subscription
 */
export async function hasFeatureAccess(userId: number, featureName: string): Promise<boolean> {
  try {
    // First check if the feature exists
    const feature = await db.query.featureFlags.findFirst({
      where: eq(featureFlags.name, featureName)
    });
    
    if (!feature) {
      console.warn(`Feature flag "${featureName}" not found in database`);
      return false;
    }
    
    // If feature is disabled globally, nobody has access
    if (!feature.enabled) {
      return false;
    }
    
    // Determine the tier level required for this feature
    const tierRequired = FEATURE_TIER_MAP[featureName] || TIER_PRO;
    
    // Free tier features are accessible to everyone
    if (tierRequired === TIER_LITE) {
      return true;
    }
    
    // Check if user has an active subscription
    const activeSubscription = await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active")
      ),
      with: {
        plan: true
      },
      orderBy: [desc(userSubscriptions.createdAt)]
    });
    
    if (!activeSubscription) {
      return false;
    }
    
    // Check the subscription plan's metadata to determine tier level
    const planMetadata = activeSubscription.plan.metadata 
      ? JSON.parse(activeSubscription.plan.metadata as string) 
      : { tierLevel: TIER_LITE };
    
    const subscriptionTier = planMetadata.tierLevel || TIER_LITE;
    
    // Premium tier has access to all features
    if (subscriptionTier === TIER_PRO) {
      return true;
    }
    
    // For other tiers, check tier requirements
    return subscriptionTier === tierRequired;
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
    // Get the user's subscription
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.id, subscriptionId),
      with: {
        plan: true
      }
    });
    
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
    
    // Get the subscription plan's tier level from metadata
    const planMetadata = subscription.plan.metadata 
      ? JSON.parse(subscription.plan.metadata as string) 
      : { tierLevel: TIER_LITE };
    
    const tierLevel = planMetadata.tierLevel || TIER_LITE;
    
    // Enable/disable features based on tier level
    const features = await db.select().from(featureFlags);
    
    for (const feature of features) {
      const featureTierRequired = FEATURE_TIER_MAP[feature.name] || TIER_PRO;
      
      // Update the feature flag
      const hasAccess = 
        // Free tier features are available to everyone
        featureTierRequired === TIER_LITE ||
        // Premium tier has access to all features
        tierLevel === TIER_PRO;
        
      await db.update(featureFlags)
        .set({ enabled: hasAccess })
        .where(eq(featureFlags.name, feature.name));
    }
    
  } catch (error) {
    console.error("Error updating user feature access:", error);
    throw error;
  }
}

/**
 * Gets a user's subscription tier
 */
export async function getUserSubscriptionTier(userId: number): Promise<string> {
  try {
    // Check if user has an active subscription
    const activeSubscription = await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active")
      ),
      with: {
        plan: true
      },
      orderBy: [desc(userSubscriptions.createdAt)]
    });
    
    if (!activeSubscription) {
      return TIER_LITE; // Default to free tier
    }
    
    // Check the subscription plan metadata to determine tier level
    const planMetadata = activeSubscription.plan.metadata 
      ? JSON.parse(activeSubscription.plan.metadata as string) 
      : { tierLevel: TIER_LITE };
    
    return planMetadata.tierLevel || TIER_LITE;
  } catch (error) {
    console.error("Error getting user subscription tier:", error);
    return TIER_LITE; // Default to free tier on error
  }
}