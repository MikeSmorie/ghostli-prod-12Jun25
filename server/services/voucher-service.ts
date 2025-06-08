import { db } from "../../db";
import { 
  vouchers, 
  voucherRedemptions, 
  userReferralCodes, 
  referralRelationships, 
  users,
  creditTransactions
} from "@db/schema";
import { eq, and, count, sum, desc, isNull, or } from "drizzle-orm";

export interface VoucherCreationData {
  voucherCode: string;
  type: "discount" | "referral";
  valueType: "credits" | "percentage_discount" | "dollar_discount";
  valueAmount: number;
  maxUses?: number;
  perUserLimit?: number;
  expiryDate?: Date;
  tierRestriction?: string;
  referralSourceUserId?: number;
}

export interface VoucherRedemptionResult {
  success: boolean;
  message: string;
  creditsAwarded?: number;
  discountApplied?: number;
  voucherId?: number;
}

export interface ReferralStats {
  totalReferrals: number;
  totalCreditsEarned: number;
  referralCode: string;
  recentReferrals: Array<{
    username: string;
    creditsAwarded: number;
    createdAt: Date;
  }>;
}

export class VoucherService {
  
  /**
   * Create a new voucher
   */
  static async createVoucher(data: VoucherCreationData, createdBy: number): Promise<{ success: boolean; voucherId?: number; message: string }> {
    try {
      // Check if voucher code already exists
      const existingVoucher = await db.query.vouchers.findFirst({
        where: eq(vouchers.voucherCode, data.voucherCode)
      });

      if (existingVoucher) {
        return { success: false, message: "Voucher code already exists" };
      }

      const [newVoucher] = await db.insert(vouchers).values({
        voucherCode: data.voucherCode,
        type: data.type,
        valueType: data.valueType,
        valueAmount: data.valueAmount.toString(),
        maxUses: data.maxUses,
        perUserLimit: data.perUserLimit || 1,
        expiryDate: data.expiryDate,
        createdBy,
        tierRestriction: data.tierRestriction,
        referralSourceUserId: data.referralSourceUserId
      }).returning({ id: vouchers.id });

      return { 
        success: true, 
        voucherId: newVoucher.id, 
        message: "Voucher created successfully" 
      };
    } catch (error) {
      console.error("Error creating voucher:", error);
      return { success: false, message: "Failed to create voucher" };
    }
  }

  /**
   * Validate and redeem a voucher
   */
  static async redeemVoucher(voucherCode: string, userId: number, userTier: string = "FREE"): Promise<VoucherRedemptionResult> {
    try {
      // Find the voucher
      const voucher = await db.query.vouchers.findFirst({
        where: and(
          eq(vouchers.voucherCode, voucherCode),
          eq(vouchers.isActive, true)
        )
      });

      if (!voucher) {
        return { success: false, message: "Invalid or inactive voucher code" };
      }

      // Check expiry
      if (voucher.expiryDate && new Date() > voucher.expiryDate) {
        return { success: false, message: "Voucher has expired" };
      }

      // Check tier restriction
      if (voucher.tierRestriction && voucher.tierRestriction !== userTier) {
        return { success: false, message: `This voucher is only available for ${voucher.tierRestriction} users` };
      }

      // Check max uses
      if (voucher.maxUses) {
        const totalUses = await db.select({ count: count() })
          .from(voucherRedemptions)
          .where(eq(voucherRedemptions.voucherId, voucher.id));
        
        if (totalUses[0].count >= voucher.maxUses) {
          return { success: false, message: "Voucher has reached maximum usage limit" };
        }
      }

      // Check per-user limit
      const userUses = await db.select({ count: count() })
        .from(voucherRedemptions)
        .where(and(
          eq(voucherRedemptions.voucherId, voucher.id),
          eq(voucherRedemptions.userId, userId)
        ));

      if (userUses[0].count >= (voucher.perUserLimit || 1)) {
        return { success: false, message: "You have already used this voucher the maximum number of times" };
      }

      // Process redemption based on voucher type
      let creditsAwarded = 0;
      let discountApplied = 0;
      let transactionId: number | null = null;

      if (voucher.valueType === "credits") {
        creditsAwarded = parseInt(voucher.valueAmount);
        
        // Get current user credits
        const currentUser = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { credits: true }
        });
        
        const currentCredits = currentUser?.credits || 0;
        const newBalance = currentCredits + creditsAwarded;
        
        // Update user credits
        await db.update(users)
          .set({ credits: newBalance })
          .where(eq(users.id, userId));
        
        // Create transaction record
        const [creditTransaction] = await db.insert(creditTransactions).values({
          userId,
          amount: creditsAwarded,
          transactionType: "BONUS",
          source: "voucher_system",
          txId: `voucher_${voucherCode}_${Date.now()}`
        }).returning({ id: creditTransactions.id });
          
        transactionId = creditTransaction.id;
      } else if (voucher.valueType === "percentage_discount" || voucher.valueType === "dollar_discount") {
        discountApplied = parseFloat(voucher.valueAmount);
        // Note: Discount vouchers would be applied at payment time, not here
      }

