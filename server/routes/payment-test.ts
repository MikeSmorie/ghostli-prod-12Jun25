import express from 'express';
import { authenticateJWT } from '../auth';
import { CreditsService } from '../services/credits';
import { convertUsdToCredits } from '../utils/credits-config';

const router = express.Router();

// Test payment completion for development/testing
router.post('/test-complete', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { amount, paymentMethod = 'TEST' } = req.body;
    const usdAmount = parseFloat(amount) || 5.00;
    const creditsToAdd = convertUsdToCredits(usdAmount);
    
    // Simulate successful payment
    const mockTransactionId = `TEST_${Date.now()}`;
    
    const result = await CreditsService.addCredits(
      userId,
      creditsToAdd,
      paymentMethod,
      "PURCHASE",
      mockTransactionId
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Test payment completed: Added ${creditsToAdd} credits for $${usdAmount}`,
        creditsAdded: creditsToAdd,
        usdAmount,
        newBalance: result.newBalance,
        transactionId: mockTransactionId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to add credits'
      });
    }
  } catch (error) {
    console.error('Error processing test payment:', error);
    res.status(500).json({ error: 'Failed to process test payment' });
  }
});

export default router;