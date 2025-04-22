import { Request, Response, Express } from "express";
import { openAIService } from "../services/openai";
import { z } from "zod";
import { logActivity, logError } from "../middleware/logger";

// Validation schema for content generation request
const contentGenerationSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters long"),
  tone: z.string().min(1, "Tone is required"),
  archetype: z.string().min(1, "Brand archetype is required"),
  targetWordCount: z.number().int().min(50).max(5000)
});

export function registerContentRoutes(app: Express) {
  // Generate content endpoint
  app.post("/api/content/generate", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = contentGenerationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request parameters", 
          details: validation.error.format() 
        });
      }
      
      // Log the content generation attempt
      if (req.user) {
        await logActivity(req.user.id, "content_generation_attempt", 
          `Prompt: ${req.body.prompt.substring(0, 50)}... | Tone: ${req.body.tone} | Archetype: ${req.body.archetype} | Target Word Count: ${req.body.targetWordCount}`
        );
      }
      
      // Generate content
      const result = await openAIService.generateContent({
        prompt: req.body.prompt,
        tone: req.body.tone,
        archetype: req.body.archetype,
        targetWordCount: req.body.targetWordCount
      });
      
      // Log successful content generation
      if (req.user) {
        await logActivity(req.user.id, "content_generation_success", 
          `Word Count: ${result.actualWordCount} | Iterations: ${result.iterationCount} | Processing Time: ${result.processingTimeMs}ms`
        );
      }
      
      return res.status(200).json({
        content: result.content,
        metadata: {
          wordCount: result.actualWordCount,
          iterationCount: result.iterationCount,
          processingTimeMs: result.processingTimeMs
        }
      });
    } catch (error) {
      await logError(error as Error, "content_generation_endpoint");
      return res.status(500).json({ 
        error: "Content generation failed", 
        message: (error as Error).message 
      });
    }
  });
  
  // Endpoint to analyze existing content
  app.post("/api/content/analyze", async (req: Request, res: Response) => {
    const { content } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }
    
    try {
      // Simple stats for now, could be expanded in future
      const wordCount = content.trim().split(/\s+/).length;
      
      return res.status(200).json({
        wordCount,
        characterCount: content.length,
        estimatedReadingTimeMinutes: Math.ceil(wordCount / 200) // Assumes 200 words per minute reading speed
      });
    } catch (error) {
      await logError(error as Error, "content_analysis_endpoint");
      return res.status(500).json({ 
        error: "Content analysis failed", 
        message: (error as Error).message 
      });
    }
  });
}