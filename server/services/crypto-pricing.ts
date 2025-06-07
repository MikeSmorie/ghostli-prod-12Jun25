interface CryptoPrices {
  bitcoin: { usd: number };
  solana: { usd: number };
}

interface CryptoQuote {
  amount: string;
  symbol: string;
  usdValue: number;
  price: number;
  formattedAmount: string;
}

export class CryptoPricingService {
  private static cachedPrices: CryptoPrices | null = null;
  private static lastFetch: number = 0;
  private static CACHE_DURATION = 60 * 1000; // 1 minute cache

  static async getCurrentPrices(): Promise<CryptoPrices> {
    const now = Date.now();
    
    // Return cached prices if still fresh
    if (this.cachedPrices && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedPrices;
    }

    try {
      // CoinGecko API - free tier, no API key required
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=usd'
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const prices = await response.json();
      
      this.cachedPrices = prices;
      this.lastFetch = now;
      
      console.log('[CRYPTO-PRICING] Updated prices:', prices);
      return prices;
    } catch (error) {
      console.error('[CRYPTO-PRICING] Error fetching prices:', error);
      
      // Return last cached prices if available
      if (this.cachedPrices) {
        console.log('[CRYPTO-PRICING] Using cached prices due to fetch error');
        return this.cachedPrices;
      }
      
      // Fallback to approximate prices if no cache available
      console.log('[CRYPTO-PRICING] Using fallback prices');
      return {
        bitcoin: { usd: 45000 },
        solana: { usd: 100 }
      };
    }
  }

  static async getQuoteForUSD(usdAmount: number): Promise<{
    bitcoin: CryptoQuote;
    solana: CryptoQuote;
  }> {
    const prices = await this.getCurrentPrices();
    
    const btcAmount = usdAmount / prices.bitcoin.usd;
    const solAmount = usdAmount / prices.solana.usd;

    return {
      bitcoin: {
        amount: btcAmount.toFixed(8),
        symbol: 'BTC',
        usdValue: usdAmount,
        price: prices.bitcoin.usd,
        formattedAmount: `${btcAmount.toFixed(8)} BTC`
      },
      solana: {
        amount: solAmount.toFixed(6),
        symbol: 'SOL',
        usdValue: usdAmount,
        price: prices.solana.usd,
        formattedAmount: `${solAmount.toFixed(6)} SOL`
      }
    };
  }

  static async validateCryptoPayment(
    cryptoAmount: number,
    cryptoSymbol: string,
    expectedUSD: number,
    tolerancePercent: number = 2
  ): Promise<boolean> {
    try {
      const prices = await this.getCurrentPrices();
      
      let actualUSD: number;
      if (cryptoSymbol.toLowerCase() === 'btc') {
        actualUSD = cryptoAmount * prices.bitcoin.usd;
      } else if (cryptoSymbol.toLowerCase() === 'sol') {
        actualUSD = cryptoAmount * prices.solana.usd;
      } else {
        return false;
      }

      const difference = Math.abs(actualUSD - expectedUSD);
      const toleranceAmount = expectedUSD * (tolerancePercent / 100);
      
      console.log('[CRYPTO-VALIDATION]', {
        cryptoAmount,
        cryptoSymbol,
        actualUSD,
        expectedUSD,
        difference,
        toleranceAmount,
        valid: difference <= toleranceAmount
      });

      return difference <= toleranceAmount;
    } catch (error) {
      console.error('[CRYPTO-VALIDATION] Error:', error);
      return false;
    }
  }
}