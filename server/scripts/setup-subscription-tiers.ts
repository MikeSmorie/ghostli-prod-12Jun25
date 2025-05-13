import { db } from "@db";
import { 
  subscriptionPlans, 
  features, 
  planFeatures, 
  featureFlags, 
  tierLevelEnum 
} from "@db/schema";
import { eq } from "drizzle-orm";
import { TIER_LITE, TIER_PRO, FEATURES } from "../services/subscriptionTiers";

// Define our subscription tiers features
const FEATURE_DEFINITIONS = [
  // Basic features (available to Lite/Free users)
  { name: FEATURES.CONTENT_GENERATION_BASIC, category: "generation", description: "Basic content generation up to 1000 words" },
  { name: FEATURES.WRITING_BRIEF_LITE, category: "interface", description: "Access to lite version of writing brief with basic fields" },
  { name: FEATURES.EXPORT_BASIC, category: "export", description: "Export as plain text" },
  
  // Pro features
  { name: FEATURES.CONTENT_GENERATION_PREMIUM, category: "generation", description: "Premium content generation up to 5000 words" },
  { name: FEATURES.WRITING_BRIEF_PRO, category: "interface", description: "Access to detailed writing brief with all options" },
  { name: FEATURES.CLONE_ME, category: "personalization", description: "Writing style analysis and cloning" },
  { name: FEATURES.HUMANIZATION_SETTINGS, category: "personalization", description: "Advanced humanization settings" },
  { name: FEATURES.VOCABULARY_CONTROL, category: "personalization", description: "Vocabulary customization and control" },
  { name: FEATURES.PLAGIARISM_DETECTION, category: "quality", description: "Plagiarism detection and prevention" },
  { name: FEATURES.SEO_OPTIMIZATION, category: "optimization", description: "SEO optimization features" },
  { name: FEATURES.MULTIPLE_EXPORT_FORMATS, category: "export", description: "Export in multiple formats (PDF, Word, HTML)" },
];

// Define the subscription plans
const SUBSCRIPTION_PLANS = [
  {
    name: "Lite",
    description: "Free access to basic content generation features",
    position: 1,
    price: "0",
    interval: "monthly",
    features: JSON.stringify([
      FEATURES.CONTENT_GENERATION_BASIC,
      FEATURES.WRITING_BRIEF_LITE,
      FEATURES.EXPORT_BASIC
    ]),
    isActive: true,
    trialPeriodDays: 0,
    metadata: JSON.stringify({ tierLevel: TIER_LITE })
  },
  {
    name: "Pro",
    description: "Full access to all advanced features including Clone Me, humanization settings, and more",
    position: 2,
    price: "29.99", // price in dollars
    interval: "monthly",
    features: JSON.stringify([
      FEATURES.CONTENT_GENERATION_BASIC,
      FEATURES.CONTENT_GENERATION_PREMIUM,
      FEATURES.WRITING_BRIEF_LITE,
      FEATURES.WRITING_BRIEF_PRO,
      FEATURES.CLONE_ME,
      FEATURES.HUMANIZATION_SETTINGS,
      FEATURES.VOCABULARY_CONTROL,
      FEATURES.PLAGIARISM_DETECTION,
      FEATURES.SEO_OPTIMIZATION,
      FEATURES.MULTIPLE_EXPORT_FORMATS,
      FEATURES.EXPORT_BASIC
    ]),
    isActive: true,
    trialPeriodDays: 7,
    metadata: JSON.stringify({ tierLevel: TIER_PRO })
  }
];

// Define feature flags with appropriate tier levels
const FEATURE_FLAGS = [
  { name: FEATURES.CONTENT_GENERATION_BASIC, enabled: true, description: "Basic content generation up to 1000 words" },
  { name: FEATURES.WRITING_BRIEF_LITE, enabled: true, description: "Access to lite version of writing brief" },
  { name: FEATURES.EXPORT_BASIC, enabled: true, description: "Export as plain text" },
  
  { name: FEATURES.CONTENT_GENERATION_PREMIUM, enabled: false, description: "Premium content generation up to 5000 words" },
  { name: FEATURES.WRITING_BRIEF_PRO, enabled: false, description: "Access to detailed writing brief with all options" },
  { name: FEATURES.CLONE_ME, enabled: false, description: "Writing style analysis and cloning" },
  { name: FEATURES.HUMANIZATION_SETTINGS, enabled: false, description: "Advanced humanization settings" },
  { name: FEATURES.VOCABULARY_CONTROL, enabled: false, description: "Vocabulary customization and control" },
  { name: FEATURES.PLAGIARISM_DETECTION, enabled: false, description: "Plagiarism detection and prevention" },
  { name: FEATURES.SEO_OPTIMIZATION, enabled: false, description: "SEO optimization features" },
  { name: FEATURES.MULTIPLE_EXPORT_FORMATS, enabled: false, description: "Export in multiple formats (PDF, Word, HTML)" },
];

async function setupSubscriptionTiers() {
  console.log("Setting up subscription tiers...");
  
  // First, clear existing data
  await db.delete(planFeatures);
  await db.delete(features);
  await db.delete(subscriptionPlans);
  await db.delete(featureFlags);
  
  console.log("Deleted existing data");
  
  // Insert features
  const insertedFeatures = await db.insert(features).values(FEATURE_DEFINITIONS).returning();
  console.log(`Inserted ${insertedFeatures.length} features`);
  
  // Insert subscription plans
  const insertedPlans = await db.insert(subscriptionPlans).values(SUBSCRIPTION_PLANS).returning();
  console.log(`Inserted ${insertedPlans.length} subscription plans`);
  
  // Create a map of feature names to IDs
  const featureMap = insertedFeatures.reduce((acc, feature) => {
    acc[feature.name] = feature.id;
    return acc;
  }, {} as Record<string, number>);
  
  // Insert plan features
  const planFeatureValues = [];
  
  for (const plan of insertedPlans) {
    const planFeatureNames = JSON.parse(plan.features as string);
    for (const featureName of planFeatureNames) {
      const featureId = featureMap[featureName];
      if (featureId) {
        planFeatureValues.push({
          planId: plan.id,
          featureId,
          enabled: true
        });
      }
    }
  }
  
  const insertedPlanFeatures = await db.insert(planFeatures).values(planFeatureValues).returning();
  console.log(`Inserted ${insertedPlanFeatures.length} plan features`);
  
  // Insert feature flags
  const insertedFeatureFlags = await db.insert(featureFlags).values(FEATURE_FLAGS).returning();
  console.log(`Inserted ${insertedFeatureFlags.length} feature flags`);
  
  console.log("Subscription tiers setup complete!");
}

// Run the setup function
setupSubscriptionTiers()
  .then(() => {
    console.log("Setup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during setup:", error);
    process.exit(1);
  });