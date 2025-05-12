import { Express, Request, Response } from "express";
import { db } from "@db";
import { featureFlags, insertFeatureFlagSchema } from "@db/schema";
import { eq } from "drizzle-orm";
import { isFeatureEnabled, getUserFeatures } from "../services/featureFlags";
import { authenticateJWT, requireRole } from "../auth";

// Register feature flag related routes
export function registerFeatureRoutes(app: Express) {
  // Get all feature flags
  app.get("/api/admin/features", authenticateJWT, requireRole("admin"), async (req, res) => {
    try {
      const allFlags = await db
        .select()
        .from(featureFlags);
      
      res.json(allFlags);
    } catch (error: any) {
      console.error("Error fetching feature flags:", error);
      res.status(500).json({ message: "Failed to fetch feature flags", error: error.message });
    }
  });

  // Create or update a feature flag
  app.post("/api/admin/features", authenticateJWT, requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertFeatureFlagSchema.parse(req.body);
      
      // Check if feature already exists
      const existingFeature = await db
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.featureName, validatedData.featureName))
        .limit(1);
      
      if (existingFeature.length > 0) {
        // Update existing feature
        const result = await db
          .update(featureFlags)
          .set({
            featureName: validatedData.featureName,
            isEnabled: validatedData.isEnabled,
            tierLevel: validatedData.tierLevel,
            description: validatedData.description,
            updatedAt: new Date()
          })
          .where(eq(featureFlags.id, existingFeature[0].id))
          .returning();
        
        res.json(result[0]);
      } else {
        // Create new feature
        const result = await db
          .insert(featureFlags)
          .values({
            featureName: validatedData.featureName,
            isEnabled: validatedData.isEnabled,
            tierLevel: validatedData.tierLevel,
            description: validatedData.description,
            createdAt: new Date()
          })
          .returning();
        
        res.status(201).json(result[0]);
      }
    } catch (error: any) {
      console.error("Error creating/updating feature flag:", error);
      res.status(400).json({ message: "Failed to create/update feature flag", error: error.message });
    }
  });

  // Delete a feature flag
  app.delete("/api/admin/features/:featureName", authenticateJWT, requireRole("admin"), async (req, res) => {
    try {
      const { featureName } = req.params;
      
      const result = await db
        .delete(featureFlags)
        .where(eq(featureFlags.featureName, featureName))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: "Feature flag not found" });
      }
      
      res.json({ message: "Feature flag deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting feature flag:", error);
      res.status(500).json({ message: "Failed to delete feature flag", error: error.message });
    }
  });

  // Check if a specific feature is enabled for the current user
  app.get("/api/features/:featureName", authenticateJWT, async (req, res) => {
    try {
      const { featureName } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const hasAccess = await isFeatureEnabled(featureName, userId);
      
      res.json({ featureName, hasAccess });
    } catch (error: any) {
      console.error(`Error checking feature access for ${req.params.featureName}:`, error);
      res.status(500).json({ message: "Failed to check feature access", error: error.message });
    }
  });

  // Get all features with access status for the current user
  app.get("/api/features", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // For testing purposes, return hardcoded features
      const testFeatures = [
        {
          featureName: "proWritingBrief",
          isEnabled: true,
          tierLevel: "premium",
          description: "Structured writing brief form for professional content creation",
          userHasAccess: true
        },
        {
          featureName: "liteWritingBrief",
          isEnabled: true,
          tierLevel: "basic",
          description: "Simplified writing brief form for Lite users",
          userHasAccess: true
        }
      ];
      
      res.json(testFeatures);
    } catch (error: any) {
      console.error("Error fetching user features:", error);
      res.status(500).json({ message: "Failed to fetch user features", error: error.message });
    }
  });
}