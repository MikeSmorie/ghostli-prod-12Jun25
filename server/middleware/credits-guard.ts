import { Request, Response, NextFunction } from "express";
import { CreditsService } from "../services/credits";
import { getContentGenerationCost, getFeatureCost } from "../utils/content-pricing";
import { SubscriptionService } from "../subscription-service";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

// Extend Request interface to include credit cost information
declare global {
  namespace Express {
    interface Request {
      creditCost?: number;
      userTier?: string;
    }
  }
}

// Middleware to check and consume credits for content generation
export const requireCredits = (operation: string = "content_generation") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      // Check if user is credit exempt first
      const userRecord = await db
        .select({
          creditExempt: users.creditExempt,
          tier: users.role
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userRecord.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      const user = userRecord[0];
      
      // If user is credit exempt, skip all credit checks
      if (user.creditExempt) {
        req.creditCost = 0; // Set to 0 so no credits are consumed
        req.userTier = user.tier || "lite";
        return next(); // Skip credit checks and proceed
      }

      // Determine user tier (from subscription or default to lite)
      const userTier = user.tier || "lite";
      req.userTier = userTier;

      // Calculate credit cost based on operation and tier
      let creditCost: number;
      
      if (operation === "content_generation") {
        creditCost = getContentGenerationCost(userTier);
      } else {
        creditCost = getFeatureCost(operation);
      }

      // Allow override from request body for bulk operations
      if (req.body.quantity && typeof req.body.quantity === "number") {
        creditCost = creditCost * req.body.quantity;
      }

      req.creditCost = creditCost;

      // Check if user has enough credits
      const canAfford = await CreditsService.canAfford(userId, creditCost);
      
      if (!canAfford) {
        const currentBalance = await CreditsService.getUserCredits(userId);
        
        return res.status(402).json({
          success: false,
          error: "Insufficient credits",
          message: "Please top up your Ghostli Credits to continue.",
          code: "INSUFFICIENT_CREDITS",
          required: creditCost,
          current: currentBalance,
          shortfall: creditCost - currentBalance
        });
      }

      // If credits are sufficient, proceed to next middleware
      next();
    } catch (error) {
      console.error("Credit guard error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify credits",
        code: "CREDIT_CHECK_FAILED"
      });
    }
  };
};

// Middleware to consume credits after successful operation
export const consumeCredits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const creditCost = req.creditCost;
    const userTier = req.userTier || "lite";

    if (!userId || !creditCost || creditCost === 0) {
      return next(); // Skip if no user, no cost defined, or user is credit exempt (cost = 0)
    }

    // Consume the credits
    const result = await CreditsService.consumeCredits(
      userId,
      creditCost,
      `Content Generation (${userTier} tier)`
    );

    if (!result.success) {
      return res.status(402).json({
        success: false,
        error: result.message || "Failed to consume credits",
        code: "CREDIT_CONSUMPTION_FAILED",
        currentBalance: result.newBalance
      });
    }

    // Add credit info to response
    res.locals.creditInfo = {
      consumed: creditCost,
      remaining: result.newBalance,
      tier: userTier
    };

    next();
  } catch (error) {
    console.error("Credit consumption error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to consume credits",
      code: "CREDIT_CONSUMPTION_ERROR"
    });
  }
};

// Helper middleware to add credit cost info to response
export const addCreditInfoToResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    if (res.locals.creditInfo) {
      body.creditInfo = res.locals.creditInfo;
    }
    return originalJson.call(this, body);
  };
  
  next();
};