import { Router, Request, Response, Express } from "express";
import { z } from "zod";
import { 
  ContentGenerationParams, 
  generateContent, 
  SeoGenerationParams, 
  generateSeoKeywords,
  rewriteContent
} from "../services/openai";

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
  ]),
  wordCount: z.number().int().min(50).max(5000),
  antiAIDetection: z.boolean().default(false),
  prioritizeUndetectable: z.boolean().optional().default(true),
  isRewrite: z.boolean().optional().default(false),
  // Language options
  englishVariant: z.enum(["us", "uk"]).optional().default("us"),
  // Website scanning options
  websiteUrl: z.string().url().optional().default(""),
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
      
      // Determine whether to generate content or rewrite existing content
      try {
        let result;
        
        // Log the action type and parameters
        if (params.isRewrite) {
          console.log(`[INFO] Rewriting content with parameters: tone=${params.tone}, wordCount=${params.wordCount}, antiAIDetection=${params.antiAIDetection}`);
          // Use the rewriteContent function for rewriting
          result = await rewriteContent(params);
        } else {
          console.log(`[INFO] Generating content with parameters: tone=${params.tone}, wordCount=${params.wordCount}, antiAIDetection=${params.antiAIDetection}`);
          // Use the generateContent function for new content
          result = await generateContent(params);
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
            },
            regionStatistics: result.metadata.regionStatistics
          },
          seo: result.seo || [],
          hashtags: result.hashtags || [],
          keywords: result.keywords || []
        });
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        
        // Generate a fallback response for testing/development
        const actionType = params.isRewrite ? "rewritten" : "generated";
        const mockContent = `This is a fallback ${actionType} content for the prompt: "${params.prompt}"\n\n` +
          `This content is in a ${params.tone} tone and follows the ${params.brandArchetype} brand archetype.\n\n` +
          `It contains about ${params.wordCount} words and has been ${actionType} as a fallback when the API has issues.\n\n` +
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
          "#GhostliAI"
        ] : [];
        
        const mockKeywords = params.generateKeywords ? [
          "content creation",
          "writing assistant",
          "AI content",
          "content marketing",
          "SEO content",
          "professional writing",
          "content generation",
          "GhostliAI"
        ] : [];
        
        // Create mock bibliography and keyword usage for demonstration
        const mockBibliography = params.includeCitations || params.generateBibliography ? [
          {
            source: "Lorem Ipsum Research Institute",
            url: "https://www.lipsum.com/",
            authors: ["John Doe", "Jane Smith"],
            publicationDate: "2023-05-15",
            region: params.regionFocus || "Global",
            accessDate: new Date().toISOString().split('T')[0],
            quotesUsed: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."]
          },
          {
            source: "Content Generation Quarterly",
            url: "https://example.com/content-journal",
            authors: ["Alan Johnson"],
            publicationDate: "2024-01-22",
            region: params.regionFocus || "Global",
            accessDate: new Date().toISOString().split('T')[0],
            quotesUsed: ["Advanced content generation techniques demonstrate significant improvements in engagement metrics."]
          }
        ] : [];
        
        // Mock keyword usage statistics
        const mockKeywordUsage = (params.requiredKeywords && params.requiredKeywords.length > 0) ? 
          params.requiredKeywords.map(keyword => ({
            keyword: keyword.keyword,
            occurrences: keyword.occurrences,
            locations: Array.from({ length: keyword.occurrences }, (_, i) => i + 1)
          })) :
          [
            {
              keyword: "content creation",
              occurrences: 3,
              locations: [1, 3, 5]
            },
            {
              keyword: "professional writing",
              occurrences: 2,
              locations: [2, 4]
            }
          ];
          
        // Mock content with footnotes if requested
        const mockContentWithFootnotes = params.useFootnotes ? 
          mockContent + "\n\n-----------\n1. Lorem Ipsum Research Institute, 2023\n2. Content Generation Quarterly, 2024" : 
          null;
          
        // Mock region statistics
        const mockRegionStats = params.regionFocus ? {
          region: params.regionFocus,
          statisticsUsed: [
            {
              statistic: "User engagement increased by 45% in this region",
              source: "Regional Marketing Report",
              year: "2024"
            },
            {
              statistic: "72% of consumers in this region prefer visual content",
              source: "Consumer Behavior Study",
              year: "2023"
            }
          ]
        } : undefined;

        return res.json({
          content: mockContent,
          contentWithFootnotes: mockContentWithFootnotes,
          bibliography: mockBibliography,
          keywordUsage: mockKeywordUsage,
          metadata: {
            wordCount: mockContent.split(/\s+/).filter(Boolean).length,
            generationTime: 2500,
            iterations: 1,
            tokens: {
              prompt: 150,
              completion: 300,
              total: 450
            },
            regionStatistics: mockRegionStats
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