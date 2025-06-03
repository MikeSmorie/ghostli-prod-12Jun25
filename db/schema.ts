import { pgTable, text, serial, timestamp, integer, boolean, decimal, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const userRoleEnum = z.enum(["user", "admin", "supergod"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  email: text("email").unique(),
  credits: integer("credits").default(0).notNull(),
  creditExempt: boolean("credit_exempt").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login")
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  details: text("details")
});

// Credit transaction types
export const transactionTypeEnum = z.enum(["PURCHASE", "USAGE", "BONUS", "ADJUSTMENT", "CONSUMPTION"]);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Global settings table for system configurations
export const globalSettings = pgTable("global_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").unique().notNull(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Credit transactions table
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  transactionType: text("transaction_type").notNull(),
  amount: integer("amount").notNull(), // positive for add, negative for consume
  source: text("source").notNull(), // PayPal, Bitcoin, Manual, System
  txId: text("tx_id"), // optional, store PayPal or Bitcoin transaction ID
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  level: text("level").notNull(),  // INFO, WARNING, ERROR
  message: text("message").notNull(),
  source: text("source").notNull(),
  stackTrace: text("stack_trace"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id)
});

// Add relations for error logs
export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  resolvedByUser: one(users, {
    fields: [errorLogs.resolvedBy],
    references: [users.id],
  }),
}));

// Add schemas for validation
export const insertErrorLogSchema = createInsertSchema(errorLogs);
export const selectErrorLogSchema = createSelectSchema(errorLogs);

// Add types
export type InsertErrorLog = typeof errorLogs.$inferInsert;
export type SelectErrorLog = typeof errorLogs.$inferSelect;


// Simple messages table with no relations
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Add schema and types for messages
export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessage = typeof messages.$inferSelect;


