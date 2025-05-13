/**
 * API routes for cryptocurrency payment functionality
 */
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../auth';
import { cryptoTypeEnum, CryptoType, cryptoWallets, users, cryptoTransactions, payments } from '@db/schema';
import { 
  setupCryptoWalletsForUser,
  createCryptoPaymentRequest,
  verifyCryptoPayment,
  getCryptoPaymentInfo,
  getPendingCryptoPaymentForUser
} from '../services/crypto/cryptoPaymentService';
import { 
  getWalletsForUser, 
  getWalletById,
  getWalletByCryptoType,
  getTransactionsForUser,
  getTransactionById
} from '../services/crypto/walletService';
import { updateExchangeRates } from '../services/crypto/walletService';
import { z } from 'zod';
import { db } from '@db';
import { eq, and, desc } from 'drizzle-orm';
import { isTransactionConfirmed } from '../services/crypto/blockchainService';
import { 
  sendCryptoPaymentConfirmation, 
  sendCryptoPaymentFailure 
} from '../services/emailService';
import { SubscriptionNotificationService } from '../services/subscriptionNotifications';
import crypto from 'crypto';

const router = Router();

// Middleware to validate crypto type
const validateCryptoType = (req: Request, res: Response, next: Function) => {
  const { cryptoType } = req.params;
  
  if (!cryptoTypeEnum.safeParse(cryptoType).success) {
    return res.status(400).json({
      success: false,
      error: `Invalid crypto type. Must be one of: ${Object.values(cryptoTypeEnum.enum).join(', ')}`
    });
  }
  
  next();
};

// Get all wallets for the authenticated user
router.get('/wallets', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const wallets = await getWalletsForUser(userId);
    
    res.json({
      success: true,
      wallets: wallets.map(wallet => ({
        id: wallet.id,
        cryptoType: wallet.cryptoType,
        walletAddress: wallet.walletAddress,
        balance: wallet.balance,
        isActive: wallet.isActive,
        lastChecked: wallet.lastChecked
      }))
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallets'
    });
  }
});

// Get a specific wallet by ID
router.get('/wallets/:walletId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const walletId = parseInt(req.params.walletId);
    
    if (isNaN(walletId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet ID'
      });
    }
    
    const wallet = await getWalletById(walletId, userId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }
    
    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        cryptoType: wallet.cryptoType,
        walletAddress: wallet.walletAddress,
        balance: wallet.balance,
        isActive: wallet.isActive,
        lastChecked: wallet.lastChecked
      }
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet'
    });
  }
});

// Get a wallet by crypto type
router.get('/wallets/type/:cryptoType', authenticateJWT, validateCryptoType, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const cryptoType = req.params.cryptoType as CryptoType;
    
    const wallet = await getWalletByCryptoType(userId, cryptoType);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }
    
    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        cryptoType: wallet.cryptoType,
        walletAddress: wallet.walletAddress,
        balance: wallet.balance,
        isActive: wallet.isActive,
        lastChecked: wallet.lastChecked
      }
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet'
    });
  }
});

// Setup wallets for user (creates wallets for all supported crypto types)
router.post('/wallets/setup', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const wallets = await setupCryptoWalletsForUser(userId);
    
    res.json({
      success: true,
      message: 'Crypto wallets setup complete',
      wallets: wallets.map(wallet => ({
        id: wallet.id,
        cryptoType: wallet.cryptoType,
        walletAddress: wallet.walletAddress,
        isActive: wallet.isActive
      }))
    });
  } catch (error) {
    console.error('Error setting up wallets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup crypto wallets'
    });
  }
});

