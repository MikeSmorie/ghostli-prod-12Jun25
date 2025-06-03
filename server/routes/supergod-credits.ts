import express from "express";
import { db } from "@db";
import { users, creditTransactions, globalSettings } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSupergod } from "../middleware/rbac";
import { CreditsService } from "../services/credits";

const router = express.Router();

// Apply supergod middleware to all routes
router.use(requireSupergod);

// Get all users with credit information
router.get("/users", async (req, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        credits: users.credits,
        creditExempt: users.creditExempt,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users for credits management:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Toggle credit exemption for a user
router.put("/users/:userId/exemption", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { creditExempt } = req.body;

    if (typeof creditExempt !== "boolean") {
      return res.status(400).json({ error: "creditExempt must be a boolean" });
    }

    const updatedUser = await db
      .update(users)
      .set({ creditExempt })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log the action
    await db.insert(creditTransactions).values({
      userId,
      transactionType: "ADJUSTMENT",
      amount: 0, // No credit change, just exemption toggle
      source: "MANUAL",
      txId: `exemption_${creditExempt ? 'enabled' : 'disabled'}_${Date.now()}`
    });

    res.json({
      success: true,
      message: `Credit exemption ${creditExempt ? 'enabled' : 'disabled'} for user`,
      user: updatedUser[0]
    });
  } catch (error) {
    console.error("Error updating credit exemption:", error);
    res.status(500).json({ error: "Failed to update credit exemption" });
  }
});

// Add credits manually to a user
router.post("/users/:userId/add", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    // Use CreditsService to add credits with proper transaction logging
    const result = await CreditsService.addCredits(
      userId,
      amount,
      "MANUAL",
      "ADJUSTMENT",
      `manual_add_${Date.now()}`
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully added ${amount} credits`,
        creditsAdded: amount,
        newBalance: result.newBalance
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to add credits"
      });
    }
  } catch (error) {
    console.error("Error adding credits manually:", error);
    res.status(500).json({ error: "Failed to add credits" });
  }
});

// Get global settings
router.get("/settings", async (req, res) => {
  try {
    const settings = await db
      .select()
      .from(globalSettings)
      .orderBy(globalSettings.settingKey);

    res.json(settings);
  } catch (error) {
    console.error("Error fetching global settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Update default first-time credits setting
router.put("/settings/default-credits", async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== "number" || amount < 0) {
      return res.status(400).json({ error: "Amount must be a non-negative number" });
    }

    // Update or insert the default credits setting
    const result = await db
      .insert(globalSettings)
      .values({
        settingKey: "default_first_time_credits",
        settingValue: amount.toString(),
        description: "Default credits given to new users upon registration",
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: globalSettings.settingKey,
        set: {
          settingValue: amount.toString(),
          updatedAt: new Date()
        }
      })
      .returning();

    res.json({
      success: true,
      message: `Default first-time credits updated to ${amount}`,
      setting: result[0]
    });
  } catch (error) {
    console.error("Error updating default credits setting:", error);
    res.status(500).json({ error: "Failed to update default credits setting" });
  }
});

// Get credit transaction history for a specific user
router.get("/users/:userId/transactions", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 20;

    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit);

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;