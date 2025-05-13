import { db } from "@db";
import { adminAnnouncements, announcementRecipients, users } from "@db/schema";
import { and, eq } from "drizzle-orm";

// Message types for subscription transitions
export enum SubscriptionMessageType {
  WELCOME_PRO = "welcome_pro",
  UPGRADE_REMINDER = "upgrade_reminder",
  EXPIRATION_NOTICE = "expiration_notice"
}

// Interfaces for message templates
interface MessageTemplate {
  title: string;
  content: string;
  importance: "normal" | "important" | "urgent";
}

/**
 * Service for managing subscription-related notifications
 */
export class SubscriptionNotificationService {
  // Admin user ID to use as the sender for system messages
  private adminUserId: number;

  constructor(adminUserId: number) {
    this.adminUserId = adminUserId;
  }

  /**
   * Send a welcome message to a new Pro user
   * @param userId The ID of the user who just subscribed to Pro
   * @param username The username of the user who just subscribed to Pro
   * @param planName The name of the subscription plan
   * @param endDate Optional end date of the subscription
   */
  async sendProWelcomeMessage(
    userId: number, 
    username: string, 
    planName: string, 
    endDate?: Date
  ): Promise<boolean> {
    const template = this.getMessageTemplate(
      SubscriptionMessageType.WELCOME_PRO,
      { username, planName, endDate: endDate ? this.formatDate(endDate) : 'ongoing' }
    );
    
    return this.createAndSendAnnouncement(template, userId);
  }

  /**
   * Send an upgrade reminder to a Lite user
   * @param userId The ID of the user to remind
   * @param username The username of the user to remind
   * @param featureTriggered Optional name of the feature that triggered this reminder
   */
  async sendUpgradeReminder(
    userId: number, 
    username: string, 
    featureTriggered?: string
  ): Promise<boolean> {
    const template = this.getMessageTemplate(
      SubscriptionMessageType.UPGRADE_REMINDER, 
      { username, featureTriggered: featureTriggered || 'premium features' }
    );
    
    return this.createAndSendAnnouncement(template, userId);
  }

  /**
   * Send an expiration notice to a Pro user
   * @param userId The ID of the user whose subscription is expiring
   * @param username The username of the user whose subscription is expiring
   * @param daysLeft Number of days until expiration
   * @param expireDate The date when the subscription expires
   */
  async sendExpirationNotice(
    userId: number, 
    username: string, 
    daysLeft: number, 
    expireDate: Date
  ): Promise<boolean> {
    const template = this.getMessageTemplate(
      SubscriptionMessageType.EXPIRATION_NOTICE, 
      { 
        username, 
        daysLeft: daysLeft.toString(), 
        expireDate: this.formatDate(expireDate)
      }
    );

    // Set importance based on how close to expiration
    if (daysLeft <= 3) {
      template.importance = "urgent";
    } else if (daysLeft <= 7) {
      template.importance = "important";
    }
    
    return this.createAndSendAnnouncement(template, userId);
  }

  /**
   * Check if a user already has a specific message type
   * This prevents duplicate notification spam
   */
  async hasRecentMessage(userId: number, messageType: SubscriptionMessageType): Promise<boolean> {
    // Look for messages in the last 24 hours of this type
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentAnnouncements = await db.query.adminAnnouncements.findMany({
      where: and(
        eq(adminAnnouncements.senderId, this.adminUserId),
        eq(adminAnnouncements.archived, false)
      ),
      with: {
        recipients: {
          where: eq(announcementRecipients.userId, userId),
        }
      }
    });

    // Filter by creation date and check if any message title contains the message type
    return recentAnnouncements.some(announcement => 
      announcement.createdAt && announcement.createdAt > yesterday && 
      announcement.title.includes(messageType) &&
      announcement.recipients.length > 0
    );
  }