      // Record the redemption
      await db.insert(voucherRedemptions).values({
        voucherId: voucher.id,
        userId,
        creditsAwarded,
        discountApplied: discountApplied.toString(),
        transactionId
      });

      // If this is a referral voucher, handle referral tracking
      if (voucher.type === "referral" && voucher.referralSourceUserId) {
        await this.processReferralReward(voucher.referralSourceUserId, userId, voucherCode, creditsAwarded);
      }

      return {
        success: true,
        message: "Voucher redeemed successfully",
        creditsAwarded,
        discountApplied,
        voucherId: voucher.id
      };

    } catch (error) {
      console.error("Error redeeming voucher:", error);
      return { success: false, message: "Failed to redeem voucher" };
    }
  }

  /**
   * Process referral rewards for both referrer and referred user
   */
  private static async processReferralReward(referrerId: number, referredId: number, referralCode: string, referredCredits: number): Promise<void> {
    try {
      // Award credits to referrer (typically same or more than referred user)
      const referrerCredits = Math.max(referredCredits, 50); // Minimum 50 credits for referrer
      
      // Get current referrer credits
      const currentReferrer = await db.query.users.findFirst({
        where: eq(users.id, referrerId),
        columns: { credits: true }
      });
      
      if (currentReferrer) {
        const newBalance = (currentReferrer.credits || 0) + referrerCredits;
        
        // Update referrer credits
        await db.update(users)
          .set({ credits: newBalance })
          .where(eq(users.id, referrerId));
        
        // Create transaction record for referrer
        await db.insert(creditTransactions).values({
          userId: referrerId,
          amount: referrerCredits,
          transactionType: "BONUS",
          description: `Referral reward: ${referralCode}`,
          source: "referral_system",
          balanceAfter: newBalance
        });
      }

      // Create referral relationship record
      await db.insert(referralRelationships).values({
        referrerId,
        referredId,
        referralCode,
        referrerCreditsAwarded: referrerCredits,
        referredCreditsAwarded: referredCredits,
        status: "completed"
      });

      // Update referral code stats manually
      const referralStats = await db.query.userReferralCodes.findFirst({
        where: eq(userReferralCodes.userId, referrerId)
      });
      
      if (referralStats) {
        await db.update(userReferralCodes)
          .set({
            totalReferrals: (referralStats.totalReferrals || 0) + 1,
            totalCreditsEarned: (referralStats.totalCreditsEarned || 0) + referrerCredits
          })
          .where(eq(userReferralCodes.userId, referrerId));
      }

    } catch (error) {
      console.error("Error processing referral reward:", error);
    }
  }

  /**
   * Generate unique referral code for user
   */
  static async generateUserReferralCode(userId: number): Promise<string> {
    try {
      // Check if user already has a referral code
      const existing = await db.query.userReferralCodes.findFirst({
        where: eq(userReferralCodes.userId, userId)
      });

      if (existing) {
        return existing.referralCode;
      }

      // Generate unique code
      let referralCode: string;
      let attempts = 0;
      do {
        referralCode = this.generateReferralCode(userId);
        attempts++;
        
        const existingCode = await db.query.userReferralCodes.findFirst({
          where: eq(userReferralCodes.referralCode, referralCode)
        });
        
        if (!existingCode) break;
      } while (attempts < 10);

      // Create referral code record
      await db.insert(userReferralCodes).values({
        userId,
        referralCode,
        totalReferrals: 0,
        totalCreditsEarned: 0,
        isActive: true
      });

      return referralCode;
    } catch (error) {
      console.error("Error generating referral code:", error);
      throw error;
    }
  }

  /**
   * Get referral statistics for a user
   */
  static async getReferralStats(userId: number): Promise<ReferralStats | null> {
    try {
      const referralCode = await db.query.userReferralCodes.findFirst({
        where: eq(userReferralCodes.userId, userId)
      });

      if (!referralCode) {
        return null;
      }

      // Get recent referrals with user details
      const recentReferrals = await db.select({
        username: users.username,
        creditsAwarded: referralRelationships.referrerCreditsAwarded,
        createdAt: referralRelationships.createdAt
      })
      .from(referralRelationships)
      .innerJoin(users, eq(referralRelationships.referredId, users.id))
      .where(eq(referralRelationships.referrerId, userId))
      .orderBy(desc(referralRelationships.createdAt))
      .limit(10);

      return {
        totalReferrals: referralCode.totalReferrals || 0,
        totalCreditsEarned: referralCode.totalCreditsEarned || 0,
        referralCode: referralCode.referralCode,
        recentReferrals: recentReferrals.map(r => ({
          username: r.username,
          creditsAwarded: r.creditsAwarded || 0,
          createdAt: r.createdAt || new Date()
        }))
      };
    } catch (error) {
      console.error("Error getting referral stats:", error);
      return null;
    }
  }

  /**
   * Get all vouchers with usage statistics (admin function)
   */
  static async getAllVouchers() {
    try {
      const voucherData = await db.select({
        id: vouchers.id,
        voucherCode: vouchers.voucherCode,
        type: vouchers.type,
        valueType: vouchers.valueType,
        valueAmount: vouchers.valueAmount,
        maxUses: vouchers.maxUses,
        perUserLimit: vouchers.perUserLimit,
        expiryDate: vouchers.expiryDate,
        isActive: vouchers.isActive,
        tierRestriction: vouchers.tierRestriction,
        createdAt: vouchers.createdAt,
        totalUses: count(voucherRedemptions.id)
      })
      .from(vouchers)
      .leftJoin(voucherRedemptions, eq(vouchers.id, voucherRedemptions.voucherId))
      .groupBy(vouchers.id)
      .orderBy(desc(vouchers.createdAt));

      return voucherData;
    } catch (error) {
      console.error("Error getting all vouchers:", error);
      return [];
    }
  }

  /**
   * Toggle voucher active status
   */
  static async toggleVoucherStatus(voucherId: number, isActive: boolean): Promise<boolean> {
    try {
      await db.update(vouchers)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(vouchers.id, voucherId));
      return true;
    } catch (error) {
      console.error("Error toggling voucher status:", error);
      return false;
    }
  }

  /**
   * Generate a referral code based on user ID and random elements
   */
  private static generateReferralCode(userId: number): string {
    const prefix = "GHOST";
    const userPart = userId.toString().padStart(3, '0');
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${userPart}${randomPart}`;
  }

  /**
   * Check if referral program is globally enabled
   */
  static async isReferralProgramEnabled(): Promise<boolean> {
    try {
      // This would check a global setting - for now return true
      // In production, this would check the globalSettings table
      return true;
    } catch (error) {
      console.error("Error checking referral program status:", error);
      return false;
    }
  }
}