// Payment and Subscription Related Schema
export const subscriptionStatusEnum = z.enum(["active", "cancelled", "expired", "pending"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

export const paymentStatusEnum = z.enum(["pending", "completed", "failed", "refunded"]);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const gatewayProviderEnum = z.enum(["PayPal", "Stripe"]);
export type GatewayProvider = z.infer<typeof gatewayProviderEnum>;

export const gatewayStatusEnum = z.enum(["active", "inactive"]);
export type GatewayStatus = z.infer<typeof gatewayStatusEnum>;

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  interval: text("interval").notNull(), // monthly, yearly, etc.
  features: text("features"), // JSON string of features
  isActive: boolean("is_active").default(true),
  trialPeriodDays: integer("trial_period_days"),
  metadata: text("metadata"), // JSON string for additional flexible properties
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull().default("pending"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  cancelledAt: timestamp("cancelled_at"),
  customFeatures: text("custom_features"), // JSON string for feature overrides
  createdAt: timestamp("created_at").defaultNow()
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull(),
  paymentIntentId: text("payment_intent_id"), // For Stripe integration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const clientPaymentGateways = pgTable("client_payment_gateways", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id),
  gatewayType: text("gateway_type").notNull().default("mock"),
  gatewayProvider: text("gateway_provider").notNull(),
  apiKey: text("api_key").notNull(),
  secretKey: text("secret_key").notNull(),
  isActive: boolean("is_active").default(false),
  configJson: jsonb("config_json"),
  status: text("status").notNull().default("inactive"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// New Feature Management Tables
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const planFeatures = pgTable("plan_features", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  featureId: integer("feature_id").notNull().references(() => features.id),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Define cryptocurrency types
export const cryptoTypeEnum = z.enum(["bitcoin", "solana", "usdt_erc20", "usdt_trc20"]);
export type CryptoType = z.infer<typeof cryptoTypeEnum>;

// Crypto transaction status enum
export const cryptoTxStatusEnum = z.enum(["pending", "confirming", "confirmed", "failed"]);
export type CryptoTxStatus = z.infer<typeof cryptoTxStatusEnum>;

// Define crypto wallets table
export const cryptoWallets = pgTable("crypto_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  cryptoType: text("crypto_type").notNull(), // bitcoin, solana, usdt_erc20, usdt_trc20
  walletAddress: text("wallet_address").notNull().unique(),
  privateKey: text("private_key").notNull(), // Encrypted private key
  publicKey: text("public_key").notNull(),
  seedPhrase: text("seed_phrase"), // Encrypted seed phrase if needed
  isActive: boolean("is_active").default(true),
  balance: decimal("balance", { precision: 18, scale: 8 }).default("0"),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
}, (table) => {
  return {
    userIdx: index("crypto_wallets_user_idx").on(table.userId),
    typeIdx: index("crypto_wallets_type_idx").on(table.cryptoType),
  }
});

// Define crypto transactions table
export const cryptoTransactions = pgTable("crypto_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  walletId: integer("wallet_id").notNull().references(() => cryptoWallets.id),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  cryptoType: text("crypto_type").notNull(),
  transactionHash: text("transaction_hash").notNull().unique(),
  senderAddress: text("sender_address"),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }),
  feeAmount: decimal("fee_amount", { precision: 18, scale: 8 }),
  status: text("status").notNull().default("pending"),
  confirmations: integer("confirmations").default(0),
  blockHeight: integer("block_height"),
  blockTime: timestamp("block_time"),
  memo: text("memo"),
  rawData: jsonb("raw_data"), // Store raw blockchain transaction data
  receiptSent: boolean("receipt_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
}, (table) => {
  return {
    userIdx: index("crypto_transactions_user_idx").on(table.userId),
    statusIdx: index("crypto_transactions_status_idx").on(table.status),
    walletIdx: index("crypto_transactions_wallet_idx").on(table.walletId),
  }
});

// Define exchange rates table for price conversion
export const cryptoExchangeRates = pgTable("crypto_exchange_rates", {
  id: serial("id").primaryKey(),
  cryptoType: text("crypto_type").notNull(),
  rateUsd: decimal("rate_usd", { precision: 18, scale: 8 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  source: text("source").notNull() // Source of the exchange rate data
}, (table) => {
  return {
    typeIdx: index("crypto_exchange_rates_type_idx").on(table.cryptoType),
  }
});

// Define subscription tier levels
export const tierLevelEnum = z.enum(["free", "basic", "premium", "enterprise"]);
export type TierLevel = z.infer<typeof tierLevelEnum>;

// Feature flags table to control access to features
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  enabled: boolean("enabled").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Define all relations
export const usersRelations = relations(users, ({ many }) => ({
  activityLogs: many(activityLogs),
  subscriptions: many(userSubscriptions),
  payments: many(payments),
  paymentGateways: many(clientPaymentGateways),
  cryptoWallets: many(cryptoWallets),
  cryptoTransactions: many(cryptoTransactions),
  creditTransactions: many(creditTransactions)
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  })
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  planFeatures: many(planFeatures)
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id]
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id]
  }),
  payments: many(payments)
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id]
  }),
  subscription: one(userSubscriptions, {
    fields: [payments.subscriptionId],
    references: [userSubscriptions.id]
  })
}));

export const clientPaymentGatewaysRelations = relations(clientPaymentGateways, ({ one }) => ({
  client: one(users, {
    fields: [clientPaymentGateways.clientId],
    references: [users.id]
  })
}));

export const featuresRelations = relations(features, ({ many }) => ({
  planFeatures: many(planFeatures)
}));

export const planFeaturesRelations = relations(planFeatures, ({ one }) => ({
  feature: one(features, {
    fields: [planFeatures.featureId],
    references: [features.id]
  }),
  plan: one(subscriptionPlans, {
    fields: [planFeatures.planId],
    references: [subscriptionPlans.id]
  })
}));

