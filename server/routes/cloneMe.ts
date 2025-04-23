import { Request, Response, Express } from "express";
import { db } from "@db";
import { userEssays, userWritingStyles, clonedContent, users } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import OpenAI from "openai";
import { authenticateJWT } from "../auth";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schemas
const EssaySubmissionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(50, "Essay must be at least 50 characters"),
  tone: z.string().min(1, "Tone is required"),
});

const StyleGenerationSchema = z.object({
  userId: z.number().int().positive(),
});

const ContentGenerationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  tone: z.string().min(1, "Tone is required"),
  wordCount: z.number().int().min(50).max(5000).default(1000),
});

const FeedbackSubmissionSchema = z.object({
  contentId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
});

/**
 * Analyzes essay content to extract stylistic features
 * @param content The essay content to analyze
 * @returns Stylistic features extracted from the content
 */
async function analyzeEssayStyle(
  content: string,
  tone: string
): Promise<Record<string, any>> {
  try {
    // Using OpenAI to analyze the writing style
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a writing style analysis expert. Analyze the following text and extract key stylistic features 
          including sentence structure, vocabulary choices, transition patterns, tone markers, and unique writing traits.
          Provide the analysis as a structured JSON object suitable for style emulation. The tone is: ${tone || "neutral"}.`,
        },
        {
          role: "user",
          content: content,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the response
    const responseContent = response.choices[0].message.content || "{}";
    return JSON.parse(responseContent) as Record<string, any>;
  } catch (error) {
    console.error("Error analyzing essay style:", error);
    // Return a basic analysis object in case of API error
    return {
      basicStats: {
        avgSentenceLength: calculateAvgSentenceLength(content),
        avgParagraphLength: calculateAvgParagraphLength(content),
        vocabularyDiversity: calculateVocabularyDiversity(content),
      },
      error: "Detailed analysis unavailable",
    };
  }
}

/**
 * Updates a user's writing style based on multiple essay samples
 * @param userId The user ID to update writing style for
 * @returns The result of the style update operation
 */
async function updateUserWritingStyle(userId: number): Promise<Record<string, any>> {
  try {
    // Get all user essays for analysis
    const essays = await db
      .select()
      .from(userEssays)
      .where(eq(userEssays.userId, userId))
      .execute();

    if (essays.length === 0) {
      throw new Error("No essays found for analysis");
    }

    // Combine all essay contents for comprehensive analysis
    const combinedContent = essays.map((e) => e.content).join("\n\n");
    const tones = essays.map((e) => e.tone);
    
    // Analyze the combined writing style
    const styleFeatures = await analyzeEssayStyle(combinedContent, tones.join(", "));

    // Calculate average metrics across all essays
    const avgSentenceLength = essays.reduce((sum, essay) => {
      const analysis = essay.analysisResults as any || {};
      return sum + (analysis.avgSentenceLength || calculateAvgSentenceLength(essay.content));
    }, 0) / essays.length;

    const avgParagraphLength = essays.reduce((sum, essay) => {
      const analysis = essay.analysisResults as any || {};
      return sum + (analysis.avgParagraphLength || calculateAvgParagraphLength(essay.content));
    }, 0) / essays.length;

    const vocabularyDiversity = calculateVocabularyDiversity(combinedContent);

    // Extract common phrases and transitions
    const commonPhrases = extractCommonPhrases(combinedContent);
    const transitionWords = extractTransitionWords(combinedContent);
    const sentenceStructures = extractSentenceStructures(combinedContent);

    // Create model configuration for fine-tuning
    const modelConfig = {
      baseModel: "gpt-4o",
      styleParameters: styleFeatures,
      tones: Array.from(new Set(tones)),
      essaySamples: essays.length,
      lastUpdated: new Date().toISOString(),
    };

    // Check if user already has a writing style profile
    const existingStyle = await db
      .select()
      .from(userWritingStyles)
      .where(eq(userWritingStyles.userId, userId))
      .execute();

    if (existingStyle.length > 0) {
      // Update existing style
      await db
        .update(userWritingStyles)
        .set({
          styleFeatures: styleFeatures as any,
          avgSentenceLength: avgSentenceLength.toString(),
          avgParagraphLength: avgParagraphLength.toString(),
          vocabularyDiversity: vocabularyDiversity.toString(),
          commonPhrases: commonPhrases as any,
          transitionWords: transitionWords as any,
          sentenceStructures: sentenceStructures as any,
          modelConfig: modelConfig as any,
          isActive: true,
          lastUpdated: new Date(),
        })
        .where(eq(userWritingStyles.id, existingStyle[0].id))
        .execute();

      return {
        success: true,
        message: "Writing style updated successfully",
        styleId: existingStyle[0].id,
      };
    } else {
      // Create new style
      const [newStyle] = await db
        .insert(userWritingStyles)
        .values({
          userId,
          styleFeatures: styleFeatures as any,
          avgSentenceLength: avgSentenceLength.toString(),
          avgParagraphLength: avgParagraphLength.toString(),
          vocabularyDiversity: vocabularyDiversity.toString(),
          commonPhrases: commonPhrases as any,
          transitionWords: transitionWords as any,
          sentenceStructures: sentenceStructures as any,
          modelConfig: modelConfig as any,
          isActive: true,
        })
        .returning()
        .execute();

      return {
        success: true,
        message: "Writing style created successfully",
        styleId: newStyle.id,
      };
    }
  } catch (error) {
    console.error("Error updating user writing style:", error);
    throw error;
  }
}

/**
 * Generates content based on a user's writing style
 * @param styleId The ID of the writing style to use
 * @param prompt The content generation prompt
 * @param tone The desired tone for the generated content
 * @param wordCount The target word count
 * @returns The generated content
 */
async function generateStyledContent(
  styleId: number,
  prompt: string,
  tone: string,
  wordCount: number
): Promise<string> {
  try {
    // Get the user's writing style
    const [style] = await db
      .select()
      .from(userWritingStyles)
      .where(eq(userWritingStyles.id, styleId))
      .execute();

    if (!style) {
      throw new Error("Writing style not found");
    }

    // Get user information
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, style.userId))
      .execute();

    if (!user) {
      throw new Error("User not found");
    }

    // Get sample essays
    const essays = await db
      .select()
      .from(userEssays)
      .where(eq(userEssays.userId, style.userId))
      .limit(3)
      .execute();

    // Build prompt for the AI model
    const userStyle = style.styleFeatures as Record<string, any>;
    const modelConfig = style.modelConfig as Record<string, any>;
    
    // Get sample text from user essays
    const sampleTexts = essays.map(essay => {
      // Limit the sample to about 200 words for each essay
      const words = essay.content.split(/\s+/).slice(0, 200);
      return words.join(' ');
    }).join('\n\n[Next Sample]\n\n');

    // Create a detailed system prompt for style emulation
    const systemPrompt = `You are a specialized writing assistant that perfectly emulates a user's unique writing style.
    
    # USER'S WRITING STYLE PROFILE
    ${JSON.stringify(userStyle, null, 2)}
    
    # STYLE METRICS
    - Average sentence length: ${style.avgSentenceLength || 'unknown'} words
    - Average paragraph length: ${style.avgParagraphLength || 'unknown'} sentences
    - Vocabulary diversity: ${style.vocabularyDiversity || 'unknown'}
    
    # WRITING SAMPLES
    ${sampleTexts}
    
    # GENERATION INSTRUCTIONS
    - Write in the style of the user as demonstrated in the sample texts and style profile
    - Adapt the style to the requested tone: "${tone}"
    - Aim for approximately ${wordCount} words
    - Only return the generated content with no additional commentary
    - The user's style is the priority - create content that would be indistinguishable from their own writing
    - Include typical patterns, sentence structures, and vocabulary from their samples
    `;

    // Generate content with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Write about the following topic in my writing style: ${prompt}`,
        },
      ],
      max_tokens: calculateMaxTokens(wordCount),
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Content generation failed";
  } catch (error) {
    console.error("Error generating styled content:", error);
    throw error;
  }
}

