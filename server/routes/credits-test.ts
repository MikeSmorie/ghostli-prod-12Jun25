import { Router } from "express";
import { CreditsService } from "../services/credits";
import { authenticateJWT } from "../auth";
import { convertUsdToCredits } from "../utils/credits-config";

const router = Router();

// Test PayPal credit flow
router.post("/test-paypal", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { amount } = req.body;
    const usdAmount = parseFloat(amount) || 10.00; // Default to $10 for testing
    const creditsToAdd = convertUsdToCredits(usdAmount);
    
    // Simulate PayPal payment completion
    const mockPayPalTransactionId = `PAYPAL_TEST_${Date.now()}`;
    
    const result = await CreditsService.addCredits(
      userId,
      creditsToAdd,
      "PayPal",
      "PURCHASE",
      mockPayPalTransactionId
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Test PayPal payment completed: Added ${creditsToAdd} credits for $${usdAmount}`,
        creditsAdded: creditsToAdd,
        usdAmount,
        newBalance: result.newBalance,
        transactionId: mockPayPalTransactionId
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to add credits"
      });
    }
  } catch (error) {
    console.error("Error testing PayPal credit flow:", error);
    res.status(500).json({ error: "Failed to test PayPal credit flow" });
  }
});

// Test Bitcoin credit flow
router.post("/test-bitcoin", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { amount } = req.body;
    const usdAmount = parseFloat(amount) || 25.00; // Default to $25 for testing
    const creditsToAdd = convertUsdToCredits(usdAmount);
    
    // Simulate Bitcoin transaction confirmation
    const mockBitcoinTxHash = `btc_test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const result = await CreditsService.addCredits(
      userId,
      creditsToAdd,
      "Bitcoin",
      "PURCHASE",
      mockBitcoinTxHash
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Test Bitcoin payment confirmed: Added ${creditsToAdd} credits for $${usdAmount}`,
        creditsAdded: creditsToAdd,
        usdAmount,
        newBalance: result.newBalance,
        transactionHash: mockBitcoinTxHash
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to add credits"
      });
    }
  } catch (error) {
    console.error("Error testing Bitcoin credit flow:", error);
    res.status(500).json({ error: "Failed to test Bitcoin credit flow" });
  }
});

// Test credit consumption flow
router.post("/test-consume", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { amount = 50 } = req.body; // Default to 50 credits
    
    const result = await CreditsService.consumeCredits(
      userId,
      amount,
      "Test Content Generation"
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Test credit consumption: Used ${amount} credits`,
        creditsUsed: amount,
        newBalance: result.newBalance
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message || "Failed to consume credits",
        currentBalance: result.newBalance
      });
    }
  } catch (error) {
    console.error("Error testing credit consumption:", error);
    res.status(500).json({ error: "Failed to test credit consumption" });
  }
});

// Get conversion rates and configuration
router.get("/conversion-info", (req, res) => {
  res.json({
    creditsPerDollar: 100,
    examples: [
      { usd: 1, credits: 100 },
      { usd: 5, credits: 500 },
      { usd: 10, credits: 1000 },
      { usd: 25, credits: 2500 },
      { usd: 50, credits: 5000 },
      { usd: 100, credits: 10000 }
    ],
    paymentMethods: ["PayPal", "Bitcoin", "Solana", "USDT"],
    minimumPurchase: { usd: 1.00, credits: 100 }
  });
});

export default router;