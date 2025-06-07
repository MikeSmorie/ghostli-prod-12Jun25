import express from "express";
import { CryptoPricingService } from "../services/crypto-pricing.js";

const router = express.Router();

// Get real-time crypto quotes for USD amount
router.post("/quote", async (req, res) => {
  try {
    const { usdAmount } = req.body;
    
    if (!usdAmount || usdAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Valid USD amount required" 
      });
    }

    const quotes = await CryptoPricingService.getQuoteForUSD(parseFloat(usdAmount));
    
    res.json({
      success: true,
      usdAmount: parseFloat(usdAmount),
      quotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Crypto quote error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch crypto quotes" 
    });
  }
});

// Get current crypto prices
router.get("/prices", async (req, res) => {
  try {
    const prices = await CryptoPricingService.getCurrentPrices();
    
    res.json({
      success: true,
      prices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Crypto prices error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch crypto prices" 
    });
  }
});

export default router;