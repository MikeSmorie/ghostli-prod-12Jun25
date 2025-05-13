import express from "express";
import { MockPaymentGateway } from "../payment/gateway";
import { PayPalGateway } from "../payment/paypal-gateway";
import { db } from "@db";
import { clientPaymentGateways, payments, userSubscriptions, subscriptionPlans } from "@db/schema";
import { eq, and } from "drizzle-orm";

const router = express.Router();
const mockPaymentGateway = new MockPaymentGateway();
const paypalGateway = new PayPalGateway();

// Test endpoint for mock payment gateway
router.get("/test-mock", async (_req, res) => {
  try {
    await mockPaymentGateway.initialize();
    const result = await mockPaymentGateway.processPayment(10.00, "test-user");
    res.json({ message: "Mock payment test successful", result });
  } catch (error) {
    console.error("[ERROR] Mock payment test failed:", error);
    res.status(500).json({ error: "Mock payment test failed" });
  }
});

// Test endpoint for PayPal payment gateway
router.get("/test-paypal", async (_req, res) => {
  try {
    await paypalGateway.initialize();
    const result = await paypalGateway.processPayment(10.00, "test-user");
    res.json({ message: "PayPal payment test successful", result });
  } catch (error) {
    console.error("[ERROR] PayPal payment test failed:", error);
    res.status(500).json({ error: "PayPal payment test failed" });
  }
});

// Get available payment gateways for a client
router.get("/gateways/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const gateways = await db.query.clientPaymentGateways.findMany({
      where: eq(clientPaymentGateways.clientId, parseInt(clientId))
    });
    res.json(gateways);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment gateways" });
  }
});

// Get payment history for a user
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const paymentHistory = await db.query.payments.findMany({
      where: eq(payments.userId, parseInt(userId)),
      orderBy: payments.createdAt, // Order by date (most recent first)
      with: {
        subscription: {
          with: {
            plan: true
          }
        }
      }
    });
    
    res.json(paymentHistory);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

export default router;
