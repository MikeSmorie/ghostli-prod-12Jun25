import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Interface for SEO keyword generation
 */
export interface SeoGenerationParams {
  content: string;
}

/**
 * Interface for SEO keyword generation result
 */
export interface SeoGenerationResult {
  keywords: string[];
}

export interface ContentGenerationParams {
  prompt: string;
  tone: string;
  brandArchetype: string;
  wordCount: number;
  antiAIDetection: boolean;
  prioritizeUndetectable?: boolean;
}

export interface ContentGenerationResult {
  content: string;
  metadata: {
    startTime: Date;
    endTime: Date;
    wordCount: number;
    iterations: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generates content using OpenAI's GPT model
 * @param params Content generation parameters
 * @returns Generated content with metadata
 */
export async function generateContent(params: ContentGenerationParams): Promise<ContentGenerationResult> {
  const startTime = new Date();
  const systemMessage = constructSystemMessage(params);
  
  try {
    // Determine temperature based on prioritization setting
    const baseTemperature = params.prioritizeUndetectable ? 0.8 : 0.7;
    
    // Generate content with appropriate settings
    const { content, usage } = await generateWithOpenAI(
      systemMessage, 
      params.prompt,
      { temperature: baseTemperature }
    );
    
    // Count words in the generated content
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // If word count is significantly different from requested, do another pass
    let iterations = 1;
    let finalContent = content;
    
    if (Math.abs(wordCount - params.wordCount) > params.wordCount * 0.2 && params.wordCount > 100) {
      // Add adjustment note for second iteration
      const adjustmentPrompt = `The content needs to be adjusted to be closer to ${params.wordCount} words. Current word count is ${wordCount}. ${wordCount > params.wordCount ? 'Please make it more concise.' : 'Please expand on it a bit more.'}`;
      
      const { content: adjustedContent } = await generateWithOpenAI(
        systemMessage, 
        adjustmentPrompt + "\n\nOriginal content:\n" + finalContent,
        { temperature: baseTemperature }
      );
      finalContent = adjustedContent;
      iterations++;
    }

    // Apply anti-AI detection treatment if requested
    if (params.antiAIDetection) {
      // Define the anti-AI prompt based on prioritizeUndetectable parameter
      let antiAIPrompt = params.prioritizeUndetectable 
        ? "Rewrite the following content to make it completely undetectable by AI detection tools. Focus on maximum humanization over speed. Add variations in sentence structure, use imperfect grammar occasionally, vary vocabulary significantly, and use more informal language where appropriate. Don't change the meaning or core message:"
        : "Rewrite the following content to make it less detectable by AI detection tools without changing the meaning or intent:";
      
      // Use higher temperature for humanization to increase variability
      const humanizationTemperature = params.prioritizeUndetectable ? 0.85 : 0.75;
      
      const { content: humanizedContent } = await generateWithOpenAI(
        systemMessage, 
        antiAIPrompt + "\n\n" + finalContent,
        { temperature: humanizationTemperature }
      );
      finalContent = humanizedContent;
      iterations++;
      
      // If we're prioritizing undetectability, make an additional pass
      if (params.prioritizeUndetectable) {
        const secondPassPrompt = "This content still has some AI-detection patterns. Apply a second humanization pass focusing on adding narrative inconsistencies, personal anecdotes, and more colloquial language. Make it extremely difficult for any AI detector to recognize this as AI-generated:";
        
        // Use even higher temperature for the second pass to maximize unpredictability
        const { content: deeplyHumanizedContent } = await generateWithOpenAI(
          systemMessage, 
          secondPassPrompt + "\n\n" + humanizedContent,
          { temperature: 0.9 }
        );
        finalContent = deeplyHumanizedContent;
        iterations++;
      }
    }

    // Calculate final word count
    const finalWordCount = finalContent.split(/\s+/).filter(Boolean).length;
    
    const endTime = new Date();
    
    // Return the result
    return {
      content: finalContent,
      metadata: {
        startTime,
        endTime,
        wordCount: finalWordCount,
        iterations,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      }
    };
  } catch (error) {
    console.error("Error generating content with OpenAI:", error);
    throw error;
  }
}

/**
 * Constructs a system message based on content generation parameters
 * @param params Content generation parameters
 * @returns System message string
 */
function constructSystemMessage(params: ContentGenerationParams): string {
  const toneDescription = getToneDescription(params.tone);
  const archetypeDescription = getArchetypeDescription(params.brandArchetype);
  
  // Additional anti-detection guidance based on prioritizeUndetectable setting
  const antiDetectionGuidance = params.prioritizeUndetectable 
    ? `
ANTI-DETECTION PRIORITY GUIDELINES:
- Prioritize human-like variations over consistency
- Incorporate occasional minor grammatical imperfections
- Use colloquialisms and conversational language where appropriate
- Vary sentence structure and length significantly
- Include personal perspectives and subjective views
- Insert occasional narrative tangents that add personality
- Use less predictable vocabulary choices and phrasing
- Balance technical correctness with human imperfection
`
    : '';
  
  return `
You are a professional content creator with expertise in creating high-quality, engaging content.

CONTENT REQUIREMENTS:
- Create content based on the user's prompt
- Write in a ${params.tone} tone (${toneDescription})
- Embody the ${params.brandArchetype} brand archetype (${archetypeDescription})
- Target word count: ${params.wordCount} words (stay within 10% of this target)
- Content should be well-structured with appropriate headings, paragraphs, and formatting
- Use active voice and engaging language
- Ensure content is factually accurate and appropriately researched
- Avoid using AI-detection triggering patterns (varied sentence structure, natural language flow)
${antiDetectionGuidance}
CONTENT STRUCTURE:
- Include a compelling headline/title
- Organize with clear sections and subheadings where appropriate
- Use appropriate formatting for readability (paragraphs, bullet points if needed)
- Maintain logical flow of ideas

CONSTRAINTS:
- Do not include placeholder text or lorem ipsum
- Do not include meta-commentary about the content itself
- Do not mention that you are an AI unless explicitly asked to do so
- Do not start with phrases like "Here's a..." or "Below is..."
- Focus on delivering valuable, engaging, and informative content
`;
}

/**
 * Helper function to generate content with OpenAI
 * @param systemMessage System message for content generation
 * @param userPrompt User prompt for content generation
 * @param options Additional generation options
 * @returns Generated content and token usage
 */
async function generateWithOpenAI(
  systemMessage: string, 
  userPrompt: string, 
  options: { temperature?: number; max_tokens?: number } = {}
) {
  try {
    // Use provided options or default values
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const max_tokens = options.max_tokens !== undefined ? options.max_tokens : 2000;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature,
      max_tokens,
    });
    
    return { 
      content: response.choices[0].message.content || "",
      usage: response.usage,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Error generating content with OpenAI API. Please try again later.");
  }
}

// Helper functions for tone and archetype descriptions
function getToneDescription(tone: string): string {
  const descriptions: Record<string, string> = {
    professional: "formal, authoritative, and credible",
    casual: "relaxed, conversational, and approachable",
    persuasive: "convincing, compelling, and motivational",
    informative: "educational, clear, and objective",
    humorous: "light-hearted, entertaining, and witty",
    formal: "sophisticated, serious, and structured",
  };
  
  return descriptions[tone] || "balanced and appropriate";
}

function getArchetypeDescription(archetype: string): string {
  const descriptions: Record<string, string> = {
    sage: "wise, thoughtful, and insightful",
    hero: "courageous, triumphant, and inspiring",
    outlaw: "rebellious, disruptive, and revolutionary",
    explorer: "adventurous, independent, and pioneering",
    creator: "innovative, artistic, and imaginative",
    ruler: "authoritative, structured, and commanding",
    caregiver: "nurturing, supportive, and empathetic",
    innocent: "optimistic, pure, and straightforward",
    everyman: "relatable, authentic, and down-to-earth",
    jester: "playful, entertaining, and humorous",
    lover: "passionate, indulgent, and appreciative",
    magician: "transformative, visionary, and charismatic",
  };
  
  return descriptions[archetype] || "authentic and engaging";
}

/**
 * Generates SEO keywords and hashtags based on content
 * @param params Content parameters for SEO generation
 * @returns List of generated keywords and hashtags
 */
export async function generateSeoKeywords(params: SeoGenerationParams): Promise<SeoGenerationResult> {
  try {
    const systemMessage = `
You are an expert SEO specialist who can identify the most effective keywords and hashtags for content.

TASK:
- Analyze the content provided
- Extract 10-15 relevant keywords and hashtags that would help the content rank well in search engines
- Include a mix of primary keywords, long-tail keywords, and trending hashtags
- Focus on keywords that have search volume but moderate competition
- Format hashtags appropriately (include # for social media hashtags)

RESPONSE FORMAT:
- Return a JSON object with a 'keywords' field containing an array of strings
- Your response must be in the format: {"keywords": ["keyword1", "keyword2", "#hashtag1"]}
- Do not include explanations, introductions, or any other text outside the JSON structure
`;

    // Truncate content if too long
    const truncatedContent = params.content.length > 4000 
      ? params.content.substring(0, 4000) + "..." 
      : params.content;

    // Request formatted as JSON for better parsing
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: truncatedContent }
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(content);
      
      // If the response doesn't have a keywords array, create a default one
      if (!Array.isArray(parsedResponse.keywords)) {
        // Try to extract an array from any property that might be an array
        const firstArrayProperty = Object.values(parsedResponse).find(value => Array.isArray(value));
        
        if (Array.isArray(firstArrayProperty)) {
          parsedResponse = { keywords: firstArrayProperty };
        } else {
          // If we can't find an array, create a default keywords array
          parsedResponse = { 
            keywords: ["content", "article", "information", "#content", "#trending"] 
          };
        }
      }
    } catch (error) {
      console.error("Error parsing SEO keywords response:", error);
      // Provide a default response rather than attempting to parse unpredictable text
      parsedResponse = { 
        keywords: ["content", "article", "information", "#content", "#trending"] 
      };
    }

    return { 
      keywords: Array.isArray(parsedResponse.keywords) 
        ? parsedResponse.keywords 
        : ["keywords", "seo", "content", "#keywords"] // Final fallback
    };
  } catch (error) {
    console.error("Error generating SEO keywords:", error);
    throw new Error("Failed to generate SEO keywords. Please try again later.");
  }
}