// Helper functions for style analysis
function calculateAvgSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const totalWords = text.split(/\s+/).length;
  return sentences.length ? totalWords / sentences.length : 0;
}

function calculateAvgParagraphLength(text: string): number {
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const totalSentences = text.split(/[.!?]+/).filter(Boolean).length;
  return paragraphs.length ? totalSentences / paragraphs.length : 0;
}

function calculateVocabularyDiversity(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  return words.length ? uniqueWords.size / words.length : 0;
}

function extractCommonPhrases(text: string): Record<string, number> {
  // Simplified common phrase extraction - in a production system this would be more sophisticated
  const phrases: Record<string, number> = {};
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(' ').toLowerCase();
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }
  
  // Only return phrases that appear more than once
  return Object.fromEntries(
    Object.entries(phrases).filter(([_, count]) => count > 1).slice(0, 20)
  );
}

function extractTransitionWords(text: string): string[] {
  const commonTransitions = [
    "however", "therefore", "thus", "consequently", "furthermore",
    "moreover", "nevertheless", "in addition", "similarly", "in contrast",
    "for example", "specifically", "in particular", "as a result", "meanwhile",
    "subsequently", "in conclusion", "to summarize", "in summary", "finally"
  ];
  
  const lowerText = text.toLowerCase();
  return commonTransitions.filter(word => lowerText.includes(word));
}

