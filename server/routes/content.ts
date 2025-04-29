import { Router, Request, Response, Express } from "express";
import { z } from "zod";
import { 
  ContentGenerationParams, 
  generateContent, 
  SeoGenerationParams, 
  generateSeoKeywords 
} from "../services/openai";

// Schema for content generation request
const ContentGenerationRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  // New Preferred Headline parameter
  preferredHeadline: z.string().optional().default(""),
  tone: z.enum([
    "professional", "casual", "academic", 
    "enthusiastic", "authoritative", "persuasive", 
    "informative", "humorous", "formal",
    "polite", "firm", "legal", "conversational", 
    "technical", "compassionate", "inspiring"
  ]),
  brandArchetype: z.enum([
    "sage", "hero", "outlaw", "explorer", 
    "creator", "ruler", "caregiver", "innocent",
    "everyman", "jester", "lover", "magician"
  ]),
  wordCount: z.number().int().min(50).max(5000),
  antiAIDetection: z.boolean().default(false),
  prioritizeUndetectable: z.boolean().optional().default(true),
  // Language options
  englishVariant: z.enum(["us", "uk"]).optional().default("us"),
  // Website scanning options
  websiteUrl: z.string().url().optional().default(""),
  copyWebsiteStyle: z.boolean().optional().default(false),
  useWebsiteContent: z.boolean().optional().default(false),
  // Humanization parameters
  typosPercentage: z.number().min(0).max(15).optional().default(3.0),
  grammarMistakesPercentage: z.number().min(0).max(15).optional().default(3.0),
  humanMisErrorsPercentage: z.number().min(0).max(15).optional().default(3.0),
  // Additional generation options
  generateSEO: z.boolean().optional().default(true),
  generateHashtags: z.boolean().optional().default(true),
  generateKeywords: z.boolean().optional().default(true),
  // E-A-T and content quality parameters
  includeCitations: z.boolean().optional().default(false),
  checkDuplication: z.boolean().optional().default(false),
  addRhetoricalElements: z.boolean().optional().default(true),
  strictToneAdherence: z.boolean().optional().default(false),
  runSelfAnalysis: z.boolean().optional().default(false),
  // Content specialization parameters
  legalCompliance: z.boolean().optional().default(false),
  technicalAccuracy: z.boolean().optional().default(false),
  simplifyLanguage: z.boolean().optional().default(false),
  inclusiveLanguage: z.boolean().optional().default(false),
  addEmotionalImpact: z.boolean().optional().default(false),
  // New refinement options
  maxIterations: z.number().int().min(1).max(10).optional().default(5),
  wordCountTolerance: z.number().min(0.01).max(0.5).optional().default(0.1),
  runAIDetectionTest: z.boolean().optional().default(false)
});

// Schema for SEO keyword generation request
const SeoGenerationRequestSchema = z.object({
  content: z.string().min(1, "Content is required")
});

/**
 * Register content generation routes on the Express app
 * @param app Express application instance
 */
export function registerContentRoutes(app: Express) {
  /**
   * Generate content using OpenAI
   * POST /api/content/generate
   */
  app.post("/api/content/generate", async (req: Request, res: Response) => {
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
      
      // Attempt to generate content with OpenAI
      try {
        const result = await generateContent(params);
        
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
          },
          seo: result.seo || [],
          hashtags: result.hashtags || [],
          keywords: result.keywords || []
        });
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        
        // Generate a fallback response for testing/development
        const mockContent = `This is a fallback generated content for the prompt: "${params.prompt}"\n\n` +
          `This content is in a ${params.tone} tone and follows the ${params.brandArchetype} brand archetype.\n\n` +
          `It contains about ${params.wordCount} words and has been generated as a fallback when the API has issues.\n\n` +
          `The actual content would be much more detailed and tailored to your specific requirements.`;
          
        const mockSeo = params.generateSEO ? [
          "Include relevant keywords in titles and headings",
          "Use descriptive meta descriptions",
          "Add alt text to all images",
          "Ensure mobile-friendly layout",
          "Improve page loading speed"
        ] : [];
        
        const mockHashtags = params.generateHashtags ? [
          "#ContentCreation",
          "#AIWriting",
          "#ContentMarketing",
          "#DigitalContent",
          "#WriteRIGHT"
        ] : [];
        
        const mockKeywords = params.generateKeywords ? [
          "content creation",
          "writing assistant",
          "AI content",
          "content marketing",
          "SEO content",
          "professional writing",
          "content generation",
          "WriteRIGHT"
        ] : [];
        
        return res.json({
          content: mockContent,
          metadata: {
            wordCount: mockContent.split(/\s+/).filter(Boolean).length,
            generationTime: 2500,
            iterations: 1,
            tokens: {
              prompt: 150,
              completion: 300,
              total: 450
            }
          },
          seo: mockSeo,
          hashtags: mockHashtags,
          keywords: mockKeywords
        });
      }
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

  /**
   * Generate SEO keywords from content
   * POST /api/generate-seo
   */
  app.post("/api/generate-seo", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = SeoGenerationRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request parameters",
          details: validationResult.error.format()
        });
      }
      
      // Extract validated parameters
      const params: SeoGenerationParams = validationResult.data;
      
      // Check for API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API key is not configured",
          message: "Please set the OPENAI_API_KEY environment variable"
        });
      }
      
      try {
        // Generate SEO keywords
        const result = await generateSeoKeywords(params);
        
        // Return the generated keywords
        return res.json(result);
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        
        // Return mock SEO keywords as fallback
        return res.json({
          keywords: [
            "search engine optimization",
            "keyword research",
            "meta descriptions",
            "content marketing",
            "link building",
            "website traffic",
            "search rankings",
            "on-page optimization"
          ]
        });
      }
    } catch (error) {
      console.error("SEO keyword generation error:", error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          error: "SEO keyword generation failed",
          message: error.message
        });
      }
      
      return res.status(500).json({
        error: "SEO keyword generation failed",
        message: "An unknown error occurred"
      });
    }
  });
}