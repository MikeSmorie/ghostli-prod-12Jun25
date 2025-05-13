import express from "express";
import { db } from "@db";
import { 
  users, 
  userSubscriptions, 
  subscriptionPlans, 
  adminAnnouncements,
  announcementRecipients
} from "@db/schema";
import { eq, and, lt, gt } from "drizzle-orm";
import { SubscriptionLifecycleService } from "../services/subscriptionLifecycle";
import { authenticateJWT, requireRole } from "../auth";

const router = express.Router();

// Initialize subscription lifecycle service
let lifecycleService: SubscriptionLifecycleService | null = null;

// Initialize the service on the first request
const getLifecycleService = async () => {
  if (!lifecycleService) {
    lifecycleService = await SubscriptionLifecycleService.initialize();
  }
  return lifecycleService;
};

// Middleware to ensure service is initialized
const ensureServiceInitialized = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await getLifecycleService();
    next();
  } catch (error) {
    console.error("Failed to initialize subscription lifecycle service:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all notifications for the current user
router.get("/notifications", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get all announcement recipients for this user
    const notifications = await db.query.announcementRecipients.findMany({
      where: eq(announcementRecipients.userId, userId),
      with: {
        announcement: {
          with: {
            sender: true
          }
        }
      },
      orderBy: (recipients, { desc }) => [desc(recipients.id)]
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark a notification as read
router.post(
  "/notifications/:id/read",
  authenticateJWT,
  async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Update the notification
      await db
        .update(announcementRecipients)
        .set({
          read: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(announcementRecipients.id, notificationId),
            eq(announcementRecipients.userId, userId)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }
);

// Trigger a subscription welcome message
router.post(
  "/subscription/:id/welcome",
  authenticateJWT,
  ensureServiceInitialized,
  async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const userId = req.user!.id;

      const service = await getLifecycleService();
      const success = await service.processNewSubscription(userId, subscriptionId);

      if (success) {
        res.json({ success: true, message: "Welcome message sent" });
      } else {
        res.status(500).json({ error: "Failed to send welcome message" });
      }
    } catch (error) {
      console.error("Error sending welcome message:", error);
      res.status(500).json({ error: "Failed to send welcome message" });
    }
  }
);

// Trigger an upgrade reminder for the current user
router.post(
  "/subscription/upgrade-reminder",
  authenticateJWT,
  ensureServiceInitialized,
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { featureTriggered } = req.body;

      if (!featureTriggered) {
        return res.status(400).json({ error: "featureTriggered is required" });
      }

      const service = await getLifecycleService();
      const success = await service.sendUpgradeReminder(userId, featureTriggered);

      if (success) {
        res.json({ success: true, message: "Upgrade reminder sent" });
      } else {
        res.status(500).json({ error: "Failed to send upgrade reminder" });
      }
    } catch (error) {
      console.error("Error sending upgrade reminder:", error);
      res.status(500).json({ error: "Failed to send upgrade reminder" });
    }
  }
);

// Process all expiring subscriptions (admin only)
router.post(
  "/subscription/process-expirations",
  authenticateJWT,
  requireRole("admin"),
  ensureServiceInitialized,
  async (req, res) => {
    try {
      const service = await getLifecycleService();
      const result = await service.processExpiringSubscriptions();

      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error("Error processing expiring subscriptions:", error);
      res.status(500).json({ error: "Failed to process expiring subscriptions" });
    }
  }
);

export default router;