// Create a payment request for a subscription
router.post('/payment/request', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const paymentRequestSchema = z.object({
      planId: z.number().int().positive(),
      cryptoType: cryptoTypeEnum
    });
    
    const result = paymentRequestSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: result.error.errors
      });
    }
    
    const userId = req.user!.id;
    const { planId, cryptoType } = result.data;
    
    const paymentInfo = await createCryptoPaymentRequest(userId, planId, cryptoType);
    
    res.json({
      success: true,
      paymentInfo: {
        walletAddress: paymentInfo.wallet.walletAddress,
        cryptoType: paymentInfo.wallet.cryptoType,
        amountCrypto: paymentInfo.amountCrypto,
        amountUsd: paymentInfo.amountUsd,
        expiresAt: paymentInfo.expiresAt,
        referenceId: paymentInfo.referenceId
      }
    });
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment request',
      message: error.message
    });
  }
});

// Verify a crypto payment
router.post('/payment/verify', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const verifyPaymentSchema = z.object({
      transactionHash: z.string().min(1),
      cryptoType: cryptoTypeEnum,
      walletId: z.number().int().positive()
    });
    
    const result = verifyPaymentSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification data',
        details: result.error.errors
      });
    }
    
    const userId = req.user!.id;
    const { transactionHash, cryptoType, walletId } = result.data;
    
    const verificationResult = await verifyCryptoPayment(
      userId,
      transactionHash,
      cryptoType,
      walletId
    );
    
    res.json({
      success: verificationResult.verified,
      ...verificationResult
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get transactions for the authenticated user
router.get('/transactions', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const transactions = await getTransactionsForUser(userId, limit, offset);
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// Get a specific transaction by ID
router.get('/transactions/:transactionId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const transactionId = parseInt(req.params.transactionId);
    
    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID'
      });
    }
    
    const transaction = await getTransactionById(transactionId, userId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction'
    });
  }
});

// Get pending payment for user
router.get('/payment/pending', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const pendingPayment = await getPendingCryptoPaymentForUser(userId);
    
    if (!pendingPayment) {
      return res.json({
        success: true,
        hasPendingPayment: false
      });
    }
    
    res.json({
      success: true,
      hasPendingPayment: true,
      payment: pendingPayment
    });
  } catch (error) {
    console.error('Error fetching pending payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending payment'
    });
  }
});

// Update exchange rates (admin only)
router.post('/exchange-rates/update', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. Admin access required.'
      });
    }
    
    const rates = await updateExchangeRates();
    
    res.json({
      success: true,
      message: 'Exchange rates updated',
      rates
    });
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update exchange rates'
    });
  }
});

