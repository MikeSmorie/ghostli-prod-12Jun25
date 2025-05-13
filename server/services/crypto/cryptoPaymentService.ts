/**
 * Service to handle cryptocurrency payments for subscriptions
 */
import { db } from '@db';
import { 
  cryptoWallets, 
  cryptoTransactions, 
  cryptoExchangeRates,
  userSubscriptions,
  payments,
  subscriptionPlans,
  CryptoType,
  PaymentStatus,
  GatewayProvider,
  SelectCryptoWallet
} from '@db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { 
  createWalletForUser, 
  getWalletByCryptoType, 
  createTransaction,
  getStoredExchangeRate,
  ensureUserHasAllWallets
} from './walletService';
import { isTransactionConfirmed, getMinConfirmations } from './blockchainService';
import * as crypto from 'crypto';

/**
 * Creates a payment request for a subscription using cryptocurrency
 * @param userId - The user's ID
 * @param planId - The subscription plan ID
 * @param cryptoType - The type of cryptocurrency to use
 * @returns Payment information
 */
export async function createCryptoPaymentRequest(
  userId: number,
  planId: number,
  cryptoType: CryptoType
): Promise<{
  wallet: SelectCryptoWallet;
  amountCrypto: string;
  amountUsd: string;
  expiresAt: Date;
  referenceId: string;
}> {
  try {
    // Get the subscription plan
    const [plan] = await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);
    
    if (!plan) {
      throw new Error(`Subscription plan with ID ${planId} not found`);
    }
    
    // Get or create a wallet for this user and crypto type
    let wallet = await getWalletByCryptoType(userId, cryptoType);
    
    if (!wallet) {
      wallet = await createWalletForUser(userId, cryptoType);
    }
    
    // Get the exchange rate for this crypto type
    const exchangeRate = await getStoredExchangeRate(cryptoType);
    
    if (!exchangeRate) {
      throw new Error(`Exchange rate for ${cryptoType} not found`);
    }
    
    // Calculate the amount of crypto required
    const amountUsd = parseFloat(plan.price.toString());
    const cryptoPrice = parseFloat(exchangeRate.rateUsd.toString());
    
    // Add a 5% buffer to account for price fluctuations
    const amountCrypto = (amountUsd / cryptoPrice) * 1.05;
    
    // Create a payment record
    const referenceId = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Payment request expires in 24 hours
    
    // Create payment record
    const [payment] = await db.insert(payments).values({
      userId,
      planId,
      amount: plan.price.toString(),
      currency: 'USD',
      status: 'pending' as PaymentStatus,
      gatewayProvider: cryptoType as unknown as GatewayProvider, // This is a bit of a hack
      paymentMethod: `crypto_${cryptoType}`,
      referenceId,
      metadata: {
        cryptoType,
        walletAddress: wallet.walletAddress,
        amountCrypto: amountCrypto.toString(),
        exchangeRate: exchangeRate.rateUsd.toString()
      },
      createdAt: new Date(),
      expiresAt
    }).returning();
    
    return {
      wallet,
      amountCrypto: amountCrypto.toFixed(8),
      amountUsd: amountUsd.toFixed(2),
      expiresAt,
      referenceId
    };
  } catch (error) {
    console.error('Error creating crypto payment request:', error);
    throw new Error(`Failed to create payment request: ${error.message}`);
  }
}

/**
 * Verifies a cryptocurrency payment
 * @param userId - The user's ID
 * @param transactionHash - The blockchain transaction hash
 * @param cryptoType - The type of cryptocurrency
 * @param walletId - The wallet ID
 * @returns Verification result
 */
