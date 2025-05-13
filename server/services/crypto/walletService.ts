/**
 * Service to manage cryptocurrency wallets for users
 */
import { db } from '@db';
import { cryptoWallets, cryptoTransactions, cryptoExchangeRates, cryptoTypeEnum, users, CryptoType } from '@db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateWallet, getExchangeRate } from './cryptoUtils';
import * as crypto from 'crypto';

// Set encryption key - in production, this should be stored securely
// and potentially unique per user or retrieved from environment variables
const ENCRYPTION_KEY = process.env.CRYPTO_ENCRYPTION_KEY || 'GhostliAI_wallet_encryption_key_2025';

/**
 * Creates a new wallet for a user
 * @param userId - The user's ID
 * @param cryptoType - The type of cryptocurrency
 * @returns The created wallet
 */
export async function createWalletForUser(
  userId: number,
  cryptoType: CryptoType
): Promise<typeof cryptoWallets.$inferSelect> {
  try {
    // Check if the user already has a wallet of this type
    const existingWallet = await db.select().from(cryptoWallets).where(
      and(
        eq(cryptoWallets.userId, userId),
        eq(cryptoWallets.cryptoType, cryptoType),
        eq(cryptoWallets.isActive, true)
      )
    ).limit(1);
    
    if (existingWallet.length > 0) {
      return existingWallet[0];
    }
    
    // Generate a unique entropy for this user and crypto type
    const userSpecificSeed = crypto.createHash('sha256')
      .update(`${userId}-${process.env.APP_SECRET_KEY || 'GhostliAI_wallet_seed_2025'}-${cryptoType}`)
      .digest('hex');
    
    // Generate a new wallet
    const walletData = await generateWallet(
      cryptoType as 'bitcoin' | 'solana' | 'usdt_erc20' | 'usdt_trc20',
      userId,
      ENCRYPTION_KEY
    );
    
    // Insert wallet into database
    const [newWallet] = await db.insert(cryptoWallets).values({
      userId,
      cryptoType,
      walletAddress: walletData.address,
      privateKey: walletData.privateKey,
      publicKey: walletData.publicKey,
      seedPhrase: walletData.seedPhrase,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return newWallet;
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw new Error(`Failed to create wallet: ${error.message}`);
  }
}

/**
 * Gets all wallets for a user
 * @param userId - The user's ID
 * @returns The user's wallets
 */
export async function getWalletsForUser(
  userId: number
): Promise<typeof cryptoWallets.$inferSelect[]> {
  return db.select().from(cryptoWallets).where(
    and(
      eq(cryptoWallets.userId, userId),
      eq(cryptoWallets.isActive, true)
    )
  );
}

/**
 * Gets a specific wallet by ID
 * @param walletId - The wallet ID
 * @param userId - The user's ID for verification
 * @returns The wallet if found
 */
export async function getWalletById(
  walletId: number,
  userId: number
): Promise<typeof cryptoWallets.$inferSelect | null> {
  const [wallet] = await db.select().from(cryptoWallets).where(
    and(
      eq(cryptoWallets.id, walletId),
      eq(cryptoWallets.userId, userId)
    )
  ).limit(1);
  
  return wallet || null;
}

/**
 * Gets a wallet for a user by crypto type
 * @param userId - The user's ID
 * @param cryptoType - The type of cryptocurrency
 * @returns The wallet if found
 */
export async function getWalletByCryptoType(
  userId: number,
  cryptoType: CryptoType
): Promise<typeof cryptoWallets.$inferSelect | null> {
  const [wallet] = await db.select().from(cryptoWallets).where(
    and(
      eq(cryptoWallets.userId, userId),
      eq(cryptoWallets.cryptoType, cryptoType),
      eq(cryptoWallets.isActive, true)
    )
  ).limit(1);
  
  return wallet || null;
}

/**
 * Creates a new transaction record
 * @param data - The transaction data
 * @returns The created transaction
 */
export async function createTransaction(
  data: typeof cryptoTransactions.$inferInsert
): Promise<typeof cryptoTransactions.$inferSelect> {
  const [transaction] = await db.insert(cryptoTransactions).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();
  
  return transaction;
}

/**
 * Gets all transactions for a user
 * @param userId - The user's ID
 * @param limit - Maximum number of transactions to return
 * @param offset - Offset for pagination
 * @returns The user's transactions
 */
export async function getTransactionsForUser(
  userId: number,
  limit: number = 20,
  offset: number = 0
): Promise<typeof cryptoTransactions.$inferSelect[]> {
  return db.select().from(cryptoTransactions)
    .where(eq(cryptoTransactions.userId, userId))
    .orderBy(desc(cryptoTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Gets a specific transaction by ID
 * @param transactionId - The transaction ID
 * @param userId - The user's ID for verification
 * @returns The transaction if found
 */
export async function getTransactionById(
  transactionId: number,
  userId: number
): Promise<typeof cryptoTransactions.$inferSelect | null> {
  const [transaction] = await db.select().from(cryptoTransactions).where(
    and(
      eq(cryptoTransactions.id, transactionId),
      eq(cryptoTransactions.userId, userId)
    )
  ).limit(1);
  
  return transaction || null;
}

/**
 * Updates the status of a transaction
 * @param transactionId - The transaction ID
 * @param status - The new status
 * @param data - Additional data to update
 * @returns The updated transaction
 */
export async function updateTransactionStatus(
  transactionId: number,
  status: string,
  data: Partial<typeof cryptoTransactions.$inferSelect> = {}
): Promise<typeof cryptoTransactions.$inferSelect | null> {
  const [updatedTransaction] = await db.update(cryptoTransactions)
    .set({
      ...data,
      status,
      updatedAt: new Date()
    })
    .where(eq(cryptoTransactions.id, transactionId))
    .returning();
  
  return updatedTransaction || null;
}

/**
 * Updates exchange rates for all supported cryptocurrencies
 * @returns The updated exchange rates
 */
export async function updateExchangeRates(): Promise<typeof cryptoExchangeRates.$inferSelect[]> {
  const cryptoTypes = Object.values(cryptoTypeEnum.enum);
  const rates: typeof cryptoExchangeRates.$inferInsert[] = [];
  
  for (const cryptoType of cryptoTypes) {
    try {
      const rate = await getExchangeRate(
        cryptoType as 'bitcoin' | 'solana' | 'usdt_erc20' | 'usdt_trc20'
      );
      
      rates.push({
        cryptoType,
        rateUsd: rate.toString(),
        lastUpdated: new Date(),
        source: 'CoinGecko API' // Replace with actual source in production
      });
    } catch (error) {
      console.error(`Error getting exchange rate for ${cryptoType}:`, error);
    }
  }
  
  // Clear old rates and insert new ones
  await db.delete(cryptoExchangeRates);
  return db.insert(cryptoExchangeRates).values(rates).returning();
}

/**
 * Gets the current exchange rate for a cryptocurrency
 * @param cryptoType - The type of cryptocurrency
 * @returns The exchange rate if found
 */
export async function getStoredExchangeRate(
  cryptoType: CryptoType
): Promise<typeof cryptoExchangeRates.$inferSelect | null> {
  const [rate] = await db.select().from(cryptoExchangeRates)
    .where(eq(cryptoExchangeRates.cryptoType, cryptoType))
    .orderBy(desc(cryptoExchangeRates.lastUpdated))
    .limit(1);
  
  return rate || null;
}

/**
 * Ensures a user has wallets for all supported crypto types
 * @param userId - The user's ID
 * @returns The created or existing wallets
 */
export async function ensureUserHasAllWallets(
  userId: number
): Promise<typeof cryptoWallets.$inferSelect[]> {
  const cryptoTypes = Object.values(cryptoTypeEnum.enum);
  const wallets: typeof cryptoWallets.$inferSelect[] = [];
  
  for (const cryptoType of cryptoTypes) {
    try {
      // Try to get existing wallet
      let wallet = await getWalletByCryptoType(userId, cryptoType as CryptoType);
      
      // Create if it doesn't exist
      if (!wallet) {
        wallet = await createWalletForUser(userId, cryptoType as CryptoType);
      }
      
      wallets.push(wallet);
    } catch (error) {
      console.error(`Error ensuring wallet for ${cryptoType}:`, error);
    }
  }
  
  return wallets;
}