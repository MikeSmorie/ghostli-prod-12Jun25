import { Router, Request, Response, Express } from "express";
import { z } from "zod";
import { authenticateJWT } from "../auth";
import { VoucherService } from "../services/voucher-service";

// Validation schemas
const RedeemVoucherSchema = z.object({
  voucherCode: z.string().min(1, "Voucher code is required").max(50),
});

const CreateVoucherSchema = z.object({
  voucherCode: z.string().min(3).max(50),
  type: z.enum(["discount", "referral"]),
  valueType: z.enum(["credits", "percentage_discount", "dollar_discount"]),
  valueAmount: z.number().min(0),
  maxUses: z.number().min(1).optional(),
  perUserLimit: z.number().min(1).optional(),
  expiryDate: z.string().optional(),
  tierRestriction: z.string().optional(),
  referralSourceUserId: z.number().optional(),
});

const ToggleVoucherSchema = z.object({
  voucherId: z.number().min(1),
  isActive: z.boolean(),
});

export function registerVoucherRoutes(app: Express) {
  
  /**
   * Redeem a voucher code
   * POST /api/voucher/redeem
   */
  app.post("/api/voucher/redeem", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const validation = RedeemVoucherSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid voucher code format",
          errors: validation.error.format()
        });
      }

      const { voucherCode } = validation.data;
      const userId = req.user?.id;
      const userTier = req.user?.subscriptionTier || "FREE";

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const result = await VoucherService.redeemVoucher(voucherCode, userId, userTier);
      
      return res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
      console.error("Error in voucher redemption:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  /**
   * Get user's referral code and stats
   * GET /api/voucher/referral
   */
  app.get("/api/voucher/referral", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      // Check if referral program is enabled
      const isEnabled = await VoucherService.isReferralProgramEnabled();
      if (!isEnabled) {
        return res.status(403).json({
          success: false,
          message: "Referral program is currently disabled"
        });
      }

      // Generate referral code if doesn't exist
      const referralCode = await VoucherService.generateUserReferralCode(userId);
      
      // Get referral stats
      const stats = await VoucherService.getReferralStats(userId);

      return res.json({
        success: true,
        referralCode,
        stats: stats || {
          totalReferrals: 0,
          totalCreditsEarned: 0,
          referralCode,
          recentReferrals: []
        }
      });

    } catch (error) {
      console.error("Error getting referral info:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get referral information"
      });
    }
  });

  /**
   * Create a new voucher (Admin only)
   * POST /api/voucher/create
   */
  app.post("/api/voucher/create", authenticateJWT, async (req: Request, res: Response) => {
    try {
      // Check admin privileges
      if (req.user?.role !== "admin" && req.user?.role !== "supergod") {
        return res.status(403).json({
          success: false,
          message: "Admin privileges required"
        });
      }

      const validation = CreateVoucherSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid voucher data",
          errors: validation.error.format()
        });
      }

      const voucherData = validation.data;
      
      // Parse expiry date if provided
      let expiryDate: Date | undefined;
      if (voucherData.expiryDate) {
        expiryDate = new Date(voucherData.expiryDate);
        if (isNaN(expiryDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid expiry date format"
          });
        }
      }

      const result = await VoucherService.createVoucher({
        ...voucherData,
        expiryDate
      }, req.user.id);

      return res.status(result.success ? 201 : 400).json(result);

    } catch (error) {
      console.error("Error creating voucher:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create voucher"
      });
    }
  });

  /**
   * Get all vouchers with usage stats (Admin only)
   * GET /api/voucher/admin/list
   */
  app.get("/api/voucher/admin/list", authenticateJWT, async (req: Request, res: Response) => {
    try {
      // Check admin privileges
      if (req.user?.role !== "admin" && req.user?.role !== "supergod") {
        return res.status(403).json({
          success: false,
          message: "Admin privileges required"
        });
      }

      const vouchers = await VoucherService.getAllVouchers();

      return res.json({
        success: true,
        vouchers
      });

    } catch (error) {
      console.error("Error getting vouchers:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get vouchers"
      });
    }
  });

  /**
   * Toggle voucher active status (Admin only)
   * POST /api/voucher/admin/toggle
   */
  app.post("/api/voucher/admin/toggle", authenticateJWT, async (req: Request, res: Response) => {
    try {
      // Check admin privileges
      if (req.user?.role !== "admin" && req.user?.role !== "supergod") {
        return res.status(403).json({
          success: false,
          message: "Admin privileges required"
        });
      }

      const validation = ToggleVoucherSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: validation.error.format()
        });
      }

      const { voucherId, isActive } = validation.data;
      const success = await VoucherService.toggleVoucherStatus(voucherId, isActive);

      return res.json({
        success,
        message: success ? "Voucher status updated" : "Failed to update voucher status"
      });

    } catch (error) {
      console.error("Error toggling voucher status:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update voucher status"
      });
    }
  });

  /**
   * Check voucher validity without redeeming
   * POST /api/voucher/validate
   */
  app.post("/api/voucher/validate", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const validation = RedeemVoucherSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid voucher code format"
        });
      }

      const { voucherCode } = validation.data;
      
      // This is a simplified validation - in production you might want more detailed validation
      // For now, we'll use the redeem logic but not actually redeem
      const userId = req.user?.id;
      const userTier = req.user?.subscriptionTier || "FREE";

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      // Note: This is a validation endpoint, so we'd need a separate validation method
      // For now, returning basic success response
      return res.json({
        success: true,
        message: "Voucher validation endpoint - implementation needed",
        valid: false
      });

    } catch (error) {
      console.error("Error validating voucher:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to validate voucher"
      });
    }
  });
}