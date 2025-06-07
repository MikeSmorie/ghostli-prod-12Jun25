import express from "express";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateJWT } from "../auth.js";

const router = express.Router();

// Direct credit purchase endpoint
router.post("/purchase", authenticateJWT, async (req, res) => {
  try {
    console.log("[DIRECT-PURCHASE] Request received:", req.body);
    console.log("[DIRECT-PURCHASE] User from JWT:", req.user);
    
    const { amount, creditAmount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    if (!amount || !creditAmount || amount <= 0 || creditAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid amount or credit amount" 
      });
    }

    // Get current user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Calculate new credit balance
    const newCreditBalance = user.credits + creditAmount;

    // Update user credits
    await db
      .update(users)
      .set({ 
        credits: newCreditBalance,
        lastLogin: new Date()
      })
      .where(eq(users.id, userId));

    console.log(`[PURCHASE] User ${userId} purchased ${creditAmount} credits for $${amount}`);

    res.json({
      success: true,
      message: "Purchase completed successfully",
      creditsAdded: creditAmount,
      newBalance: newCreditBalance,
      amountPaid: amount
    });

  } catch (error) {
    console.error("Direct purchase error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Purchase processing failed" 
    });
  }
});

export default router;