// Webhook endpoint for cryptocurrency payment notifications
// This endpoint receives notifications from payment gateways or blockchain monitoring services
router.post('/webhook/payment-notification', async (req: Request, res: Response) => {
  try {
    // Add a secret key to prevent unauthorized access to this endpoint
    const webhookSecret = process.env.CRYPTO_WEBHOOK_SECRET;
    const providedSecret = req.headers['x-webhook-secret'];
    
    if (webhookSecret && providedSecret !== webhookSecret) {
      console.error('Invalid webhook secret provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const webhookSchema = z.object({
      transactionHash: z.string().min(1),
      cryptoType: cryptoTypeEnum,
      walletAddress: z.string().min(1),
      amount: z.string().min(1),
      blockHeight: z.number().optional(),
      blockTime: z.number().optional(),
      confirmations: z.number(),
      gatewayProvider: z.string().optional(),
      gatewayReference: z.string().optional()
    });
    
    const result = webhookSchema.safeParse(req.body);
    
    if (!result.success) {
      console.error('Invalid webhook data:', result.error.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook data',
        details: result.error.errors
      });
    }
    
    const payload = result.data;
    
    // Find wallet by address
    const [wallet] = await db.select().from(cryptoWallets)
      .where(and(
        eq(cryptoWallets.walletAddress, payload.walletAddress),
        eq(cryptoWallets.cryptoType, payload.cryptoType)
      ))
      .limit(1);
    
    if (!wallet) {
      console.error(`Wallet not found for address: ${payload.walletAddress}`);
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }
    
    // Verify the transaction on the blockchain
    const isConfirmed = await isTransactionConfirmed(
      payload.transactionHash,
      payload.cryptoType,
      payload.walletAddress
    );
    
    if (!isConfirmed.confirmed) {
      console.error('Transaction not confirmed on blockchain');
      return res.status(400).json({
        success: false,
        error: 'Transaction not confirmed on blockchain'
      });
    }
    
    // Get user details for subscription and notifications
    const [user] = await db.select().from(users)
      .where(eq(users.id, wallet.userId))
      .limit(1);
    
    if (!user) {
      console.error(`User not found for wallet ID: ${wallet.id}`);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Create transaction record if it doesn't exist
    let transaction = await db.query.cryptoTransactions.findFirst({
      where: eq(cryptoTransactions.transactionHash, payload.transactionHash)
    });
    
    if (!transaction) {
      const [newTransaction] = await db.insert(cryptoTransactions).values({
        userId: wallet.userId,
        walletId: wallet.id,
        cryptoType: payload.cryptoType,
        transactionHash: payload.transactionHash,
        amount: payload.amount,
        amountUsd: isConfirmed.amountUsd || '0',
        confirmations: payload.confirmations,
        blockHeight: payload.blockHeight || isConfirmed.blockHeight,
        blockTime: payload.blockTime || isConfirmed.blockTime,
        status: 'confirmed',
        rawData: {
          ...payload,
          ...isConfirmed.raw
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      transaction = newTransaction;
    }
    
    // Find associated pending payment
    const [pendingPayment] = await db.select().from(payments)
      .where(and(
        eq(payments.userId, wallet.userId),
        eq(payments.status, 'pending'),
        eq(payments.paymentMethod, `crypto_${payload.cryptoType}`)
      ))
      .orderBy(desc(payments.createdAt))
      .limit(1);
    
    if (pendingPayment) {
      // Update payment status
      await db.update(payments)
        .set({
          status: 'completed',
          gatewayResponse: {
            transactionHash: payload.transactionHash,
            amount: payload.amount,
            confirmations: payload.confirmations,
            blockHeight: payload.blockHeight,
            blockTime: payload.blockTime
          },
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(payments.id, pendingPayment.id));
      
      // Get plan details
      const [plan] = await db.select().from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, pendingPayment.planId))
        .limit(1);
      
      if (plan) {
        // Check if user already has a subscription for this plan
        const [existingSubscription] = await db.select().from(userSubscriptions)
          .where(and(
            eq(userSubscriptions.userId, wallet.userId),
            eq(userSubscriptions.planId, plan.id)
          ))
          .limit(1);
        
        if (existingSubscription) {
          // Extend existing subscription
          const newEndDate = new Date();
          newEndDate.setDate(newEndDate.getDate() + 30); // Assuming monthly plan
          
          await db.update(userSubscriptions)
            .set({
              status: 'active',
              endDate: newEndDate,
              updatedAt: new Date()
            })
            .where(eq(userSubscriptions.id, existingSubscription.id));
          
          // Send email notification
          if (user.email) {
            await sendCryptoPaymentConfirmation(
              user.email,
              user.username,
              payload.transactionHash,
              payload.cryptoType,
              payload.amount,
              isConfirmed.amountUsd || '0',
              plan.name
            );
          }
          
        } else {
          // Create new subscription
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30); // Assuming monthly plan
          
          const [newSubscription] = await db.insert(userSubscriptions)
            .values({
              userId: wallet.userId,
              planId: plan.id,
              status: 'active',
              startDate,
              endDate,
              currentPeriodStart: startDate,
              currentPeriodEnd: endDate,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();
          
          // Send welcome notification
          try {
            const notificationService = await SubscriptionNotificationService.initialize();
            await notificationService.sendProWelcomeMessage(
              user.id,
              user.username,
              plan.name,
              endDate
            );
            
            // Send email notification
            if (user.email) {
              await sendCryptoPaymentConfirmation(
                user.email,
                user.username,
                payload.transactionHash,
                payload.cryptoType,
                payload.amount,
                isConfirmed.amountUsd || '0',
                plan.name
              );
            }
          } catch (error) {
            console.error('Failed to send welcome notification:', error);
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Payment notification processed successfully',
      transactionId: transaction.id
    });
    
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;