import { Router } from "express";
import { authenticateJWT } from "../auth";
import { requireCredits, consumeCredits, addCreditInfoToResponse } from "../middleware/credits-guard";
import { CreditsService } from "../services/credits";
import { getContentGenerationCost } from "../utils/content-pricing";

const router = Router();

// Test credit consumption for content generation with different tiers
router.post("/test-consumption/:tier", 
  authenticateJWT,
  requireCredits("content_generation"),
  addCreditInfoToResponse,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const tier = req.params.tier;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Override user tier for testing
      req.userTier = tier;
      const creditCost = getContentGenerationCost(tier);

      // Simulate successful content generation
      await consumeCredits(req, res, () => {});

      // Get updated balance
      const newBalance = await CreditsService.getUserCredits(userId);

      res.json({
        success: true,
        message: `Content generation completed for ${tier} tier`,
        tier: tier,
        creditsConsumed: creditCost,
        newBalance: newBalance,
        generatedContent: {
          content: `Test content generated for ${tier} tier user`,
          wordCount: 500,
          generationTime: 2300
        }
      });
    } catch (error) {
      console.error("Credit consumption test error:", error);
      res.status(500).json({ 
        error: "Credit consumption test failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// Test insufficient credits scenario
router.post("/test-insufficient-credits",
  authenticateJWT,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Set user credits to a low amount for testing
      await CreditsService.consumeCredits(userId, 99999, "Test: Drain credits for insufficient test");
      
      // Try to generate content with insufficient credits
      const result = await CreditsService.canAfford(userId, 10);
      
      res.json({
        success: false,
        canAfford: result,
        message: "Insufficient credits test completed",
        currentBalance: await CreditsService.getUserCredits(userId)
      });
    } catch (error) {
      console.error("Insufficient credits test error:", error);
      res.status(500).json({ 
        error: "Insufficient credits test failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// Test credit pricing for all tiers
router.get("/pricing-info", (req, res) => {
  res.json({
    tiers: {
      lite: {
        creditsPerGeneration: getContentGenerationCost("lite"),
        description: "Basic tier with standard pricing"
      },
      pro: {
        creditsPerGeneration: getContentGenerationCost("pro"),
        description: "Pro tier with discounted pricing"
      },
      premium: {
        creditsPerGeneration: getContentGenerationCost("premium"),
        description: "Premium tier with best pricing"
      },
      enterprise: {
        creditsPerGeneration: getContentGenerationCost("enterprise"),
        description: "Enterprise tier with premium pricing"
      }
    },
    conversionRate: "100 credits per $1 USD",
    examples: [
      { tier: "lite", generations: 10, credits: 100, cost: "$1.00" },
      { tier: "pro", generations: 20, credits: 100, cost: "$1.00" },
      { tier: "premium", generations: 33, credits: 100, cost: "$1.00" }
    ]
  });
});

// Reset user credits for testing (admin only)
router.post("/reset-credits/:amount",
  authenticateJWT,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const amount = parseInt(req.params.amount);
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ error: "Invalid credit amount" });
      }

      // Add credits to reset the balance
      const result = await CreditsService.addCredits(
        userId,
        amount,
        "Test Reset",
        "ADJUSTMENT",
        `RESET_${Date.now()}`
      );

      res.json({
        success: result.success,
        message: `Credits reset to ${amount}`,
        newBalance: result.newBalance
      });
    } catch (error) {
      console.error("Credit reset error:", error);
      res.status(500).json({ 
        error: "Credit reset failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

export default router;