// Define crypto relations
export const cryptoWalletsRelations = relations(cryptoWallets, ({ one, many }) => ({
  user: one(users, {
    fields: [cryptoWallets.userId],
    references: [users.id]
  }),
  transactions: many(cryptoTransactions)
}));

export const cryptoTransactionsRelations = relations(cryptoTransactions, ({ one }) => ({
  user: one(users, {
    fields: [cryptoTransactions.userId],
    references: [users.id]
  }),
  wallet: one(cryptoWallets, {
    fields: [cryptoTransactions.walletId],
    references: [cryptoWallets.id]
  }),
  subscription: one(userSubscriptions, {
    fields: [cryptoTransactions.subscriptionId],
    references: [userSubscriptions.id]
  })
}));


// New tables for admin-to-user communication
export const adminAnnouncements = pgTable("admin_announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  importance: text("importance").default("normal"), // normal, important, urgent
  senderId: integer("sender_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at"),
  requiresResponse: boolean("requires_response").default(false),
  targetAudience: jsonb("target_audience").notNull(), // { type: "all" | "subscription" | "user", targetIds?: number[] }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  archived: boolean("archived").default(false)
});

export const announcementRecipients = pgTable("announcement_recipients", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").notNull().references(() => adminAnnouncements.id),
  userId: integer("user_id").notNull().references(() => users.id),
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  notificationSent: boolean("notification_sent").default(false),
  emailSent: boolean("email_sent").default(false)
});

export const announcementResponses = pgTable("announcement_responses", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").notNull().references(() => adminAnnouncements.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  readByAdmin: boolean("read_by_admin").default(false),
  readByAdminAt: timestamp("read_by_admin_at")
});

// Add relations for the new tables
export const adminAnnouncementsRelations = relations(adminAnnouncements, ({ one, many }) => ({
  sender: one(users, {
    fields: [adminAnnouncements.senderId],
    references: [users.id]
  }),
  recipients: many(announcementRecipients),
  responses: many(announcementResponses)
}));

export const announcementRecipientsRelations = relations(announcementRecipients, ({ one }) => ({
  announcement: one(adminAnnouncements, {
    fields: [announcementRecipients.announcementId],
    references: [adminAnnouncements.id]
  }),
  user: one(users, {
    fields: [announcementRecipients.userId],
    references: [users.id]
  })
}));

export const announcementResponsesRelations = relations(announcementResponses, ({ one }) => ({
  announcement: one(adminAnnouncements, {
    fields: [announcementResponses.announcementId],
    references: [adminAnnouncements.id]
  }),
  user: one(users, {
    fields: [announcementResponses.userId],
    references: [users.id]
  })
}));

// Add new schemas for validation
export const insertAdminAnnouncementSchema = createInsertSchema(adminAnnouncements);
export const selectAdminAnnouncementSchema = createSelectSchema(adminAnnouncements);

export const insertAnnouncementRecipientSchema = createInsertSchema(announcementRecipients);
export const selectAnnouncementRecipientSchema = createSelectSchema(announcementRecipients);

export const insertAnnouncementResponseSchema = createInsertSchema(announcementResponses);
export const selectAnnouncementResponseSchema = createSelectSchema(announcementResponses);

// Add new types
export type InsertAdminAnnouncement = typeof adminAnnouncements.$inferInsert;
export type SelectAdminAnnouncement = typeof adminAnnouncements.$inferSelect;
export type InsertAnnouncementRecipient = typeof announcementRecipients.$inferInsert;
export type SelectAnnouncementRecipient = typeof announcementRecipients.$inferSelect;
export type InsertAnnouncementResponse = typeof announcementResponses.$inferInsert;
export type SelectAnnouncementResponse = typeof announcementResponses.$inferSelect;

// Schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  role: userRoleEnum.default("user"),
  email: z.string().email("Invalid email address").optional(),
  lastLogin: z.date().optional()
});

export const selectUserSchema = createSelectSchema(users);

