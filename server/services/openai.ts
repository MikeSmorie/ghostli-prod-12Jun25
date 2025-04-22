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
    // Generate content
    const { content, usage } = await generateWithOpenAI(systemMessage, params.prompt);
    
    // Count words in the generated content
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // If word count is significantly different from requested, do another pass
    let iterations = 1;
    let finalContent = content;
    
    if (Math.abs(wordCount - params.wordCount) > params.wordCount * 0.2 && params.wordCount > 100) {
      // Add adjustment note for second iteration
      const adjustmentPrompt = `The content needs to be adjusted to be closer to ${params.wordCount} words. Current word count is ${wordCount}. ${wordCount > params.wordCount ? 'Please make it more concise.' : 'Please expand on it a bit more.'}`;
      
      const { content: adjustedContent } = await generateWithOpenAI(systemMessage, adjustmentPrompt + "\n\nOriginal content:\n" + finalContent);
      finalContent = adjustedContent;
      iterations++;
    }

    // Apply anti-AI detection treatment if requested
    if (params.antiAIDetection) {
      const antiAIPrompt = "Rewrite the following content to make it less detectable by AI detection tools without changing the meaning or intent:";
      const { content: humanizedContent } = await generateWithOpenAI(systemMessage, antiAIPrompt + "\n\n" + finalContent);
      finalContent = humanizedContent;
      iterations++;
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
 * @returns Generated content and token usage
 */
async function generateWithOpenAI(systemMessage: string, userPrompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
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
- Return ONLY an array of strings, each containing a keyword or hashtag
- Do not include explanations, introductions, or any other text
- Ensure the response is valid JSON in the format: ["keyword1", "keyword2", "#hashtag1", etc.]
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
      // The response should have a "keywords" array property
      // If it doesn't, we'll try to extract it from the response
      if (!Array.isArray(parsedResponse.keywords) && !Array.isArray(parsedResponse)) {
        // Fallback in case the AI didn't format as expected
        const keywordsPattern = /\["([^"]+)"(?:,\s*"([^"]+)")*\]/;
        const match = content.match(keywordsPattern);
        if (match) {
          const keywordsStr = match[0];
          parsedResponse = { keywords: JSON.parse(keywordsStr) };
        } else {
          // If all else fails, extract words with # as hashtags
          const hashtags = content.match(/#\w+/g) || [];
          const keywords = content.match(/["']([^"']+)["']/g)?.map(k => k.replace(/["']/g, '')) || [];
          parsedResponse = { keywords: [...hashtags, ...keywords].slice(0, 15) };
        }
      }
    } catch (error) {
      console.error("Error parsing SEO keywords response:", error);
      // Fallback to simple extraction if JSON parsing fails
      const keywords = content.match(/["']([^"']+)["']/g)?.map(k => k.replace(/["']/g, '')) || [];
      parsedResponse = { keywords };
    }

    return { 
      keywords: Array.isArray(parsedResponse.keywords) 
        ? parsedResponse.keywords 
        : Array.isArray(parsedResponse) 
          ? parsedResponse 
          : ["content", "seo", "keywords"] // Fallback if nothing else works
    };
  } catch (error) {
    console.error("Error generating SEO keywords:", error);
    throw new Error("Failed to generate SEO keywords. Please try again later.");
  }
}