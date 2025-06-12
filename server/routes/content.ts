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
import { requireCredits, consumeCredits, addCreditInfoToResponse } from "../middleware/credits-guard";
import { authenticateJWT } from "../auth";
import { SubscriptionService } from "../subscription-service";
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
  
  // Dialect and jargon fields
  dialectJargon: z.string().optional().default(""),
  customDialect: z.string().optional().default(""),
  dialectSample: z.string().optional().default(""),
  
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
  ),
  
  // Plagiarism detection options
  checkPlagiarism: z.preprocess(
    (val) => val === "true" || val === true || val === 1 || val === "1", 
    z.boolean().default(false)
  ),
  
  // User tier for feature access control
  userTier: z.string().optional().default("free")
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
  app.post("/api/content/generate", 
    authenticateJWT,
    requireCredits("content_generation"),
    addCreditInfoToResponse,
    async (req: Request, res: Response) => {
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
      
      // Check subscription tier limits for word count
      const userId = req.user?.id;
      if (userId && !req.user?.creditExempt) {
        const tier = await SubscriptionService.getUserTier(userId);
        const limits = SubscriptionService.getTierLimits(tier);
        
        // Enforce word count limits
        if (params.wordCount > limits.maxWordCount) {
          return res.status(403).json({
            error: `Word count exceeds ${tier} tier limit`,
            maxWordCount: limits.maxWordCount,
            requestedWordCount: params.wordCount,
            tier,
            upgradeRequired: tier === "FREE"
          });
        }
        
        // Check if detailed brief features are being used (PRO only)
        const usingDetailedFeatures = (params.requiredKeywords && params.requiredKeywords.length > 0) || 
                                     (params.requiredSources && params.requiredSources.length > 0) ||
                                     params.strictToneAdherence ||
                                     params.technicalAccuracy ||
                                     params.legalCompliance ||
                                     params.addRhetoricalElements ||
                                     params.includeCitations;

        // Check if dialect & jargon features are being used (PRO only)
        const usingDialectFeatures = (params.dialectJargon && params.dialectJargon !== 'general' && params.dialectJargon !== '') ||
                                   params.customDialect ||
                                   params.dialectSample;
        
        if (usingDetailedFeatures && !limits.hasDetailedBrief) {
          return res.status(403).json({
            error: "Detailed Brief features require Pro subscription",
            feature: "hasDetailedBrief",
            tier,
            upgradeRequired: true,
            message: "Upgrade to Pro to access advanced content generation options"
          });
        }

        if (usingDialectFeatures && !limits.hasDetailedBrief) {
          return res.status(403).json({
            error: "Dialect & Jargon features require Pro subscription",
            feature: "dialectJargon",
            tier,
            upgradeRequired: true,
            message: "Upgrade to Pro to access dialect and jargon customization"
          });
        }
      }
      
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
        
        // Check for plagiarism if requested and user has Pro access
        let plagiarismResults = undefined;
        
        if (params.checkPlagiarism && (
          params.userTier === 'premium' || 
          params.userTier === 'enterprise' || 
          await isFeatureEnabled('plagiarismDetection', req.user?.id || 0)
        )) {
          console.log("Running plagiarism check for premium/enterprise user");
          try {
            // Run plagiarism detection
            const plagiarismCheck = await checkPlagiarism(result.content);
            
            // If plagiarized content is detected, include the results in the response
            if (plagiarismCheck.isPlagiarized) {
              console.log(`Plagiarism detected! Score: ${plagiarismCheck.score}%`);
              
              // Format the plagiarism check result for the response
              plagiarismResults = {
                isPlagiarized: plagiarismCheck.isPlagiarized,
                score: plagiarismCheck.score,
                checkedTimestamp: plagiarismCheck.checkedTimestamp.toISOString(),
                matchedSources: plagiarismCheck.matchedSources
              };
            } else {
              console.log("Content passed plagiarism check");
              // Include a passing result
              plagiarismResults = {
                isPlagiarized: false,
                score: 0,
                checkedTimestamp: new Date().toISOString(),
                matchedSources: []
              };
            }
          } catch (error) {
            console.error("Error during plagiarism check:", error);
            // Don't fail the request if plagiarism check fails
          }
        }

        // Consume credits after successful generation
        await consumeCredits(req, res, () => {});

        // Ensure robust response structure with defensive programming
        const safeMetadata = result?.metadata || {};
        const safeContent = result?.content || "";
        
        // Calculate word count as fallback if not provided
        const wordCount = safeMetadata.wordCount || safeContent.split(/\s+/).filter(Boolean).length || 0;
        
        // Calculate generation time safely
        const generationTime = safeMetadata.endTime && safeMetadata.startTime 
          ? safeMetadata.endTime.getTime() - safeMetadata.startTime.getTime()
          : 0;

        // Log content generation event for launch monitoring with safe data
        try {
          const { LaunchMonitoring } = await import('../utils/launch-monitoring');
          LaunchMonitoring.contentGenerated(userId!, wordCount);
        } catch (monitoringError) {
          console.error("Launch monitoring error:", monitoringError);
          // Don't fail the request if monitoring fails
        }

        // Return the generated content with complete error handling
        return res.json({
          content: safeContent,
          contentWithFootnotes: result?.contentWithFootnotes || undefined,
          bibliography: result?.bibliography || [],
          keywordUsage: result?.keywordUsage || [],
          metadata: {
            wordCount: wordCount,
            generationTime: generationTime,
            iterations: safeMetadata.iterations || 1,
            tokens: {
              prompt: safeMetadata.promptTokens || 0,
              completion: safeMetadata.completionTokens || 0,
              total: safeMetadata.totalTokens || 0
            }
          },
          // Include plagiarism results if available
          ...(plagiarismResults && { plagiarismResults }),
          seo: result?.seo || [],
          hashtags: result?.hashtags || [],
          keywords: result?.keywords || []
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
        
        // Check for plagiarism if requested and user has Pro access
        let plagiarismResults = undefined;
        
        if (params.checkPlagiarism && (
          params.userTier === 'premium' || 
          params.userTier === 'enterprise' || 
          await isFeatureEnabled('plagiarismDetection', req.user?.id || 0)
        )) {
          console.log("Running plagiarism check for premium/enterprise user");
          try {
            // Run plagiarism detection
            const plagiarismCheck = await checkPlagiarism(result.content);
            
            // If plagiarized content is detected, include the results in the response
            if (plagiarismCheck.isPlagiarized) {
              console.log(`Plagiarism detected! Score: ${plagiarismCheck.score}%`);
              
              // Format the plagiarism check result for the response
              plagiarismResults = {
                isPlagiarized: plagiarismCheck.isPlagiarized,
                score: plagiarismCheck.score,
                checkedTimestamp: plagiarismCheck.checkedTimestamp.toISOString(),
                matchedSources: plagiarismCheck.matchedSources
              };
            } else {
              console.log("Content passed plagiarism check");
              // Include a passing result
              plagiarismResults = {
                isPlagiarized: false,
                score: 0,
                checkedTimestamp: new Date().toISOString(),
                matchedSources: []
              };
            }
          } catch (error) {
            console.error("Error during plagiarism check:", error);
            // Don't fail the request if plagiarism check fails
          }
        }

        // Return the rewritten content with plagiarism results if applicable
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
          // Include plagiarism results if available
          ...(plagiarismResults && { plagiarismResults }),
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
   * Check content for plagiarism
   * POST /api/check-plagiarism
   */
  app.post("/api/check-plagiarism", async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({
          error: "Missing content",
          message: "Content is required for plagiarism checking"
        });
      }
      
      // Check for API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API key is not configured",
          message: "Please set the OPENAI_API_KEY environment variable"
        });
      }
      
      try {
        // Use the plagiarism detection service
        const result = await checkPlagiarism(content);
        
        // Return the plagiarism check result
        return res.json(result);
      } catch (error) {
        console.error("Plagiarism check error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Plagiarism detection error:", error);
      
      return res.status(500).json({
        error: "Plagiarism detection failed",
        message: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  /**
   * Rephrase potentially plagiarized content
   * POST /api/content/rephrase
   */
  app.post("/api/content/rephrase", async (req: Request, res: Response) => {
    try {
      const { content, matchedSource } = req.body;
      
      if (!content || !matchedSource) {
        return res.status(400).json({
          error: "Missing parameters",
          message: "Content and matchedSource are required"
        });
      }
      
      // Check for API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API key is not configured",
          message: "Please set the OPENAI_API_KEY environment variable"
        });
      }
      
      try {
        // Use the rephrasing service
        const rephrasedContent = await rephraseContent(content, matchedSource);
        
        // Return the rephrased content
        return res.json({
          content: rephrasedContent,
          originalContent: content
        });
      } catch (error) {
        console.error("Content rephrasing error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Content rephrasing error:", error);
      
      return res.status(500).json({
        error: "Content rephrasing failed",
        message: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  /**
   * Add citation to potentially plagiarized content
   * POST /api/content/add-citation
   */
  app.post("/api/content/add-citation", async (req: Request, res: Response) => {
    try {
      const { content, matchedSource } = req.body;
      
      if (!content || !matchedSource) {
        return res.status(400).json({
          error: "Missing parameters",
          message: "Content and matchedSource are required"
        });
      }
      
      // Check for API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API key is not configured",
          message: "Please set the OPENAI_API_KEY environment variable"
        });
      }
      
      try {
        // Use the citation service
        const contentWithCitation = await addCitations(content, [matchedSource]);
        
        // Return the content with added citation
        return res.json({
          content: contentWithCitation,
          originalContent: content
        });
      } catch (error) {
        console.error("Citation adding error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Citation adding error:", error);
      
      return res.status(500).json({
        error: "Citation adding failed",
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