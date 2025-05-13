import { db } from "@db";
import { featureFlags, subscriptionPlans, planFeatures } from "@db/schema";
import { getFeaturesForTier, getAllFeatureDefinitions, SUBSCRIPTION_TIERS } from "../services/subscriptionTiers";
import { eq } from "drizzle-orm";

/**
 * This script initializes or updates the subscription tiers and feature flags in the database.
 * It creates:
 * 1. All feature flag definitions
 * 2. All subscription plan tiers
 * 3. The relationship between plans and features (which tier gets which features)
 */

export async function setupSubscriptionTiers() {
  try {
    console.log("Setting up subscription tiers and feature flags...");

    // Step 1: Create or update feature flags
    await setupFeatureFlags();

    // Step 2: Create or update subscription plans
    await setupSubscriptionPlans();

    // Step 3: Create or update plan-feature relationships
    await setupPlanFeatures();

    console.log("Subscription tiers and feature flags setup complete.");
  } catch (error) {
    console.error("Error setting up subscription tiers:", error);
  }
}

async function setupFeatureFlags() {
  console.log("Setting up feature flags...");

  // Get all feature definitions
  const featureDefinitions = getAllFeatureDefinitions();

  // For each feature, insert it if it doesn't exist or update it if it does
  for (const feature of featureDefinitions) {
    // Check if feature exists
    const existingFeatures = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.name, feature.name));

    if (existingFeatures.length === 0) {
      // Create new feature flag
      await db.insert(featureFlags).values({
        name: feature.name,
        description: feature.description,
        enabled: true, // All features are enabled in the system by default
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created feature flag: ${feature.name}`);
    } else {
      // Update existing feature flag
      await db
        .update(featureFlags)
        .set({
          description: feature.description,
          updatedAt: new Date(),
        })
        .where(eq(featureFlags.name, feature.name));
      console.log(`Updated feature flag: ${feature.name}`);
    }
  }
}

async function setupSubscriptionPlans() {
  console.log("Setting up subscription plans...");

  // Set up free tier
  await createOrUpdatePlan({
    name: SUBSCRIPTION_TIERS.FREE.name,
    description: SUBSCRIPTION_TIERS.FREE.description,
    tierLevel: SUBSCRIPTION_TIERS.FREE.tierLevel,
    monthlyPrice: SUBSCRIPTION_TIERS.FREE.monthlyPrice,
    yearlyPrice: SUBSCRIPTION_TIERS.FREE.yearlyPrice
  });

  // Set up pro tier
  await createOrUpdatePlan({
    name: SUBSCRIPTION_TIERS.PRO.name,
    description: SUBSCRIPTION_TIERS.PRO.description,
    tierLevel: SUBSCRIPTION_TIERS.PRO.tierLevel,
    monthlyPrice: SUBSCRIPTION_TIERS.PRO.monthlyPrice,
    yearlyPrice: SUBSCRIPTION_TIERS.PRO.yearlyPrice
  });
}

async function createOrUpdatePlan(plan: {
  name: string;
  description: string;
  tierLevel: string;
  monthlyPrice: number;
  yearlyPrice: number;
}) {
  // Check if plan exists
  const existingPlans = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, plan.name));

  if (existingPlans.length === 0) {
    // Create new plan
    await db.insert(subscriptionPlans).values({
      name: plan.name,
      description: plan.description,
      tierLevel: plan.tierLevel,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Created subscription plan: ${plan.name}`);
  } else {
    // Update existing plan
    await db
      .update(subscriptionPlans)
      .set({
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlans.name, plan.name));
    console.log(`Updated subscription plan: ${plan.name}`);
  }
}

async function setupPlanFeatures() {
  console.log("Setting up plan-feature relationships...");

  // Get all plan IDs
  const plans = await db.select().from(subscriptionPlans);
  
  // Get all feature IDs
  const features = await db.select().from(featureFlags);

  // Map plan names to IDs
  const planMap = plans.reduce((acc, plan) => {
    acc[plan.name] = plan.id;
    return acc;
  }, {} as Record<string, number>);

  // Map feature names to IDs
  const featureMap = features.reduce((acc, feature) => {
    acc[feature.name] = feature.id;
    return acc;
  }, {} as Record<string, number>);

  // Set up features for free tier
  const freeTierFeatures = getFeaturesForTier(SUBSCRIPTION_TIERS.FREE.tierLevel);
  await setupFeaturesForPlan(
    planMap[SUBSCRIPTION_TIERS.FREE.name],
    featureMap,
    freeTierFeatures
  );

  // Set up features for pro tier
  const proTierFeatures = getFeaturesForTier(SUBSCRIPTION_TIERS.PRO.tierLevel);
  await setupFeaturesForPlan(
    planMap[SUBSCRIPTION_TIERS.PRO.name],
    featureMap,
    proTierFeatures
  );
}

async function setupFeaturesForPlan(
  planId: number,
  featureMap: Record<string, number>,
  features: Record<string, boolean>
) {
  // For each feature, create or update the plan-feature relationship
  for (const [featureName, isEnabled] of Object.entries(features)) {
    const featureId = featureMap[featureName];
    
    if (!featureId) {
      console.warn(`Feature not found: ${featureName}`);
      continue;
    }

    // Check if relationship exists
    const existingRelationships = await db
      .select()
      .from(planFeatures)
      .where(
        eq(planFeatures.planId, planId),
        eq(planFeatures.featureId, featureId)
      );

    if (existingRelationships.length === 0) {
      // Create new relationship
      await db.insert(planFeatures).values({
        planId,
        featureId,
        isEnabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Update existing relationship
      await db
        .update(planFeatures)
        .set({
          isEnabled,
          updatedAt: new Date(),
        })
        .where(
          eq(planFeatures.planId, planId),
          eq(planFeatures.featureId, featureId)
        );
    }
  }
}