function extractSentenceStructures(text: string): string[] {
  // This is a simplified version - a real implementation would use NLP
  const sentences = text.split(/[.!?]+/).filter(Boolean).slice(0, 10);
  
  return sentences.map(sentence => {
    if (sentence.trim().startsWith("But ") || sentence.trim().startsWith("And ")) {
      return "Starts with conjunction";
    } else if (sentence.includes(",")) {
      return "Contains comma-separated clauses";
    } else if (sentence.split(/\s+/).length > 15) {
      return "Long sentence";
    } else if (sentence.split(/\s+/).length < 6) {
      return "Short sentence";
    } else if (sentence.includes("?")) {
      return "Question";
    } else {
      return "Standard declarative";
    }
  });
}

function calculateMaxTokens(wordCount: number): number {
  // Rough estimate of tokens needed for the specified word count
  // Typically 1 token ≈ 0.75 words in English
  return Math.ceil(wordCount * 1.5);
}

/**
 * Register Clone Me feature routes
 * @param app Express application
 */
export function registerCloneMeRoutes(app: Express): void {
  // Middleware to check for feature access
  const checkCloneMeAccess = async (req: Request, res: Response, next: Function) => {
    // Check if user is premium or has access to the Clone Me feature
    // This is a simplified version - in a real app, you'd check against user subscription
    return next();
  };

  /**
   * Submit a new essay for analysis
   * POST /api/clone-me/essays
   */
  app.post("/api/clone-me/essays", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const validationResult = EssaySubmissionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request parameters",
          details: validationResult.error.format()
        });
      }
      
      const { title, content, tone } = validationResult.data;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Count words in content
      const wordCount = content.split(/\s+/).length;
      
      // Analyze essay style
      const analysisResults = await analyzeEssayStyle(content, tone);
      
      // Save the essay
      const [essay] = await db.insert(userEssays)
        .values({
          userId,
          title,
          content,
          wordCount,
          tone,
          analysisResults,
          status: "completed",
        })
        .returning()
        .execute();
      
      // Return essay details
      res.status(201).json({
        id: essay.id,
        title: essay.title,
        wordCount: essay.wordCount,
        tone: essay.tone,
        status: essay.status,
        createdAt: essay.createdAt,
      });
    } catch (error) {
      console.error("Error submitting essay:", error);
      res.status(500).json({
        error: "Failed to submit essay",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Get user essays
   * GET /api/clone-me/essays
   */
  app.get("/api/clone-me/essays", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get all essays for the user
      const essays = await db
        .select({
          id: userEssays.id,
          title: userEssays.title,
          wordCount: userEssays.wordCount,
          tone: userEssays.tone,
          status: userEssays.status,
          createdAt: userEssays.createdAt,
        })
        .from(userEssays)
        .where(eq(userEssays.userId, userId))
        .orderBy(desc(userEssays.createdAt))
        .execute();
      
      res.json(essays);
    } catch (error) {
      console.error("Error fetching essays:", error);
      res.status(500).json({
        error: "Failed to fetch essays",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Get a specific essay
   * GET /api/clone-me/essays/:id
   */
  app.get("/api/clone-me/essays/:id", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const essayId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (isNaN(essayId)) {
        return res.status(400).json({ error: "Invalid essay ID" });
      }
      
      // Get the specific essay
      const [essay] = await db
        .select()
        .from(userEssays)
        .where(and(
          eq(userEssays.id, essayId),
          eq(userEssays.userId, userId)
        ))
        .execute();
      
      if (!essay) {
        return res.status(404).json({ error: "Essay not found" });
      }
      
      res.json(essay);
    } catch (error) {
      console.error("Error fetching essay:", error);
      res.status(500).json({
        error: "Failed to fetch essay",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Update an essay's metadata and content
   * PATCH /api/clone-me/essays/:id
   */
  app.patch("/api/clone-me/essays/:id", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const essayId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (isNaN(essayId)) {
        return res.status(400).json({ error: "Invalid essay ID" });
      }
      
      // Validate the request body has at least one valid field to update
      const { tone, content } = req.body;
      
      if (!tone && !content) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      // Check if the essay exists and belongs to the user
      const [existingEssay] = await db
        .select()
        .from(userEssays)
        .where(and(
          eq(userEssays.id, essayId),
          eq(userEssays.userId, userId)
        ))
        .execute();
      
      if (!existingEssay) {
        return res.status(404).json({ error: "Essay not found" });
      }
      
      // Build the update object based on provided fields
      const updateData: Record<string, any> = {};
      if (tone) updateData.tone = tone;
      if (content) {
        updateData.content = content;
        updateData.wordCount = content.split(/\s+/).length;
        
        // If the content changed, we should re-analyze the essay
        const analysisResults = await analyzeEssayStyle(content, tone || existingEssay.tone);
        updateData.analysisResults = analysisResults;
      }
      
      // Update the essay
      const [updatedEssay] = await db
        .update(userEssays)
        .set(updateData)
        .where(and(
          eq(userEssays.id, essayId),
          eq(userEssays.userId, userId)
        ))
        .returning()
        .execute();
      
      // If the content changed, update the writing style too
      if (content) {
        try {
          await updateUserWritingStyle(userId);
        } catch (styleUpdateError) {
          console.error("Error updating writing style after essay update:", styleUpdateError);
          // Continue anyway
        }
      }
      
      res.json(updatedEssay);
    } catch (error) {
      console.error("Error updating essay:", error);
      res.status(500).json({
        error: "Failed to update essay",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Re-analyze an essay
   * POST /api/clone-me/essays/:id/reanalyze
   */
  app.post("/api/clone-me/essays/:id/reanalyze", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const essayId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (isNaN(essayId)) {
        return res.status(400).json({ error: "Invalid essay ID" });
      }
      
      // Get the essay
      const [essay] = await db
        .select()
        .from(userEssays)
        .where(and(
          eq(userEssays.id, essayId),
          eq(userEssays.userId, userId)
        ))
        .execute();
      
      if (!essay) {
        return res.status(404).json({ error: "Essay not found" });
      }
      
      // Re-analyze the essay style
      const analysisResults = await analyzeEssayStyle(essay.content, essay.tone);
      
      // Update the essay with new analysis
      const [updatedEssay] = await db
        .update(userEssays)
        .set({
          analysisResults,
          status: "completed",
          updatedAt: new Date()
        })
        .where(and(
          eq(userEssays.id, essayId),
          eq(userEssays.userId, userId)
        ))
        .returning()
        .execute();
      
      // Consider regenerating the writing style too
      // This is optional, but better UX if we do this automatically
      try {
        await updateUserWritingStyle(userId);
      } catch (styleUpdateError) {
        console.error("Error updating writing style after essay re-analysis:", styleUpdateError);
        // Continue anyway, as the essay was re-analyzed successfully
      }
      
      res.json({
        id: updatedEssay.id,
        title: updatedEssay.title,
        wordCount: updatedEssay.wordCount,
        tone: updatedEssay.tone,
        status: updatedEssay.status,
        message: "Essay successfully re-analyzed"
      });
    } catch (error) {
      console.error("Error re-analyzing essay:", error);
      res.status(500).json({
        error: "Failed to re-analyze essay",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Delete an essay
   * DELETE /api/clone-me/essays/:id
   */
  app.delete("/api/clone-me/essays/:id", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const essayId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (isNaN(essayId)) {
        return res.status(400).json({ error: "Invalid essay ID" });
      }
      
      // Delete the essay
      const result = await db
        .delete(userEssays)
        .where(and(
          eq(userEssays.id, essayId),
          eq(userEssays.userId, userId)
        ))
        .execute();
      
      res.json({ success: true, message: "Essay deleted successfully" });
    } catch (error) {
      console.error("Error deleting essay:", error);
      res.status(500).json({
        error: "Failed to delete essay",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Generate or update writing style
   * POST /api/clone-me/style/generate
   */
  app.post("/api/clone-me/style/generate", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Count user essays
      const essays = await db
        .select()
        .from(userEssays)
        .where(eq(userEssays.userId, userId))
        .execute();
      
      if (essays.length < 1) {
        return res.status(400).json({
          error: "Insufficient essays",
          message: "Please submit at least 1 essay before generating your writing style"
        });
      }
      
      // Update user writing style
      const result = await updateUserWritingStyle(userId);
      
      res.json(result);
    } catch (error) {
      console.error("Error generating writing style:", error);
      res.status(500).json({
        error: "Failed to generate writing style",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Get user writing style
   * GET /api/clone-me/style
   */
  app.get("/api/clone-me/style", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the user's writing style
      const [style] = await db
        .select()
        .from(userWritingStyles)
        .where(eq(userWritingStyles.userId, userId))
        .execute();
      
      if (!style) {
        return res.status(404).json({ 
          error: "Writing style not found",
          message: "Please generate your writing style first"
        });
      }
      
      // Count user essays
      const essayCount = await db
        .select()
        .from(userEssays)
        .where(eq(userEssays.userId, userId))
        .execute()
        .then(essays => essays.length);
      
      res.json({
        ...style,
        essayCount,
      });
    } catch (error) {
      console.error("Error fetching writing style:", error);
      res.status(500).json({
        error: "Failed to fetch writing style",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Generate content in user's style
   * POST /api/clone-me/content/generate
   */
  app.post("/api/clone-me/content/generate", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const validationResult = ContentGenerationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request parameters",
          details: validationResult.error.format()
        });
      }
      
      const { prompt, tone, wordCount } = validationResult.data;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the user's writing style
      const [style] = await db
        .select()
        .from(userWritingStyles)
        .where(and(
          eq(userWritingStyles.userId, userId),
          eq(userWritingStyles.isActive, true)
        ))
        .execute();
      
      if (!style) {
        return res.status(404).json({ 
          error: "Writing style not found",
          message: "Please generate your writing style first"
        });
      }
      
      // Generate content
      const content = await generateStyledContent(style.id, prompt, tone, wordCount);
      
      // Calculate actual word count
      const actualWordCount = content.split(/\s+/).length;
      
      // Save the generated content
      const [savedContent] = await db
        .insert(clonedContent)
        .values({
          userId,
          styleId: style.id,
          prompt,
          content,
          requestedTone: tone,
          wordCount: actualWordCount,
        })
        .returning()
        .execute();
      
      res.json({
        id: savedContent.id,
        content: savedContent.content,
        wordCount: savedContent.wordCount,
        prompt: savedContent.prompt,
        tone: savedContent.requestedTone,
        createdAt: savedContent.createdAt,
      });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({
        error: "Failed to generate content",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Get user's generated content history
   * GET /api/clone-me/content
   */
  app.get("/api/clone-me/content", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the user's content history
      const content = await db
        .select({
          id: clonedContent.id,
          prompt: clonedContent.prompt,
          wordCount: clonedContent.wordCount,
          tone: clonedContent.requestedTone,
          createdAt: clonedContent.createdAt,
          rating: clonedContent.userRating,
        })
        .from(clonedContent)
        .where(eq(clonedContent.userId, userId))
        .orderBy(desc(clonedContent.createdAt))
        .execute();
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching content history:", error);
      res.status(500).json({
        error: "Failed to fetch content history",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Get specific generated content
   * GET /api/clone-me/content/:id
   */
  app.get("/api/clone-me/content/:id", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const contentId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }
      
      // Get the specific content
      const [content] = await db
        .select()
        .from(clonedContent)
        .where(and(
          eq(clonedContent.id, contentId),
          eq(clonedContent.userId, userId)
        ))
        .execute();
      
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({
        error: "Failed to fetch content",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Submit feedback for generated content
   * POST /api/clone-me/content/:id/feedback
   */
  app.post("/api/clone-me/content/:id/feedback", authenticateJWT, checkCloneMeAccess, async (req: Request, res: Response) => {
    try {
      const validationResult = FeedbackSubmissionSchema.safeParse({
        ...req.body,
        contentId: parseInt(req.params.id),
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request parameters",
          details: validationResult.error.format()
        });
      }
      
      const { contentId, rating, feedback } = validationResult.data;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Update content with feedback
      const result = await db
        .update(clonedContent)
        .set({
          userRating: rating,
          feedback: feedback || null,
        })
        .where(and(
          eq(clonedContent.id, contentId),
          eq(clonedContent.userId, userId)
        ))
        .execute();
      
      res.json({ success: true, message: "Feedback submitted successfully" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({
        error: "Failed to submit feedback",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}