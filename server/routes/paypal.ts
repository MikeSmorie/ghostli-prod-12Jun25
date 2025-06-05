import express from "express";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "../paypal";
import { db } from "@db";
import { userSubscriptions, payments } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { CreditsService } from "../services/credits";
import { SubscriptionService } from "../subscription-service";
import { convertUsdToCredits } from "../utils/credits-config";

const router = express.Router();

// Set up Paypal SDK
router.get("/setup", async (req, res) => {
  await loadPaypalDefault(req, res);
});

// Create PayPal Order
router.post("/order", async (req, res) => {
  await createPaypalOrder(req, res);
});

// Capture Order (payment processing)
router.post("/order/:orderID/capture", async (req, res) => {
  const originalJson = res.json;
  let paypalResponseData: any = null;
  
  // Override res.json to capture the PayPal response before sending it
  res.json = function(body) {
    paypalResponseData = body;
    return originalJson.call(this, body);
  };
  
  try {
    // First capture the payment through PayPal
    await capturePaypalOrder(req, res);
    
    // Check if we captured the PayPal response
    if (paypalResponseData && paypalResponseData.status === 'COMPLETED') {
      const userId = req.user?.id;
      
      if (userId) {
        // Extract payment amount from PayPal response
        const purchaseUnits = paypalResponseData.purchase_units;
        if (purchaseUnits && purchaseUnits.length > 0) {
          const captureAmount = purchaseUnits[0].payments?.captures?.[0]?.amount?.value;
          
          if (captureAmount) {
            const usdAmount = parseFloat(captureAmount);
            const creditsToAdd = convertUsdToCredits(usdAmount);
            
            // Add credits to user account
            const creditsResult = await CreditsService.addCredits(
              userId,
              creditsToAdd,
              "PayPal",
              "PURCHASE",
              paypalResponseData.id
            );
            
            // Automatically upgrade user to PRO tier when they purchase credits
            await SubscriptionService.upgradeToPro(userId);
            
            // Log first purchase event for launch monitoring
            const { LaunchMonitoring } = await import('../utils/launch-monitoring');
            LaunchMonitoring.firstPurchase(userId, usdAmount, creditsToAdd);
            
            console.log(`PayPal payment completed: Added ${creditsToAdd} credits to user ${userId} and upgraded to PRO`);
          }
        }
        
        // Find the most recent pending subscription for this user
        const pendingSubscriptions = await db
          .select()
          .from(userSubscriptions)
          .where(and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, "pending")
          ))
          .orderBy(userSubscriptions.id)
          .limit(1);
          
        const subscription = pendingSubscriptions[0];
        
        if (subscription) {
          // Update subscription status to active
          await db.update(userSubscriptions)
            .set({ 
              status: "active",
              // Determine end date based on plan interval (typically 1 month or 1 year from now)
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days
            })
            .where(eq(userSubscriptions.id, subscription.id));
          
          // Find the pending payment associated with this subscription
          const pendingPayments = await db
            .select()
            .from(payments)
            .where(and(
              eq(payments.subscriptionId, subscription.id),
              eq(payments.status, "pending")
            ))
            .limit(1);
            
          const payment = pendingPayments[0];
          
          if (payment) {
            // Update payment status to completed
            await db.update(payments)
              .set({ 
                status: "completed",
                paymentIntentId: paypalResponseData.id
              })
              .where(eq(payments.id, payment.id));
          }
        }
      }
    }
  } catch (error) {
    console.error("Error capturing PayPal payment:", error);
    // The PayPal capture function handles the response, so we don't need to send one here
  }
});

export default router;