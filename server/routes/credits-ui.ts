import { Router } from "express";
import { authenticateJWT } from "../auth";
import { CreditsService } from "../services/credits";
import { getContentGenerationCost } from "../utils/content-pricing";

const router = Router();

// Get user's credit balance and display information
router.get("/balance", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get current balance
    const balance = await CreditsService.getUserCredits(userId);
    
    // Get user tier (default to lite if not set)
    const userTier = (req.user as any)?.tier || "lite";
    
    // Calculate credits per generation for this tier
    const creditsPerGeneration = getContentGenerationCost(userTier);
    
    // Calculate generations remaining
    const generationsRemaining = Math.floor(balance / creditsPerGeneration);
    
    // Get recent transactions directly from database
    const { db } = require("@db");
    const { creditTransactions } = require("@db/schema");
    const { eq, desc } = require("drizzle-orm");
    
    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(5);

    res.json({
      balance,
      tier: userTier,
      creditsPerGeneration,
      generationsRemaining,
      lastTransactions: transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.transactionType,
        amount: tx.amount,
        source: tx.source,
        createdAt: tx.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    res.status(500).json({ error: "Failed to fetch credit information" });
  }
});

// Get cost information for content generation
router.get("/cost-info", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get current balance
    const currentBalance = await CreditsService.getUserCredits(userId);
    
    // Get user tier (default to lite if not set)
    const userTier = (req.user as any)?.tier || "lite";
    
    // Calculate credits per generation for this tier
    const creditsPerGeneration = getContentGenerationCost(userTier);
    
    // Check if user can afford generation
    const canAfford = currentBalance >= creditsPerGeneration;
    
    // Calculate generations remaining
    const generationsRemaining = Math.floor(currentBalance / creditsPerGeneration);

    res.json({
      userTier,
      creditsPerGeneration,
      currentBalance,
      canAfford,
      generationsRemaining
    });
  } catch (error) {
    console.error("Error fetching cost information:", error);
    res.status(500).json({ error: "Failed to fetch cost information" });
  }
});

// Get pricing information for all tiers
router.get("/pricing", (req, res) => {
  res.json({
    tiers: {
      lite: {
        name: "Lite",
        creditsPerGeneration: getContentGenerationCost("lite"),
        description: "Standard pricing for basic users"
      },
      pro: {
        name: "Pro",
        creditsPerGeneration: getContentGenerationCost("pro"),
        description: "Discounted pricing for Pro subscribers",
        discount: "50% off"
      },
      premium: {
        name: "Premium",
        creditsPerGeneration: getContentGenerationCost("premium"),
        description: "Best pricing for Premium subscribers",
        discount: "70% off"
      }
    },
    conversionRate: "100 credits per $1 USD",
    minimumPurchase: 100
  });
});

export default router;