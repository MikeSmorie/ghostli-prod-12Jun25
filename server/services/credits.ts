import { db } from "@db";
import { users, creditTransactions, type InsertCreditTransaction, type SelectUser } from "@db/schema";
import { eq, sum, desc, sql } from "drizzle-orm";

export class CreditsService {
  // Get user's current credit balance
  static async getUserCredits(userId: number): Promise<number> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { credits: true }
    });
    
    return user?.credits || 0;
  }

  // Add credits to user account
  static async addCredits(
    userId: number, 
    amount: number, 
    source: string, 
    transactionType: "PURCHASE" | "BONUS" | "ADJUSTMENT" = "PURCHASE",
    txId?: string
  ): Promise<{ success: boolean; newBalance: number }> {
    try {
      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Get current credits first
        const currentUser = await tx.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { credits: true }
        });
        
        const newCredits = (currentUser?.credits || 0) + amount;
        
        // Update user credits
        const [updatedUser] = await tx
          .update(users)
          .set({ credits: newCredits })
          .where(eq(users.id, userId))
          .returning({ credits: users.credits });

        // Record the transaction
        await tx.insert(creditTransactions).values({
          userId,
          transactionType,
          amount,
          source,
          txId,
        });

        return updatedUser;
      });

      return {
        success: true,
        newBalance: result.credits
      };
    } catch (error) {
      console.error('Error adding credits:', error);
      return {
        success: false,
        newBalance: 0
      };
    }
  }

  // Consume credits from user account
  static async consumeCredits(
    userId: number, 
    amount: number, 
    source: string = "System"
  ): Promise<{ success: boolean; newBalance: number; message?: string }> {
    try {
      // Check if user has enough credits
      const currentBalance = await this.getUserCredits(userId);
      
      if (currentBalance < amount) {
        return {
          success: false,
          newBalance: currentBalance,
          message: "Insufficient credits"
        };
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Get current credits first
        const currentUser = await tx.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { credits: true }
        });
        
        const newCredits = (currentUser?.credits || 0) - amount;
        
        // Update user credits (subtract)
        const [updatedUser] = await tx
          .update(users)
          .set({ credits: newCredits })
          .where(eq(users.id, userId))
          .returning({ credits: users.credits });

        // Record the transaction (negative amount for consumption)
        await tx.insert(creditTransactions).values({
          userId,
          transactionType: "USAGE",
          amount: -amount,
          source,
        });

        return updatedUser;
      });

      return {
        success: true,
        newBalance: result.credits
      };
    } catch (error) {
      console.error('Error consuming credits:', error);
      return {
        success: false,
        newBalance: 0,
        message: "Failed to consume credits"
      };
    }
  }

  // Get user's credit transaction history
  static async getCreditHistory(
    userId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<Array<{
    id: number;
    transactionType: string;
    amount: number;
    source: string;
    txId: string | null;
    createdAt: Date | null;
  }>> {
    const transactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, userId),
      orderBy: [desc(creditTransactions.createdAt)],
      limit,
      offset,
    });

    return transactions;
  }

  // Get total credits purchased by user
  static async getTotalPurchased(userId: number): Promise<number> {
    const result = await db
      .select({
        total: sum(creditTransactions.amount)
      })
      .from(creditTransactions)
      .where(
        eq(creditTransactions.userId, userId)
      );

    return Number(result[0]?.total) || 0;
  }

  // Admin function: Manual credit adjustment
  static async adjustCredits(
    userId: number,
    amount: number,
    reason: string,
    adminId: number
  ): Promise<{ success: boolean; newBalance: number }> {
    try {
      const result = await db.transaction(async (tx) => {
        // Get current credits first
        const currentUser = await tx.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { credits: true }
        });
        
        const newCredits = (currentUser?.credits || 0) + amount;
        
        // Update user credits
        const [updatedUser] = await tx
          .update(users)
          .set({ credits: newCredits })
          .where(eq(users.id, userId))
          .returning({ credits: users.credits });

        // Record the adjustment
        await tx.insert(creditTransactions).values({
          userId,
          transactionType: "ADJUSTMENT",
          amount,
          source: `Manual adjustment by admin ${adminId}: ${reason}`,
        });

        return updatedUser;
      });

      return {
        success: true,
        newBalance: result.credits
      };
    } catch (error) {
      console.error('Error adjusting credits:', error);
      return {
        success: false,
        newBalance: 0
      };
    }
  }

  // Check if user can afford an operation
  static async canAfford(userId: number, cost: number): Promise<boolean> {
    const balance = await this.getUserCredits(userId);
    return balance >= cost;
  }

  // Get credit statistics for admin dashboard
  static async getCreditStats(): Promise<{
    totalCreditsIssued: number;
    totalCreditsConsumed: number;
    activeUsers: number;
    totalTransactions: number;
  }> {
    const [
      totalIssued,
      totalConsumed,
      activeUsers,
      totalTransactions
    ] = await Promise.all([
      db
        .select({ total: sum(creditTransactions.amount) })
        .from(creditTransactions)
        .where(eq(creditTransactions.transactionType, "PURCHASE")),
      
      db
        .select({ total: sum(creditTransactions.amount) })
        .from(creditTransactions)
        .where(eq(creditTransactions.transactionType, "USAGE")),
      
      db
        .select({ count: sql<number>`COUNT(DISTINCT user_id)` })
        .from(creditTransactions),
      
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(creditTransactions)
    ]);

    return {
      totalCreditsIssued: Number(totalIssued[0]?.total) || 0,
      totalCreditsConsumed: Math.abs(Number(totalConsumed[0]?.total)) || 0,
      activeUsers: Number(activeUsers[0]?.count) || 0,
      totalTransactions: Number(totalTransactions[0]?.count) || 0,
    };
  }
}