export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const selectActivityLogSchema = createSelectSchema(activityLogs);

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions, {
  transactionType: transactionTypeEnum,
});
export const selectCreditTransactionSchema = createSelectSchema(creditTransactions);


export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const selectSubscriptionPlanSchema = createSelectSchema(subscriptionPlans);

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions, {
  status: subscriptionStatusEnum,
});
export const selectUserSubscriptionSchema = createSelectSchema(userSubscriptions);

export const insertPaymentSchema = createInsertSchema(payments, {
  status: paymentStatusEnum,
});
export const selectPaymentSchema = createSelectSchema(payments);

export const insertClientPaymentGatewaySchema = createInsertSchema(clientPaymentGateways, {
  gatewayProvider: gatewayProviderEnum,
  status: gatewayStatusEnum.default("inactive")
});
export const selectClientPaymentGatewaySchema = createSelectSchema(clientPaymentGateways);

// Add new schemas
export const insertFeatureSchema = createInsertSchema(features);
export const selectFeatureSchema = createSelectSchema(features);

export const insertPlanFeatureSchema = createInsertSchema(planFeatures);
export const selectPlanFeatureSchema = createSelectSchema(planFeatures);

export const insertFeatureFlagSchema = createInsertSchema(featureFlags);
export const selectFeatureFlagSchema = createSelectSchema(featureFlags);

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type SelectActivityLog = typeof activityLogs.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
export type SelectCreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type SelectSubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type SelectUserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type SelectPayment = typeof payments.$inferSelect;
export type InsertClientPaymentGateway = typeof clientPaymentGateways.$inferInsert;
export type SelectClientPaymentGateway = typeof clientPaymentGateways.$inferSelect;

// Add new types
export type InsertFeature = typeof features.$inferInsert;
export type SelectFeature = typeof features.$inferSelect;
export type InsertPlanFeature = typeof planFeatures.$inferInsert;
export type SelectPlanFeature = typeof planFeatures.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;
export type SelectFeatureFlag = typeof featureFlags.$inferSelect;

// Create schemas for crypto wallet tables
export const insertCryptoWalletSchema = createInsertSchema(cryptoWallets, {
  // The private key and seed phrase need special handling for security
  privateKey: z.string().min(1),
  seedPhrase: z.string().optional()
});
export const selectCryptoWalletSchema = createSelectSchema(cryptoWallets);

export const insertCryptoTransactionSchema = createInsertSchema(cryptoTransactions);
export const selectCryptoTransactionSchema = createSelectSchema(cryptoTransactions);

export const insertCryptoExchangeRateSchema = createInsertSchema(cryptoExchangeRates);
export const selectCryptoExchangeRateSchema = createSelectSchema(cryptoExchangeRates);

// Types for crypto wallet tables
export type InsertCryptoWallet = typeof cryptoWallets.$inferInsert;
export type SelectCryptoWallet = typeof cryptoWallets.$inferSelect;
export type InsertCryptoTransaction = typeof cryptoTransactions.$inferInsert;
export type SelectCryptoTransaction = typeof cryptoTransactions.$inferSelect;
export type InsertCryptoExchangeRate = typeof cryptoExchangeRates.$inferInsert;
export type SelectCryptoExchangeRate = typeof cryptoExchangeRates.$inferSelect;

// Clone Me feature related tables and enums

// Essay tone enum for categorizing user submitted essays
export const essayToneEnum = z.enum([
  "authoritative", 
  "casual", 
  "academic", 
  "professional", 
  "conversational", 
  "formal", 
  "technical", 
  "persuasive",
  "informative",
  "humorous",
  "inspirational",
  "legal",
  "placatory",
  "firm"
]);
export type EssayTone = z.infer<typeof essayToneEnum>;

