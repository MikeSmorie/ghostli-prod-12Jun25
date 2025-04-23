import { db } from "@db";
import { 
  activityLogs, 
  errorLogs, 
  users, 
  subscriptionPlans, 
  userSubscriptions,
  payments
} from "@db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import type { AIQuery, AIResponse, AIFeedback } from "./types";

export class AIAssistantService {
  private async getSystemContext() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      // Get comprehensive system insights
      const recentErrors = await db.select().from(errorLogs)
        .orderBy(desc(errorLogs.timestamp))
        .limit(10);

      const recentActivity = await db.select().from(activityLogs)
        .orderBy(desc(activityLogs.timestamp))
        .limit(10);

      const activePlans = await db.select().from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true));

      // Get monthly active users
      const activeUsers = await db.select()
        .from(users)
        .where(gte(users.lastLogin, thirtyDaysAgo));

      // Get subscription metrics
      const activeSubscriptions = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.status, "active"));

      // Get recent payments
      const recentPayments = await db.select()
        .from(payments)
        .orderBy(desc(payments.createdAt))
        .limit(5);

      return {
        errors: recentErrors,
        activity: recentActivity,
        subscriptionPlans: activePlans,
        activeUsers: activeUsers.length,
        metrics: {
          activeSubscriptions: activeSubscriptions.length,
          recentPayments: recentPayments.length,
        },
        timestamp: now.toISOString()
      };
    } catch (error) {
      console.error("Error getting system context:", error);
      return {
        errors: [],
        activity: [],
        subscriptionPlans: [],
        activeUsers: 0,
        metrics: {
          activeSubscriptions: 0,
          recentPayments: 0,
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getUserContext(userId: number) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
          subscriptions: {
            with: {
              plan: true
            }
          },
          activityLogs: {
            orderBy: (logs) => desc(logs.timestamp),
            limit: 5
          }
        }
      });

      // Get user's recent payments
      const userPayments = await db.select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))
        .limit(3);

      return {
        user,
        recentPayments: userPayments,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error getting user context:", error);
      return {
        user: null,
        recentPayments: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  async processQuery(aiQuery: AIQuery): Promise<AIResponse> {
    const { type, query, userId, context } = aiQuery;

    // Log the AI interaction
    await db.insert(activityLogs).values({
      userId,
      action: `ai_${type}_query`,
      details: JSON.stringify({ query, context }),
      timestamp: new Date()
    });

    try {
      if (type === "admin") {
        return this.handleAdminQuery(query, userId);
      } else {
        return this.handleUserQuery(query, userId);
      }
    } catch (error) {
      await db.insert(errorLogs).values({
        errorMessage: error instanceof Error ? error.message : "Unknown error in AI processing",
        location: "AIAssistantService.processQuery",
        stackTrace: error instanceof Error ? error.stack : undefined,
        timestamp: new Date()
      });

      throw error;
    }
  }

  private async handleAdminQuery(query: string, userId: number): Promise<AIResponse> {
    const systemContext = await this.getSystemContext();

    // Format comprehensive insights
    const insights = {
      errorRate: systemContext.errors.length > 0 ? 
        `${((systemContext.errors.length / systemContext.activity.length) * 100).toFixed(1)}%` : 
        "0%",
      activeSubscriptionPlans: systemContext.subscriptionPlans.length,
      recentActivityCount: systemContext.activity.length,
      latestError: systemContext.errors[0],
      activeUsers: systemContext.activeUsers,
      metrics: {
        activeSubscriptions: systemContext.metrics.activeSubscriptions,
        recentPayments: systemContext.metrics.recentPayments
      }
    };

    // Generate system health status
    const systemHealth = {
      status: insights.errorRate === "0%" ? "healthy" : "needs attention",
      details: {
        errorRate: insights.errorRate,
        activeUsers: insights.activeUsers,
        activeSubscriptions: insights.metrics.activeSubscriptions
      }
    };

    return {
      answer: `[Admin Insights] Here's a comprehensive system overview:

1. System Health:
   - Status: ${systemHealth.status}
   - Error Rate: ${insights.errorRate}
   - Active Users: ${insights.activeUsers}

2. Subscription Status:
   - Active Plans: ${insights.activeSubscriptionPlans}
   - Active Subscriptions: ${insights.metrics.activeSubscriptions}
   - Recent Payments: ${insights.metrics.recentPayments}

3. Activity Overview:
   - Recent Activities: ${insights.recentActivityCount}
${insights.latestError ? `\nLatest Error Alert:
   ${insights.latestError.errorMessage}
   Location: ${insights.latestError.location}
   Time: ${new Date(insights.latestError.timestamp).toLocaleString()}` : ''}`,
      suggestions: [
        "View detailed error logs",
        "Check subscription plan statistics",
        "Monitor user activity trends",
        "Review system health metrics"
      ],
      actions: [
        {
          type: "view",
          label: "View Error Logs",
          endpoint: "/api/admin/error-logs"
        },
        {
          type: "view",
          label: "View Activity Logs",
          endpoint: "/api/admin/activity-logs"
        }
      ],
      relatedDocs: [
        "system_architecture.md",
        "api_documentation.md",
        "monitoring_guide.md"
      ],
      metrics: {
        errorRate: insights.errorRate,
        activeUsers: insights.activeUsers,
        systemHealth
      },
      confidence: 0.95
    };
  }

  private async handleUserQuery(query: string, userId: number): Promise<AIResponse> {
    const userContext = await this.getUserContext(userId);
    const lcQuery = query.toLowerCase();

    // Get user-specific information
    const subscription = userContext.user?.subscriptions?.[0];
    const hasActiveSubscription = subscription?.status === "active";
    const recentActivities = userContext.user?.activityLogs || [];
    
    // Default suggestions based on subscription status
    const suggestions = [];
    if (hasActiveSubscription) {
      suggestions.push(
        "Check your subscription features",
        "Explore premium features",
        "View usage analytics"
      );
    } else {
      suggestions.push(
        "View available plans",
        "Compare subscription features",
        "Start free trial"
      );
    }

    // Add personalized suggestions based on recent activity
    if (recentActivities.length > 0) {
      suggestions.push(
        "Continue where you left off",
        "Explore related features"
      );
    }
    
    // Process specific user queries
    let answer = "";
    
    // About WriteRIGHT
    if (lcQuery.includes("what is writeright") || lcQuery.includes("about writeright") || lcQuery.includes("tell me about writeright")) {
      answer = `WriteRIGHT is a sophisticated AI-powered content generation platform that creates intelligent, customizable, and high-quality content with advanced personalization capabilities.

Key features include:
1. Advanced content generation with anti-AI detection
2. AI-driven style learning through our "Clone Me" feature
3. Multi-parameter content customization
4. E-A-T compliance features
5. Export options in multiple formats (PDF, Word, HTML)

The platform is designed to help you create content that appears completely human-written and undetectable by third parties or AI detectors.`;
      
      suggestions.length = 0;
      suggestions.push(
        "How does anti-AI detection work?",
        "What is Clone Me?",
        "How do I generate content?",
        "What are the subscription tiers?"
      );
      
    // About Anti-AI Detection  
    } else if (lcQuery.includes("anti-ai") || lcQuery.includes("detection") || lcQuery.includes("undetectable")) {
      answer = `WriteRIGHT's anti-AI detection system ensures your content is completely undetectable by third parties or search engines as AI-written.

It works by:
1. Introducing controlled natural variations in writing style
2. Incorporating thoughtful syntax and structural variations
3. Applying user-adjustable humanization parameters (0-15%)
4. Processing content through multiple refinement passes

You can select between Speed Mode (faster generation with standard evasion) or Undetectable Mode (maximum humanization with multiple processing passes).`;
      
      suggestions.length = 0;
      suggestions.push(
        "How do I adjust humanization parameters?",
        "What is Clone Me?",
        "How do I export my content?",
        "What tone options are available?"
      );
      
    // About Clone Me
    } else if (lcQuery.includes("clone me") || lcQuery.includes("writing style")) {
      answer = `The "Clone Me" feature is a premium capability that analyzes your submitted essays to clone your unique writing style.

How it works:
1. Submit 2-3 samples of your writing through the Clone Me page
2. The system analyzes your vocabulary choices, sentence structures, and stylistic patterns
3. Your personal style profile is created and stored
4. When generating content, toggle "Use My Personal Style" to apply your style

This feature is especially valuable for maintaining consistent brand voice or personal writing style across all generated content.`;
      
      suggestions.length = 0;
      suggestions.push(
        "Where do I submit my essays?",
        "How many samples do I need?",
        "Can I create multiple styles?",
        "How accurate is the style matching?"
      );
      
    // About Content Generation
    } else if (lcQuery.includes("generate") || lcQuery.includes("content") || lcQuery.includes("how to use")) {
      answer = `To generate content in WriteRIGHT:

1. Navigate to the Content Generation page
2. Enter your topic and requirements in the prompt field
3. Customize parameters:
   - Tone (professional, casual, persuasive, etc.)
   - Brand archetype
   - Word count (50-5000)
   - Anti-AI detection settings
   - (Optional) Toggle "Use My Personal Style" if you've set up Clone Me
4. Click "Generate Content"
5. Review and use the export options for your preferred format

For best results, be specific in your prompt about the audience, purpose, and key points you want to emphasize.`;
      
      suggestions.length = 0;
      suggestions.push(
        "What tone options are available?",
        "How do I use Clone Me with generation?",
        "What export formats are supported?",
        "How long does generation take?"
      );
      
    // About Subscription Tiers
    } else if (lcQuery.includes("subscription") || lcQuery.includes("pricing") || lcQuery.includes("plans") || lcQuery.includes("tier")) {
      answer = `WriteRIGHT offers four subscription tiers:

1. Free: Basic content generation with limited word count
2. Basic: Extended word count + standard anti-AI detection
3. Premium: Higher limits + advanced anti-AI detection + Clone Me feature (1 style)
4. Enterprise: Unlimited usage + maximum anti-AI detection + multiple Clone Me styles + priority processing

Each tier progressively unlocks more features, higher word count limits, and enhanced AI detection evasion capabilities.`;
      
      suggestions.length = 0;
      suggestions.push(
        "How do I upgrade my subscription?",
        "What is Clone Me?",
        "What are the word count limits?",
        "What payment methods are accepted?"
      );
      
    // Default response  
    } else {
      answer = `I'm here to help! ${hasActiveSubscription ? 
        `I see you're on the ${subscription.plan.name} plan. You have access to all premium features.` : 
        "You might want to check out our subscription plans for additional features."}

You can ask me about:
• What is WriteRIGHT
• How to generate content
• Anti-AI detection features
• The Clone Me feature
• Subscription plans and features

${recentActivities.length > 0 ? "\nRecent Activity:\n" + 
  recentActivities.slice(0, 3).map(activity => `- ${activity.action}`).join("\n") : ""}`;
    }

    return {
      answer,
      suggestions,
      actions: hasActiveSubscription ? [
        {
          type: "view",
          label: "View Subscription Details",
          endpoint: `/api/subscription/user/${userId}`
        }
      ] : [
        {
          type: "view",
          label: "View Available Plans",
          endpoint: "/api/subscription/plans"
        }
      ],
      confidence: 0.9
    };
  }

  async recordFeedback(feedback: AIFeedback) {
    await db.insert(activityLogs).values({
      userId: feedback.userId,
      action: "ai_feedback",
      details: JSON.stringify(feedback),
      timestamp: new Date()
    });
  }
}

export const aiAssistant = new AIAssistantService();