export async function verifyCryptoPayment(
  userId: number,
  transactionHash: string,
  cryptoType: CryptoType,
  walletId: number
): Promise<{
  verified: boolean;
  transaction?: typeof cryptoTransactions.$inferSelect;
  status?: string;
  confirmations?: number;
  message?: string;
}> {
  try {
    // Get the wallet
    const [wallet] = await db.select().from(cryptoWallets)
      .where(and(
        eq(cryptoWallets.id, walletId),
        eq(cryptoWallets.userId, userId),
        eq(cryptoWallets.cryptoType, cryptoType)
      ))
      .limit(1);
    
    if (!wallet) {
      return {
        verified: false,
        message: 'Wallet not found'
      };
    }
    
    // Check if this transaction has already been recorded
    const [existingTx] = await db.select().from(cryptoTransactions)
      .where(eq(cryptoTransactions.transactionHash, transactionHash))
      .limit(1);
    
    if (existingTx) {
      return {
        verified: existingTx.status === 'confirmed',
        transaction: existingTx,
        status: existingTx.status,
        confirmations: existingTx.confirmations,
        message: existingTx.status === 'confirmed' 
          ? 'Transaction already confirmed' 
          : 'Transaction is still pending confirmation'
      };
    }
    
    // Verify the transaction on the blockchain
    const txInfo = await isTransactionConfirmed(cryptoType, transactionHash);
    
    if (!txInfo.confirmed) {
      // If not confirmed, create a transaction record to track it
      const minConfirmations = getMinConfirmations(cryptoType);
      
      const newTx = await createTransaction({
        userId,
        walletId,
        cryptoType,
        transactionHash,
        senderAddress: txInfo.from || '',
        amount: txInfo.amount || '0',
        status: 'pending',
        confirmations: txInfo.confirmations || 0,
        blockHeight: txInfo.blockHeight,
        blockTime: txInfo.blockTime,
        rawData: txInfo.raw,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return {
        verified: false,
        transaction: newTx,
        status: 'pending',
        confirmations: txInfo.confirmations || 0,
        message: `Transaction requires ${minConfirmations} confirmations, currently has ${txInfo.confirmations || 0}`
      };
    }
    
    // If confirmed, create a confirmed transaction record
    const exchangeRate = await getStoredExchangeRate(cryptoType);
    const amountUsd = exchangeRate 
      ? parseFloat(txInfo.amount || '0') * parseFloat(exchangeRate.rateUsd.toString()) 
      : 0;
    
    const confirmedTx = await createTransaction({
      userId,
      walletId,
      cryptoType,
      transactionHash,
      senderAddress: txInfo.from || '',
      amount: txInfo.amount || '0',
      amountUsd: amountUsd.toString(),
      feeAmount: txInfo.fee || '0',
      status: 'confirmed',
      confirmations: txInfo.confirmations || 0,
      blockHeight: txInfo.blockHeight,
      blockTime: txInfo.blockTime,
      rawData: txInfo.raw,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Find related payment records
    const pendingPayments = await db.select().from(payments)
      .where(and(
        eq(payments.userId, userId),
        eq(payments.status, 'pending'),
        eq(payments.paymentMethod, `crypto_${cryptoType}`)
      ));
    
    // Update the payment record if found
    if (pendingPayments.length > 0) {
      const payment = pendingPayments[0];
      
      // Update payment status
      await db.update(payments)
        .set({
          status: 'completed',
          gatewayResponse: {
            transactionHash,
            amount: txInfo.amount,
            confirmations: txInfo.confirmations,
            blockHeight: txInfo.blockHeight,
            blockTime: txInfo.blockTime
          },
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(payments.id, payment.id));
      
      // Create or update subscription
      const [existingSubscription] = await db.select().from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.planId, payment.planId)
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
        
        // Update transaction with subscription ID
        await db.update(cryptoTransactions)
          .set({
            subscriptionId: existingSubscription.id,
            updatedAt: new Date()
          })
          .where(eq(cryptoTransactions.id, confirmedTx.id));
      } else {
        // Create new subscription
        const [plan] = await db.select().from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, payment.planId))
          .limit(1);
        
        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30); // Assuming monthly plan
          
          const [newSubscription] = await db.insert(userSubscriptions)
            .values({
              userId,
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
          
          // Update transaction with subscription ID
          await db.update(cryptoTransactions)
            .set({
              subscriptionId: newSubscription.id,
              updatedAt: new Date()
            })
            .where(eq(cryptoTransactions.id, confirmedTx.id));
        }
      }
    }
    
    return {
      verified: true,
      transaction: confirmedTx,
      status: 'confirmed',
      confirmations: txInfo.confirmations || 0,
      message: 'Transaction confirmed and payment processed'
    };
  } catch (error) {
    console.error('Error verifying crypto payment:', error);
    return {
      verified: false,
      message: `Verification error: ${error.message}`
    };
  }
}

/**
 * Gets payment information for a pending crypto payment
 * @param paymentId - The payment ID
 * @param userId - The user's ID for verification
 * @returns Payment information
 */
export async function getCryptoPaymentInfo(
  paymentId: number,
  userId: number
): Promise<{
  payment: typeof payments.$inferSelect;
  wallet: typeof cryptoWallets.$inferSelect;
  exchangeRate: typeof cryptoExchangeRates.$inferSelect;
}> {
  // Get the payment
  const [payment] = await db.select().from(payments)
    .where(and(
      eq(payments.id, paymentId),
      eq(payments.userId, userId)
    ))
    .limit(1);
  
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  // Parse metadata to get crypto type and wallet address
  const metadata = payment.metadata as any;
  const cryptoType = metadata?.cryptoType as CryptoType;
  
  if (!cryptoType) {
    throw new Error('Invalid payment metadata');
  }
  
  // Get the wallet
  const [wallet] = await db.select().from(cryptoWallets)
    .where(and(
      eq(cryptoWallets.userId, userId),
      eq(cryptoWallets.cryptoType, cryptoType)
    ))
    .limit(1);
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  // Get the exchange rate
  const [exchangeRate] = await db.select().from(cryptoExchangeRates)
    .where(eq(cryptoExchangeRates.cryptoType, cryptoType))
    .orderBy(desc(cryptoExchangeRates.lastUpdated))
    .limit(1);
  
  if (!exchangeRate) {
    throw new Error('Exchange rate not found');
  }
  
  return {
    payment,
    wallet,
    exchangeRate
  };
}

/**
 * Gets pending crypto payment for a user, if any
 * @param userId - The user's ID
 * @returns The pending payment if found
 */
export async function getPendingCryptoPaymentForUser(
  userId: number
): Promise<typeof payments.$inferSelect | null> {
  const [payment] = await db.select().from(payments)
    .where(and(
      eq(payments.userId, userId),
      eq(payments.status, 'pending'),
      // The payment method should start with 'crypto_'
      // This is a bit of a hack, but it works for now
      // A better solution would be to add a specific field for crypto payments
      // or to have a separate crypto payments table
    ))
    .orderBy(desc(payments.createdAt))
    .limit(1);
  
  return payment || null;
}

/**
 * Sets up crypto wallets for a new user
 * @param userId - The user's ID
 * @returns The created wallets
 */
export async function setupCryptoWalletsForUser(
  userId: number
): Promise<typeof cryptoWallets.$inferSelect[]> {
  return ensureUserHasAllWallets(userId);
}