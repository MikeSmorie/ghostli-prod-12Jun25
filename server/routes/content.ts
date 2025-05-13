import { Router, Request, Response, Express } from "express";
import { z } from "zod";
import { 
  ContentGenerationParams, 
  generateContent, 
  SeoGenerationParams, 
  generateSeoKeywords,
  rewriteContent
} from "../services/openai";
import { checkPlagiarism, rephraseContent, addCitations } from "../services/plagiarismDetection";
import { isFeatureEnabled } from "../services/featureFlags";
import OpenAI from "openai";

// Schema for keyword frequency requirements
const KeywordFrequencySchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  occurrences: z.number().int().min(1).max(50).default(1),
});

// Schema for required source specification
const RequiredSourceSchema = z.object({
  source: z.string().min(1, "Source name is required"),
  url: z.string().url().optional(),
  priority: z.number().int().min(1).max(5).default(3), // 1 = highest priority, 5 = lowest
});

// Schema for content generation request - simplified and more robust
const ContentGenerationRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  
  // Allow any string for these fields with defaults
  preferredHeadline: z.string().optional().default(""),
  tone: z.string().default("professional"),
  brandArchetype: z.string().default("sage"),
  
  // Coerce numeric fields and provide sensible defaults
  wordCount: z.coerce.number().int().default(1000),
  
  // Handle all boolean fields with defaults
  antiAIDetection: z.preprocess(
    // Convert various formats to boolean
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  prioritizeUndetectable: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  isRewrite: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  
  // Accept either enum or string for english variant
  englishVariant: z.union([
    z.enum(["us", "uk"]),
    z.string().transform(val => val === "uk" ? "uk" : "us")
  ]).default("us"),
  
  // Keep other string fields simple
  websiteUrl: z.string().optional().default(""),
  regionFocus: z.string().optional().default(""),
  
  // Boolean fields with preprocessing for robustness
  copyWebsiteStyle: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  useWebsiteContent: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  
  // Handle arrays with preprocessing
  requiredKeywords: z.preprocess(
    (val) => Array.isArray(val) ? val : [],
    z.array(z.any()).default([])
  ),
  requiredSources: z.preprocess(
    (val) => Array.isArray(val) ? val : [],
    z.array(z.any()).default([])
  ),
  
  // More boolean settings
  restrictToRequiredSources: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  
  // Numeric fields with coercion and defaults
  typosPercentage: z.coerce.number().default(3.0),
  grammarMistakesPercentage: z.coerce.number().default(3.0),
  humanMisErrorsPercentage: z.coerce.number().default(3.0),
  
  // More boolean flags
  generateSEO: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(true)
  ),
  generateHashtags: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(true)
  ),
  generateKeywords: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(true)
  ),
  includeCitations: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  checkDuplication: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  addRhetoricalElements: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(true)
  ),
  strictToneAdherence: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  runSelfAnalysis: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  legalCompliance: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  technicalAccuracy: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  simplifyLanguage: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  inclusiveLanguage: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  addEmotionalImpact: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  
  // More numeric fields
  maxIterations: z.coerce.number().default(5),
  wordCountTolerance: z.coerce.number().default(0.1),
  
  // Final boolean fields
  runAIDetectionTest: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  generateBibliography: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  useFootnotes: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  )
})
.passthrough(); // Allow any additional fields to pass through

// Schema for SEO keyword generation request
const SeoGenerationRequestSchema = z.object({
  content: z.string().min(1, "Content is required")
});

/**
 * Register content generation routes on the Express app
 * @param app Express application instance
 */

// Initialize a separate OpenAI client for testing
const testOpenAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function registerContentRoutes(app: Express) {
  /**
   * Test OpenAI API connection directly
   * GET /api/openai-test
   */
  app.get("/api/openai-test", async (req: Request, res: Response) => {
    try {
      console.log("Testing OpenAI API connection directly...");
      console.log("API Key exists:", Boolean(process.env.OPENAI_API_KEY));
      console.log("API Key first 5 chars:", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 5) + '...' : 'N/A');
      
      const response = await testOpenAI.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say hello world" }
        ],
        max_tokens: 10
      });
      
      return res.json({
        success: true,
        message: response.choices[0].message.content,
        model: "gpt-3.5-turbo",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("OpenAI test error:", error);
      return res.status(500).json({
        success: false,
        error: "OpenAI test failed",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Generate content using OpenAI
   * POST /api/content/generate
   */
  app.post("/api/content/generate", async (req: Request, res: Response) => {
    try {
      // Log the request body for debugging
      console.log("Content generation request body:", JSON.stringify(req.body, null, 2));
      
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
      
      try {
        // Determine whether to generate content or rewrite existing content
        let result;
        
        if (params.isRewrite) {
          // Use the rewriteContent function for rewriting
          result = await rewriteContent(params);
        } else {
          // Use the generateContent function for new content
          result = await generateContent(params);
        }
        
        // Return the generated content
        return res.json({
          content: result.content,
          contentWithFootnotes: result.contentWithFootnotes,
          bibliography: result.bibliography || [],
          keywordUsage: result.keywordUsage || [],
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
      } catch (error) {
        console.error("OpenAI API error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Content generation error:", error);
      
      return res.status(500).json({
        error: "Content generation failed",
        message: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });

  /**
   * Rewrite content to make it undetectable by AI detection tools
   * POST /api/content/rewrite
   */
  app.post("/api/content/rewrite", async (req: Request, res: Response) => {
    try {
      // Log the request body for debugging
      console.log("Content rewrite request body:", JSON.stringify(req.body, null, 2));
      
      // Validate request body
      const validationResult = ContentGenerationRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request parameters",
          details: validationResult.error.format()
        });
      }
      
      // Extract validated parameters and force isRewrite to true
      const params: ContentGenerationParams = {
        ...validationResult.data,
        isRewrite: true
      };
      
      // Check for API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API key is not configured",
          message: "Please set the OPENAI_API_KEY environment variable"
        });
      }
      
      try {
        // Use the rewriteContent function
        const result = await rewriteContent(params);
        
        // Return the rewritten content
        return res.json({
          content: result.content,
          contentWithFootnotes: result.contentWithFootnotes,
          bibliography: result.bibliography || [],
          keywordUsage: result.keywordUsage || [],
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
      } catch (error) {
        console.error("OpenAI API error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Content rewriting error:", error);
      
      return res.status(500).json({
        error: "Content rewriting failed",
        message: error instanceof Error ? error.message : "An unknown error occurred"
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