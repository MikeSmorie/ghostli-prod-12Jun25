export const ProductionConfig = {
  // Rate Limiting Configuration
  rateLimits: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // requests per window per IP
    },
    contentGeneration: {
      windowMs: 60 * 1000, // 1 minute
      max: 50, // content generations per minute per IP
    },
    aiDetection: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // AI detections per minute per IP
    },
    payment: {
      windowMs: 60 * 1000, // 1 minute
      max: 50, // payment attempts per minute per IP
    },
  },

  // OpenAI Configuration for Production
  openai: {
    maxRetries: 3,
    timeout: 30000, // 30 seconds
    maxTokens: {
      free: 4000,
      pro: 8000,
    },
    costTracking: {
      gpt4: 0.03, // per 1K tokens
      gpt35: 0.002, // per 1K tokens
    },
    rateLimits: {
      requestsPerMinute: 50,
      tokensPerMinute: 40000,
    },
  },

  // Database Configuration
  database: {
    connectionTimeout: 10000,
    queryTimeout: 30000,
    maxConnections: 20,
  },

  // Monitoring Configuration
  monitoring: {
    bufferSize: 100,
    flushInterval: 30000, // 30 seconds
    alertThresholds: {
      errorRate: 0.05, // 5% error rate
      avgResponseTime: 5000, // 5 seconds
      costPerHour: 10.00, // $10/hour
    },
  },

  // PayPal Configuration
  paypal: {
    timeout: 30000,
    retries: 2,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  },

  // Performance Configuration
  performance: {
    compressionLevel: 6,
    staticCacheMaxAge: 31536000, // 1 year
    jsonLimit: '10mb',
    enableKeepAlive: true,
  },
};