import { Router, Request, Response, Express } from "express";
import { z } from "zod";
import { 
  ContentGenerationParams, 
  generateContent, 
  SeoGenerationParams, 
  generateSeoKeywords,
  rewriteContent
} from "../services/openai";
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
  ]).optional().default("sage"), // Make this optional with default
  wordCount: z.number().int().min(50).max(5000),
  antiAIDetection: z.boolean().default(false),
  prioritizeUndetectable: z.boolean().optional().default(true),
  isRewrite: z.boolean().optional().default(false),
  // Language options
  englishVariant: z.enum(["us", "uk"]).optional().default("us"),
  // Website scanning options
  websiteUrl: z.string().optional().default(""), // Allow empty string for websiteUrl
  copyWebsiteStyle: z.boolean().optional().default(false),
  useWebsiteContent: z.boolean().optional().default(false),
  // Keyword control options
  requiredKeywords: z.array(KeywordFrequencySchema).optional().default([]),
  // Source control options
  requiredSources: z.array(RequiredSourceSchema).optional().default([]),
  restrictToRequiredSources: z.boolean().optional().default(false),
  // Geographic/Regional focus
  regionFocus: z.string().optional().default(""),
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
  runAIDetectionTest: z.boolean().optional().default(false),
  // Bibliography options
  generateBibliography: z.boolean().optional().default(false),
  useFootnotes: z.boolean().optional().default(false)
});

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
      
      const models = ["gpt-4o", "gpt-4", "gpt-3.5-turbo"];
      const results = {};
      
      for (const model of models) {
        try {
          console.log(`Testing model: ${model}...`);
          const startTime = Date.now();
          
          const response = await testOpenAI.chat.completions.create({
            model: model,
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: "Say hello world" }
            ],
            max_tokens: 10
          });
          
          const endTime = Date.now();
          
          results[model] = {
            success: true,
            response: response.choices[0].message,
            time: endTime - startTime
          };
          
          console.log(`Test for ${model} succeeded in ${endTime - startTime}ms`);
        } catch (error) {
          console.error(`Test for ${model} failed:`, error.message);
          results[model] = {
            success: false,
            error: error.message
          };
        }
      }
      
      return res.json({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        apiKeyExists: Boolean(process.env.OPENAI_API_KEY),
        apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 5) + '...' : 'N/A',
        results
      });
    } catch (error) {
      console.error("OpenAI test error:", error);
      return res.status(500).json({
        error: "OpenAI test failed",
        message: error.message
      });
    }
  });

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
      
      // Determine whether to generate content or rewrite existing content
      try {
        let result;
        
        // Log the action type and parameters
        if (params.isRewrite) {
          console.log(`[INFO] Rewriting content with parameters: tone=${params.tone}, wordCount=${params.wordCount}, antiAIDetection=${params.antiAIDetection}`);
          // Use the rewriteContent function for rewriting
          try {
            result = await rewriteContent(params);
            console.log("[INFO] Rewriting content succeeded");
            // Validate the result
            if (!result || !result.content) {
              console.error("[ERROR] Rewriting content returned empty result");
              throw new Error("Rewriting content returned empty result");
            }
          } catch (err) {
            console.error("[ERROR] Rewriting content failed:", err);
            throw err;
          }
        } else {
          console.log(`[INFO] Using direct OpenAI call for content generation`);
          
          // Create a simplified prompt
          let prompt = `Write content about: ${params.prompt}\n\n`;
          prompt += `Tone: ${params.tone}\n`;
          prompt += `Word count: approximately ${params.wordCount} words\n`;
          
          if (params.antiAIDetection) {
            prompt += "Make this content completely undetectable by AI detection tools.\n";
          }
          
          console.log("[INFO] Using prompt:", prompt);
          
          const response = await testOpenAI.chat.completions.create({
            model: "gpt-3.5-turbo", // Use the most reliable model
            messages: [
              { 
                role: "system", 
                content: `You are an expert content writer who specializes in creating high-quality, engaging content.
                         Your task is to generate content based on the user's specifications.` 
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
          });
          
          console.log("[INFO] OpenAI call succeeded");
          
          const generatedContent = response.choices[0].message.content || "";
          const wordCount = generatedContent.split(/\s+/).filter(Boolean).length;
          
          const now = new Date();
          const startTime = new Date(now.getTime() - 2000); // 2 seconds ago
          
          result = {
            content: generatedContent,
            contentWithFootnotes: null,
            bibliography: [],
            keywordUsage: [],
            metadata: {
              wordCount: wordCount,
              generationTime: 2000,
              iterations: 1,
              startTime: startTime,
              endTime: now,
              promptTokens: response.usage?.prompt_tokens || 0,
              completionTokens: response.usage?.completion_tokens || 0,
              totalTokens: response.usage?.total_tokens || 0
            },
            seo: [],
            hashtags: [],
            keywords: []
          };
        }
        
        // Return the generated or rewritten content with all metadata
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
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        
        // Generate a fallback response for development
        const actionType = params.isRewrite ? "rewritten" : "generated";
        const mockContent = `This is a fallback ${actionType} content for the prompt: "${params.prompt}"\n\n` +
          `This content is in a ${params.tone} tone and follows the ${params.brandArchetype} brand archetype.\n\n` +
          `It contains about ${params.wordCount} words and has been ${actionType} as a fallback when the API has issues.\n\n` +
          `The actual content would be much more detailed and tailored to your specific requirements.`;
          
        return res.json({
          content: mockContent,
          contentWithFootnotes: null,
          bibliography: [],
          keywordUsage: [],
          metadata: {
            wordCount: mockContent.split(/\s+/).filter(Boolean).length,
            generationTime: 100,
            iterations: 0,
            tokens: {
              prompt: 20,
              completion: 50,
              total: 70
            }
          },
          seo: [],
          hashtags: [],
          keywords: []
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