// User writing style features and analysis
export const userWritingStyles = pgTable("user_writing_styles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  // Serialized JSON data containing stylistic features
  styleFeatures: jsonb("style_features").notNull(),
  // Average metrics across all user essays
  avgSentenceLength: decimal("avg_sentence_length", { precision: 5, scale: 2 }),
  avgParagraphLength: decimal("avg_paragraph_length", { precision: 5, scale: 2 }),
  vocabularyDiversity: decimal("vocabulary_diversity", { precision: 5, scale: 2 }),
  // Extracted writing patterns
  commonPhrases: jsonb("common_phrases"),
  transitionWords: jsonb("transition_words"),
  sentenceStructures: jsonb("sentence_structures"),
  // A serialized representation of the user's fine-tuned model configuration
  modelConfig: jsonb("model_config"),
  isActive: boolean("is_active").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    userIdIdx: index("user_writing_styles_user_id_idx").on(table.userId)
  }
});

// User submitted essays for clone me feature
export const userEssays = pgTable("user_essays", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  tone: text("tone").notNull(),
  // NLP analysis results
  analysisResults: jsonb("analysis_results"),
  // Status tracking
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
}, (table) => {
  return {
    userIdIdx: index("user_essays_user_id_idx").on(table.userId),
    toneIdx: index("user_essays_tone_idx").on(table.tone)
  }
});

// Generated content using the clone me feature
export const clonedContent = pgTable("cloned_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  styleId: integer("style_id").notNull().references(() => userWritingStyles.id),
  prompt: text("prompt").notNull(),
  content: text("content").notNull(),
  requestedTone: text("requested_tone").notNull(),
  wordCount: integer("word_count").notNull(),
  // Quality metrics
  userRating: integer("user_rating"), // 1-5 stars
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    userIdIdx: index("cloned_content_user_id_idx").on(table.userId),
    styleIdIdx: index("cloned_content_style_id_idx").on(table.styleId)
  }
});

// Relations for Clone Me feature
export const userWritingStylesRelations = relations(userWritingStyles, ({ one, many }) => ({
  user: one(users, {
    fields: [userWritingStyles.userId],
    references: [users.id]
  }),
  generatedContent: many(clonedContent)
}));

export const userEssaysRelations = relations(userEssays, ({ one }) => ({
  user: one(users, {
    fields: [userEssays.userId],
    references: [users.id]
  })
}));

export const clonedContentRelations = relations(clonedContent, ({ one }) => ({
  user: one(users, {
    fields: [clonedContent.userId],
    references: [users.id]
  }),
  writingStyle: one(userWritingStyles, {
    fields: [clonedContent.styleId],
    references: [userWritingStyles.id]
  })
}));

// Update user relations to include Clone Me features
export const usersCloneMeRelations = relations(users, ({ many }) => ({
  essays: many(userEssays),
  writingStyles: many(userWritingStyles),
  clonedContent: many(clonedContent)
}));

// Schemas for validation
export const insertUserWritingStyleSchema = createInsertSchema(userWritingStyles);
export const selectUserWritingStyleSchema = createSelectSchema(userWritingStyles);

export const insertUserEssaySchema = createInsertSchema(userEssays, {
  tone: essayToneEnum,
});
export const selectUserEssaySchema = createSelectSchema(userEssays);

export const insertClonedContentSchema = createInsertSchema(clonedContent, {
  requestedTone: essayToneEnum,
  userRating: z.number().min(1).max(5).optional()
});
export const selectClonedContentSchema = createSelectSchema(clonedContent);

// Types for Clone Me feature
export type InsertUserWritingStyle = typeof userWritingStyles.$inferInsert;
export type SelectUserWritingStyle = typeof userWritingStyles.$inferSelect;
export type InsertUserEssay = typeof userEssays.$inferInsert;
export type SelectUserEssay = typeof userEssays.$inferSelect;
export type InsertClonedContent = typeof clonedContent.$inferInsert;
export type SelectClonedContent = typeof clonedContent.$inferSelect;