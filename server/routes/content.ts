import { Router, Request, Response, Express } from "express";
import { z } from "zod";
import { ContentGenerationParams, generateContent } from "../services/openai";

// Schema for content generation request
const ContentGenerationRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  tone: z.enum([
    "professional", "casual", "persuasive", 
    "informative", "humorous", "formal"
  ]),
  brandArchetype: z.enum([
    "sage", "hero", "outlaw", "explorer", 
    "creator", "ruler", "caregiver", "innocent",
    "everyman", "jester", "lover", "magician"
  ]),
  wordCount: z.number().int().min(50).max(1000),
  antiAIDetection: z.boolean().default(false)
});

/**
 * Register content generation routes on the Express app
 * @param app Express application instance
 */
export function registerContentRoutes(app: Express) {
  /**
   * Generate content using OpenAI
   * POST /api/generate-content
   */
  app.post("/api/generate-content", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = ContentGenerationRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request parameters",
          details: validationResult.error.format()
        });
      }
      
      // Extract validated parameters
      const params: ContentGenerationParams = validationResult.data;
      
      // Check for API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API key is not configured",
          message: "Please set the OPENAI_API_KEY environment variable"
        });
      }
      
      // Generate content
      const result = await generateContent(params);
      
      // Return the generated content with metadata
      return res.json({
        content: result.content,
        metadata: {
          wordCount: result.metadata.wordCount,
          generationTime: result.metadata.endTime.getTime() - result.metadata.startTime.getTime(),
          iterations: result.metadata.iterations,
          tokens: {
            prompt: result.metadata.promptTokens,
            completion: result.metadata.completionTokens,
            total: result.metadata.totalTokens
          }
        }
      });
    } catch (error) {
      console.error("Content generation error:", error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          error: "Content generation failed",
          message: error.message
        });
      }
      
      return res.status(500).json({
        error: "Content generation failed",
        message: "An unknown error occurred"
      });
    }
  });
}