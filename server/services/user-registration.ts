import { db } from "@db";
import { users, globalSettings, creditTransactions } from "@db/schema";
import { eq } from "drizzle-orm";
import { CreditsService } from "./credits";

export class UserRegistrationService {
  /**
   * Get default first-time credits from global settings
   */
  static async getDefaultFirstTimeCredits(): Promise<number> {
    try {
      const setting = await db
        .select({ settingValue: globalSettings.settingValue })
        .from(globalSettings)
        .where(eq(globalSettings.settingKey, "default_first_time_credits"))
        .limit(1);

      if (setting.length > 0) {
        return parseInt(setting[0].settingValue) || 100;
      }
      
      return 100; // Default fallback
    } catch (error) {
      console.error("Error fetching default first-time credits:", error);
      return 100; // Default fallback
    }
  }

  /**
   * Grant default credits to new user
   */
  static async grantDefaultCredits(userId: number): Promise<void> {
    try {
      const defaultCredits = await this.getDefaultFirstTimeCredits();
      
      if (defaultCredits > 0) {
        const result = await CreditsService.addCredits(
          userId,
          defaultCredits,
          "SYSTEM",
          "BONUS",
          `first_time_bonus_${userId}_${Date.now()}`
        );

        if (result.success) {
          console.log(`Granted ${defaultCredits} default credits to new user ${userId}`);
        } else {
          console.error(`Failed to grant default credits to user ${userId}`);
        }
      }
    } catch (error) {
      console.error("Error granting default credits to new user:", error);
    }
  }

  /**
   * Handle new user registration with credit allocation
   */
  static async handleNewUserRegistration(userId: number): Promise<void> {
    try {
      // Grant default first-time credits
      await this.grantDefaultCredits(userId);
      
      console.log(`New user registration completed for user ${userId} with default credits`);
    } catch (error) {
      console.error("Error handling new user registration:", error);
    }
  }
}