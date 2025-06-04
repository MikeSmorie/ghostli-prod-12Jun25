import { Router } from "express";
import { CreditsService } from "../services/credits";
import { authenticateJWT } from "../auth";
import { getContentGenerationCost } from "../utils/content-pricing";
import { z } from "zod";

const router = Router();

// Get user's current credit balance
router.get("/balance", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const credits = await CreditsService.getUserCredits(userId);
    res.json({ credits });
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    res.status(500).json({ error: "Failed to fetch credit balance" });
  }
});

// Get user's credit transaction history
router.get("/history", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { limit = "50", offset = "0" } = req.query;
    const transactions = await CreditsService.getCreditHistory(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({ transactions });
  } catch (error) {
    console.error("Error fetching credit history:", error);
    res.status(500).json({ error: "Failed to fetch credit history" });
  }
});

// Purchase credits (to be integrated with payment systems)
const purchaseSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(["PayPal", "Bitcoin", "Stripe"]),
  transactionId: z.string().optional(),
});

router.post("/purchase", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const validation = purchaseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request data",
        details: validation.error.flatten()
      });
    }

    const { amount, paymentMethod, transactionId } = validation.data;

    // Add credits to user account
    const result = await CreditsService.addCredits(
      userId,
      amount,
      paymentMethod,
      "PURCHASE",
      transactionId
    );

    if (result.success) {
      res.json({
        success: true,
        newBalance: result.newBalance,
        message: `Successfully added ${amount} credits`
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to add credits"
      });
    }
  } catch (error) {
    console.error("Error purchasing credits:", error);
    res.status(500).json({ error: "Failed to process credit purchase" });
  }
});

// Consume credits (for content generation, etc.)
const consumeSchema = z.object({
  amount: z.number().positive(),
  operation: z.string().optional(),
});

router.post("/consume", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const validation = consumeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request data",
        details: validation.error.flatten()
      });
    }

    const { amount, operation = "Content Generation" } = validation.data;

    const result = await CreditsService.consumeCredits(
      userId,
      amount,
      operation
    );

    if (result.success) {
      res.json({
        success: true,
        newBalance: result.newBalance,
        message: `Successfully consumed ${amount} credits`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message || "Failed to consume credits",
        currentBalance: result.newBalance
      });
    }
  } catch (error) {
    console.error("Error consuming credits:", error);
    res.status(500).json({ error: "Failed to consume credits" });
  }
});

// Check if user can afford an operation
router.post("/check-affordability", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { cost } = req.body;
    if (typeof cost !== "number" || cost <= 0) {
      return res.status(400).json({ error: "Invalid cost amount" });
    }

    const canAfford = await CreditsService.canAfford(userId, cost);
    const currentBalance = await CreditsService.getUserCredits(userId);

    res.json({
      canAfford,
      currentBalance,
      cost,
      shortfall: canAfford ? 0 : cost - currentBalance
    });
  } catch (error) {
    console.error("Error checking affordability:", error);
    res.status(500).json({ error: "Failed to check affordability" });
  }
});

// Admin routes for credit management
const adjustCreditsSchema = z.object({
  userId: z.number().positive(),
  amount: z.number(),
  reason: z.string().min(1),
});

router.post("/admin/adjust", authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin" && req.user?.role !== "supergod") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const validation = adjustCreditsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request data",
        details: validation.error.flatten()
      });
    }

    const { userId, amount, reason } = validation.data;
    const adminId = req.user?.id!;

    const result = await CreditsService.adjustCredits(
      userId,
      amount,
      reason,
      adminId
    );

    if (result.success) {
      res.json({
        success: true,
        newBalance: result.newBalance,
        message: `Successfully adjusted credits by ${amount}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to adjust credits"
      });
    }
  } catch (error) {
    console.error("Error adjusting credits:", error);
    res.status(500).json({ error: "Failed to adjust credits" });
  }
});

// Admin route to get credit statistics
router.get("/admin/stats", authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin" && req.user?.role !== "supergod") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const stats = await CreditsService.getCreditStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching credit stats:", error);
    res.status(500).json({ error: "Failed to fetch credit statistics" });
  }
});

export default router;