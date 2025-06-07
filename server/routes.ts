import type { Express } from "express";
import { createServer } from "http";
import { setupAuth, authenticateJWT } from "./auth";
import cors from "cors";
import express from "express";
import subscriptionRoutes from "./routes/subscription";
import webhookRoutes from "./routes/webhook";
import aiRoutes from "./routes/ai";
import { registerFeatureRoutes } from "./routes/features";
import { registerContentRoutes } from "./routes/content";
import { registerCloneMeRoutes } from "./routes/cloneMe";
import messagesRoutes from "./routes/announcements";
import adminLogsRoutes from "./routes/admin-logs";
import paymentRoutes from "./routes/payment";
import subscriptionNotificationsRoutes from "./routes/subscriptionNotifications";
import { registerSupergodRoutes } from "./routes/supergod";
import superAdminRoutes from "./routes/super-admin";
import { logError } from "./utils/logger";
import { requireRole, requireSupergod } from "./middleware/rbac";
import { SubscriptionService } from "./subscription-service";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import paypalRoutes from "./routes/paypal";
import cryptoRoutes from "./routes/crypto";
import creditsRoutes from "./routes/credits";
import creditsTestRoutes from "./routes/credits-test";
import creditsConsumptionTestRoutes from "./routes/credits-consumption-test";
import creditsUIRoutes from "./routes/credits-ui";
import supergodCreditsRoutes from "./routes/supergod-credits";
import aiDetectionRoutes from "./routes/ai-detection";
import systemHealthRoutes from "./routes/system-health";
import paymentTestRoutes from "./routes/payment-test";
import directPurchaseRoutes from "./routes/direct-purchase";

// Simple auth checks
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not authenticated" });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user.role === "admin") return next();
  res.status(403).json({ message: "Not authorized" });
};

// Subscription tier middleware
const requireProTier = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const tier = await SubscriptionService.getUserTier(req.user.id);
  if (tier === "PRO" || req.user.creditExempt) {
    return next();
  }
  
  res.status(403).json({ 
    message: "Pro subscription required", 
    tier: "FREE",
    upgradeRequired: true 
  });
};

const requireFeatureAccess = (feature: string) => async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user.creditExempt) {
    return next();
  }
  
  const hasAccess = await SubscriptionService.checkFeatureAccess(req.user.id, feature as any);
  if (hasAccess) {
    return next();
  }
  
  res.status(403).json({ 
    message: `${feature} requires Pro subscription`, 
    feature,
    upgradeRequired: true 
  });
};

// Global error handler
const errorHandler = async (err: any, req: any, res: any, next: any) => {
  await logError(
    "ERROR",
    err.message,
    `${req.method} ${req.path}`,
    err.stack
  );

  res.status(500).json({
    message: "An unexpected error occurred",
    error: process.env.NODE_ENV === "production" ? undefined : err.message
  });
};

export function registerRoutes(app: Express) {
  // Basic CORS setup
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    credentials: true
  }));

  // Form data parser
  app.use(express.urlencoded({ 
    extended: true,
    limit: '50mb'
  }));

  // Setup auth
  setupAuth(app);

  // Register routes
  app.use("/api/subscription", subscriptionRoutes);
  app.use("/api/webhook", webhookRoutes);
  app.use("/api/ai", aiRoutes);

  // Register feature routes
  registerFeatureRoutes(app);
  
  // Register content generation routes
  registerContentRoutes(app);
  
  // Register Clone Me feature routes
  registerCloneMeRoutes(app);

  app.use("/api/messages", messagesRoutes);
  app.use("/api/admin", requireAdmin, adminLogsRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/subscription-notification", subscriptionNotificationsRoutes);
  
  // PayPal direct routes for live testing
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/capture/:orderID", authenticateJWT, async (req, res) => {
    await capturePaypalOrder(req, res);
  });
  
  // PayPal integration routes
  app.use("/paypal", paypalRoutes);
  
  // Crypto payment integration routes
  app.use("/api/crypto", cryptoRoutes);
  
  // Credits system routes
  app.use("/api/credits", creditsRoutes);
  app.use("/api/credits-test", creditsTestRoutes);
  app.use("/api/credits-consumption-test", creditsConsumptionTestRoutes);
  app.use("/api/credits", creditsUIRoutes);
  
  // Supergod credits management routes
  app.use("/api/supergod/credits", supergodCreditsRoutes);
  
  // AI Detection Shield routes
  app.use("/api/ai-detection", aiDetectionRoutes);
  
  // Launch metrics endpoint for monitoring
  app.get("/api/supergod/launch-metrics", requireSupergod, async (req: any, res: any) => {
    try {
      const { LaunchMonitoring } = await import('./utils/launch-monitoring');
      const metrics = await LaunchMonitoring.getMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error("Launch metrics error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve metrics",
        message: error.message 
      });
    }
  });

  // Register supergod-only routes
  registerSupergodRoutes(app); // These routes have their own middleware checks
  
  // Register super admin routes for God Mode
  app.use("/api/super-admin", superAdminRoutes);

  // Subscription tier API routes
  app.get("/api/user/tier", requireAuth, async (req: any, res: any) => {
    try {
      const tier = await SubscriptionService.getUserTier(req.user.id);
      const limits = SubscriptionService.getTierLimits(tier);
      
      res.json({
        tier,
        limits,
        user: {
          id: req.user.id,
          username: req.user.username,
          credits: req.user.credits,
          creditExempt: req.user.creditExempt
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get tier info", error: error.message });
    }
  });

  // Auto-upgrade tier when credits are purchased
  app.post("/api/user/upgrade-tier", requireAuth, async (req: any, res: any) => {
    try {
      await SubscriptionService.autoUpgradeIfEligible(req.user.id);
      const newTier = await SubscriptionService.getUserTier(req.user.id);
      
      res.json({
        success: true,
        tier: newTier,
        message: newTier === "PRO" ? "Upgraded to Pro!" : "No upgrade needed"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to upgrade tier", error: error.message });
    }
  });

  // System health and monitoring routes for production
  app.use("/api/system", systemHealthRoutes);
  
  // Payment testing routes for development
  app.use("/api/payment-test", paymentTestRoutes);
  
  // Direct purchase routes
  app.use("/api/direct-purchase", directPurchaseRoutes);
  
  // Simple direct purchase endpoint for testing
  app.post("/api/purchase-credits", authenticateJWT, async (req: any, res: any) => {
    try {
      console.log("[PURCHASE-CREDITS] Request received:", req.body);
      console.log("[PURCHASE-CREDITS] User:", req.user);
      
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

      // Import db and users here to avoid module issues
      const { db } = await import("../db/index.js");
      const { users } = await import("../db/schema.js");
      const { eq } = await import("drizzle-orm");

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

      console.log(`[PURCHASE-CREDITS] User ${userId} purchased ${creditAmount} credits for $${amount}`);

      res.json({
        success: true,
        message: "Purchase completed successfully",
        creditsAdded: creditAmount,
        newBalance: newCreditBalance,
        amountPaid: amount
      });

    } catch (error) {
      console.error("Purchase credits error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Purchase processing failed" 
      });
    }
  });

  // Error handler must be last
  app.use(errorHandler);

  return createServer(app);
}