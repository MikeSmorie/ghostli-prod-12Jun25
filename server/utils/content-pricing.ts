// Content generation pricing configuration
export const CONTENT_PRICING = {
  // Credits required per generation by tier
  LITE_CREDITS_PER_GENERATION: 10,
  PRO_CREDITS_PER_GENERATION: 5,
  PREMIUM_CREDITS_PER_GENERATION: 3,
  
  // Special feature costs
  CLONE_ME_CREDITS: 20,
  PLAGIARISM_CHECK_CREDITS: 5,
  EXPORT_PDF_CREDITS: 2,
  EXPORT_WORD_CREDITS: 2,
  
  // Bulk generation discounts
  BULK_GENERATION_THRESHOLD: 10, // Minimum for bulk discount
  BULK_DISCOUNT_PERCENT: 0.20, // 20% discount for bulk
} as const;

// Helper function to get credits cost based on user tier
export function getContentGenerationCost(userTier: string): number {
  switch (userTier.toLowerCase()) {
    case 'lite':
    case 'basic':
      return CONTENT_PRICING.LITE_CREDITS_PER_GENERATION;
    case 'pro':
    case 'premium':
      return CONTENT_PRICING.PRO_CREDITS_PER_GENERATION;
    case 'enterprise':
      return CONTENT_PRICING.PREMIUM_CREDITS_PER_GENERATION;
    default:
      return CONTENT_PRICING.LITE_CREDITS_PER_GENERATION; // Default to highest cost
  }
}

// Helper function to calculate cost for special features
export function getFeatureCost(featureName: string): number {
  switch (featureName.toLowerCase()) {
    case 'clone_me':
      return CONTENT_PRICING.CLONE_ME_CREDITS;
    case 'plagiarism_check':
      return CONTENT_PRICING.PLAGIARISM_CHECK_CREDITS;
    case 'export_pdf':
      return CONTENT_PRICING.EXPORT_PDF_CREDITS;
    case 'export_word':
      return CONTENT_PRICING.EXPORT_WORD_CREDITS;
    default:
      return 0;
  }
}

// Helper function to calculate bulk discount
export function calculateBulkCost(
  baseCost: number, 
  quantity: number
): { totalCost: number; discount: number; savings: number } {
  const originalTotal = baseCost * quantity;
  
  if (quantity >= CONTENT_PRICING.BULK_GENERATION_THRESHOLD) {
    const discount = CONTENT_PRICING.BULK_DISCOUNT_PERCENT;
    const totalCost = Math.floor(originalTotal * (1 - discount));
    const savings = originalTotal - totalCost;
    
    return {
      totalCost,
      discount: Math.round(discount * 100),
      savings
    };
  }
  
  return {
    totalCost: originalTotal,
    discount: 0,
    savings: 0
  };
}