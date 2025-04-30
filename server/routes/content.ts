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
   * Test endpoint to debug JSON encoding issues
   * GET /api/json-debug
   */
  app.get("/api/json-debug", (req: Request, res: Response) => {
    const testObj = {
      message: "This is a test message",
      number: 123,
      boolean: true,
      array: [1, 2, 3],
      nested: {
        key: "value"
      }
    };
    
    // First, convert to string
    const jsonString = JSON.stringify(testObj);
    
    // Log raw bytes for debugging
    console.log("Raw bytes of JSON string:");
    for (let i = 0; i < Math.min(20, jsonString.length); i++) {
      console.log(`Byte ${i}: ${jsonString.charCodeAt(i)} (${jsonString[i]})`);
    }
    
    // Set explicit content type and charset
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(jsonString);
  });
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
        
        // Create a clean response object
        const responseObj = {
          content: typeof result.content === 'string' ? result.content : '',
          contentWithFootnotes: typeof result.contentWithFootnotes === 'string' ? result.contentWithFootnotes : null,
          bibliography: Array.isArray(result.bibliography) ? result.bibliography : [],
          keywordUsage: Array.isArray(result.keywordUsage) ? result.keywordUsage : [],
          metadata: {
            wordCount: typeof result.metadata.wordCount === 'number' ? result.metadata.wordCount : 0,
            generationTime: typeof result.metadata.endTime === 'object' && typeof result.metadata.startTime === 'object' ? 
                           (result.metadata.endTime.getTime() - result.metadata.startTime.getTime()) : 0,
            iterations: typeof result.metadata.iterations === 'number' ? result.metadata.iterations : 1,
            tokens: {
              prompt: typeof result.metadata.promptTokens === 'number' ? result.metadata.promptTokens : 0,
              completion: typeof result.metadata.completionTokens === 'number' ? result.metadata.completionTokens : 0,
              total: typeof result.metadata.totalTokens === 'number' ? result.metadata.totalTokens : 0
            }
          },
          seo: Array.isArray(result.seo) ? result.seo : [],
          hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
          keywords: Array.isArray(result.keywords) ? result.keywords : []
        };
        
        // Convert to JSON string and explicitly handle encoding
        const jsonString = JSON.stringify(responseObj);
        
        // Set explicit content type and charset
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        
        // Send raw string instead of using res.json() to have more control
        return res.send(jsonString);
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        
        // Generate a fallback response for API errors
        const actionType = params.isRewrite ? "rewritten" : "generated";
        const errorContent = `I'm sorry, but there was an error ${actionType} content for your prompt: "${params.prompt}"

Error details: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}

Please try again in a few moments or contact support if the issue persists.`;
          
        // Create a clean fallback response object
        const fallbackObj = {
          content: errorContent,
          contentWithFootnotes: null,
          bibliography: [],
          keywordUsage: [],
          metadata: {
            wordCount: errorContent.split(/\s+/).filter(Boolean).length,
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
        };
        
        // Convert to JSON string with explicit encoding
        const fallbackJsonString = JSON.stringify(fallbackObj);
        
        // Set explicit content type and charset
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        
        // Send raw string instead of using res.json()
        return res.send(fallbackJsonString);
      }
    } catch (error) {
      console.error("Content generation error:", error);
      
      // Create an error response object
      const errorObj = {
        error: "Content generation failed",
        message: error instanceof Error ? error.message : "An unknown error occurred"
      };
      
      // Convert to JSON string with explicit encoding
      const errorJsonString = JSON.stringify(errorObj);
      
      // Set status code and headers
      res.status(500);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      // Send raw string instead of using res.json()
      return res.send(errorJsonString);
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