  /**
   * Private helper to create and send an announcement to a specific user
   */
  private async createAndSendAnnouncement(
    template: MessageTemplate, 
    userId: number
  ): Promise<boolean> {
    try {
      // Insert the announcement
      const [announcement] = await db.insert(adminAnnouncements).values({
        title: template.title,
        content: template.content,
        importance: template.importance,
        senderId: this.adminUserId,
        targetAudience: { type: "user", targetIds: [userId] },
        requiresResponse: false,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      if (!announcement) {
        return false;
      }

      // Create recipient record
      await db.insert(announcementRecipients).values({
        announcementId: announcement.id,
        userId: userId,
        read: false,
        notificationSent: true
      });

      return true;
    } catch (error) {
      console.error('Failed to send subscription notification:', error);
      return false;
    }
  }

  /**
   * Get the appropriate message template for a given message type
   */
  private getMessageTemplate(
    type: SubscriptionMessageType, 
    params: Record<string, string>
  ): MessageTemplate {
    switch (type) {
      case SubscriptionMessageType.WELCOME_PRO:
        return {
          title: `[${type}] Welcome to GhostliAI Pro!`,
          content: this.replacePlaceholders(
            `Dear ${params.username},\n\n` +
            `Welcome to GhostliAI Pro! Your subscription to the ${params.planName} plan is now active.\n\n` +
            `With your Pro subscription, you now have access to:\n` +
            `• Advanced humanization settings (0-15% range)\n` +
            `• Up to 5,000 words per content generation\n` +
            `• Multiple export formats (PDF, Word, HTML, etc.)\n` +
            `• "Clone Me" personal writing style analysis\n` +
            `• Keyword control and phrase removal\n` +
            `• Website scanning for content extraction\n\n` +
            `Your subscription ${params.endDate === 'ongoing' ? 'is active and will renew automatically' : `is valid until ${params.endDate}`}.\n\n` +
            `If you have any questions or need assistance, please don't hesitate to contact our support team.\n\n` +
            `Happy writing!\n` +
            `The GhostliAI Team`,
            params
          ),
          importance: "important"
        };

      case SubscriptionMessageType.UPGRADE_REMINDER:
        return {
          title: `[${type}] Upgrade to GhostliAI Pro for Premium Features`,
          content: this.replacePlaceholders(
            `Hello ${params.username},\n\n` +
            `We noticed you've been using GhostliAI and recently tried to access ${params.featureTriggered}.\n\n` +
            `Upgrade to GhostliAI Pro to unlock these premium features:\n` +
            `• Advanced humanization settings (0-15% range)\n` +
            `• Up to 5,000 words per content generation\n` +
            `• Multiple export formats (PDF, Word, HTML, etc.)\n` +
            `• "Clone Me" personal writing style analysis\n` +
            `• Keyword control and phrase removal\n` +
            `• Website scanning for content extraction\n\n` +
            `Enhance your writing experience and ensure your content is completely undetectable by AI detectors by upgrading today.\n\n` +
            `Visit the subscription page to view our plans and upgrade your account.\n\n` +
            `Thank you for using GhostliAI!\n` +
            `The GhostliAI Team`,
            params
          ),
          importance: "normal"
        };

      case SubscriptionMessageType.EXPIRATION_NOTICE:
        return {
          title: `[${type}] Your GhostliAI Pro Subscription is Expiring Soon`,
          content: this.replacePlaceholders(
            `Hello ${params.username},\n\n` +
            `This is a reminder that your GhostliAI Pro subscription will expire in ${params.daysLeft} days on ${params.expireDate}.\n\n` +
            `To maintain uninterrupted access to premium features like advanced humanization, high word counts, and premium export formats, please renew your subscription before the expiration date.\n\n` +
            `If your subscription expires, you'll still have access to GhostliAI Lite features, but premium features will no longer be available.\n\n` +
            `To renew your subscription, simply visit the subscription page in your account settings.\n\n` +
            `Thank you for being a valued GhostliAI Pro user!\n\n` +
            `The GhostliAI Team`,
            params
          ),
          importance: "normal"
        };

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  }

  /**
   * Replace placeholders in the message template
   */
  private replacePlaceholders(
    template: string, 
    params: Record<string, string>
  ): string {
    return Object.entries(params).reduce(
      (content, [key, value]) => content.replace(new RegExp(`{${key}}`, 'g'), value),
      template
    );
  }

  /**
   * Format a date for display in messages
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Initialize the service and ensure admin user exists
   */
  static async initialize(): Promise<SubscriptionNotificationService> {
    // Look for an admin user for sending system messages
    const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
    if (!adminUser) {
      throw new Error("No admin user found for sending system messages");
    }
    
    return new SubscriptionNotificationService(adminUser.id);
  }
}