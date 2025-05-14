import { Request, Response, Router } from "express";
import { db } from "@db";
import { userSubscriptions, featureFlags, subscriptionPlans } from "@db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getUserFeatures, hasFeatureAccess, getUserSubscriptionTier, updateUserSubscription } from "../services/subscriptionFeatures";
import { FEATURES, SUBSCRIPTION_TIERS } from "../services/subscriptionTiers";

const router = Router();

/**
 * Get the current user's subscription status and feature access
 */
router.get("/features", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    
    // Get the user's subscription tier
    const tier = await getUserSubscriptionTier(userId);
    
    // Check all available features
    const allFeatures = await db.select().from(featureFlags);
    const featureAccess: Record<string, boolean> = {};
    
    // Get feature access for all features
    for (const feature of allFeatures) {
      featureAccess[feature.name] = await hasFeatureAccess(userId, feature.name);
    }
    
    // Return the subscription info
    return res.json({
      tier,
      features: featureAccess,
      isPro: tier === SUBSCRIPTION_TIERS.PRO.tierLevel,
      isActive: true // This will be determined by the subscription status
    });
    
  } catch (error) {
    console.error("Error fetching subscription features:", error);
    return res.status(500).json({ 
      message: "Failed to fetch subscription features", 
      error: (error as Error).message
    });
  }
});

/**
 * Get details of a specific subscription
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    const subscriptionId = parseInt(req.params.id);
    
    // Get subscription details
    const subscription = await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.id, subscriptionId),
        eq(userSubscriptions.userId, userId)
      ),
      with: {
        plan: true
      }
    });
    
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    
    return res.json(subscription);
    
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return res.status(500).json({ 
      message: "Failed to fetch subscription", 
      error: (error as Error).message
    });
  }
});

/**
 * Update a subscription (e.g. cancel it)
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    const subscriptionId = parseInt(req.params.id);
    const { status } = req.body;
    
    // Validate the status
    if (status !== "active" && status !== "cancelled") {
      return res.status(400).json({ message: "Invalid subscription status" });
    }
    
    // Check if subscription exists and belongs to the user
    const subscription = await db.query.userSubscriptions.findFirst({
      where: and(
        eq(userSubscriptions.id, subscriptionId),
        eq(userSubscriptions.userId, userId)
      )
    });
    
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    
    // Update the subscription
    const updatedSubscription = await db
      .update(userSubscriptions)
      .set({
        status: status,
      })
      .where(
        and(
          eq(userSubscriptions.id, subscriptionId),
          eq(userSubscriptions.userId, userId)
        )
      )
      .returning();
    
    return res.json(updatedSubscription[0]);
    
  } catch (error) {
    console.error("Error updating subscription:", error);
    return res.status(500).json({ 
      message: "Failed to update subscription", 
      error: (error as Error).message
    });
  }
});

export default router;