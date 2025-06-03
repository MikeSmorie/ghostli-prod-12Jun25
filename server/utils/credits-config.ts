// Credit system configuration
export const CREDITS_CONFIG = {
  // Credit conversion rates
  CREDITS_PER_DOLLAR: 100, // 100 credits per $1 USD
  
  // Minimum purchase amounts
  MIN_PURCHASE_USD: 1.00,
  MIN_CREDITS: 100,
  
  // Payment method settings
  PAYPAL_CURRENCY: "USD",
  BITCOIN_CURRENCY: "USD", // USD equivalent for BTC payments
  
  // Transaction fees (if any)
  PAYPAL_FEE_PERCENT: 0.00, // No additional fee for now
  BITCOIN_FEE_PERCENT: 0.00, // No additional fee for now
} as const;

// Helper function to convert USD amount to credits
export function convertUsdToCredits(usdAmount: number): number {
  return Math.floor(usdAmount * CREDITS_CONFIG.CREDITS_PER_DOLLAR);
}

// Helper function to convert credits to USD
export function convertCreditsToUsd(credits: number): number {
  return credits / CREDITS_CONFIG.CREDITS_PER_DOLLAR;
}