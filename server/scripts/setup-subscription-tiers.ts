import { db } from "@db";
import { 
  subscriptionPlans, 
  features, 
  planFeatures, 
  featureFlags, 
  tierLevelEnum 
} from "@db/schema";
import { eq } from "drizzle-orm";

// Define our subscription tiers features
const FEATURES = [
  // Basic features (available to Lite/Free users)
  { name: "content_generation_basic", category: "generation", description: "Basic content generation up to 1000 words" },
  { name: "writing_brief_lite", category: "interface", description: "Access to lite version of writing brief with basic fields" },
  { name: "export_basic", category: "export", description: "Export as plain text" },
  
  // Pro features
  { name: "content_generation_premium", category: "generation", description: "Premium content generation up to 5000 words" },
  { name: "writing_brief_pro", category: "interface", description: "Access to detailed writing brief with all options" },
  { name: "clone_me", category: "personalization", description: "Writing style analysis and cloning" },
  { name: "humanization_settings", category: "personalization", description: "Advanced humanization settings" },
  { name: "vocabulary_control", category: "personalization", description: "Vocabulary customization and control" },
  { name: "plagiarism_detection", category: "quality", description: "Plagiarism detection and prevention" },
  { name: "seo_optimization", category: "optimization", description: "SEO optimization features" },
  { name: "multilple_export_formats", category: "export", description: "Export in multiple formats (PDF, Word, HTML)" },
];

// Define the subscription plans
const SUBSCRIPTION_PLANS = [
  {
    name: "Lite",
    description: "Free access to basic content generation features",
    position: 1,
    price: "0",
    interval: "monthly",
    features: JSON.stringify(["content_generation_basic", "writing_brief_lite", "export_basic"]),
    isActive: true,
    trialPeriodDays: 0,
    metadata: JSON.stringify({ tierLevel: "free" })
  },
  {
    name: "Pro",
    description: "Full access to all advanced features including Clone Me, humanization settings, and more",
    position: 2,
    price: "29.99", // price in dollars
    interval: "monthly",
    features: JSON.stringify([
      "content_generation_basic", 
      "content_generation_premium",
      "writing_brief_lite",
      "writing_brief_pro", 
      "clone_me", 
      "humanization_settings", 
      "vocabulary_control", 
      "plagiarism_detection",
      "seo_optimization",
      "multilple_export_formats",
      "export_basic"
    ]),
    isActive: true,
    trialPeriodDays: 7,
    metadata: JSON.stringify({ tierLevel: "premium" })
  }
];

// Define feature flags with appropriate tier levels
const FEATURE_FLAGS = [
  { featureName: "content_generation_basic", tierLevel: "free", description: "Basic content generation up to 1000 words" },
  { featureName: "writing_brief_lite", tierLevel: "free", description: "Access to lite version of writing brief" },
  { featureName: "export_basic", tierLevel: "free", description: "Export as plain text" },
  
  { featureName: "content_generation_premium", tierLevel: "premium", description: "Premium content generation up to 5000 words" },
  { featureName: "writing_brief_pro", tierLevel: "premium", description: "Access to detailed writing brief with all options" },
  { featureName: "clone_me", tierLevel: "premium", description: "Writing style analysis and cloning" },
  { featureName: "humanization_settings", tierLevel: "premium", description: "Advanced humanization settings" },
  { featureName: "vocabulary_control", tierLevel: "premium", description: "Vocabulary customization and control" },
  { featureName: "plagiarism_detection", tierLevel: "premium", description: "Plagiarism detection and prevention" },
  { featureName: "seo_optimization", tierLevel: "premium", description: "SEO optimization features" },
  { featureName: "multilple_export_formats", tierLevel: "premium", description: "Export in multiple formats (PDF, Word, HTML)" },
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
  const insertedFeatures = await db.insert(features).values(FEATURES).returning();
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