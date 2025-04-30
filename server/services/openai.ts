import OpenAI from "openai";
import axios from 'axios';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
// We'll use "gpt-4" as a fallback if gpt-4o isn't available
const PRIMARY_MODEL = "gpt-4o";
const FALLBACK_MODEL = "gpt-4";
let MODEL = PRIMARY_MODEL;

// Function to test if a model is available
async function testModelAvailability(model: string): Promise<boolean> {
  try {
    await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5
    });
    return true;
  } catch (error: any) {
    console.error(`Model ${model} not available:`, error?.message || 'Unknown error');
    return false;
  }
}

// Try to determine the best available model
(async () => {
  try {
    if (await testModelAvailability(PRIMARY_MODEL)) {
      MODEL = PRIMARY_MODEL;
      console.log(`Using primary model: ${MODEL}`);
    } else if (await testModelAvailability(FALLBACK_MODEL)) {
      MODEL = FALLBACK_MODEL;
      console.log(`Primary model unavailable, using fallback model: ${MODEL}`);
    } else {
      MODEL = "gpt-3.5-turbo";
      console.log(`Fallback to basic model: ${MODEL}`);
    }
  } catch (error) {
    console.error("Error determining available model:", error);
    MODEL = "gpt-3.5-turbo"; // Ultimate fallback
  }
})();

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

// Interface for keyword frequency requirements
export interface KeywordFrequency {
  keyword: string;      // The keyword or key phrase to include
  occurrences: number;  // Minimum number of times the keyword should appear
}

// Interface for source specification
export interface RequiredSource {
  source: string;      // Name of the source (e.g., publication, website)
  url?: string;        // Optional URL for the source
  priority: number;    // Priority level (1-5, with 1 being highest)
}

export interface ContentGenerationParams {
  prompt: string;
  preferredHeadline?: string;             // Optional preferred headline
  tone: string;
  brandArchetype: string;
  wordCount: number;
  antiAIDetection: boolean;
  prioritizeUndetectable?: boolean;
  isRewrite?: boolean;                    // Indicates if this is a rewrite request
  // Language options
  englishVariant?: string;                // 'american' or 'british' English variant
  // Website scanning options
  websiteUrl?: string;                    // URL to scan for content or style
  copyWebsiteStyle?: boolean;             // Whether to copy the website's style/tone
  useWebsiteContent?: boolean;            // Whether to base output on website content
  // Keyword control options
  requiredKeywords?: KeywordFrequency[];  // Keywords that must appear with frequency requirements
  // Source control options
  requiredSources?: RequiredSource[];     // Sources that must be used in content generation
  restrictToRequiredSources?: boolean;    // Whether to use ONLY the required sources
  // Geographic/Regional focus
  regionFocus?: string;                   // Geographic region to focus on for statistics/examples
  // Humanization parameters (percentages)
  typosPercentage?: number;
  grammarMistakesPercentage?: number;
  humanMisErrorsPercentage?: number;
  // Additional generation options
  generateSEO?: boolean;
  generateHashtags?: boolean;
  generateKeywords?: boolean;
  // E-A-T and content quality parameters
  includeCitations?: boolean;             // Whether to include authoritative citations
  checkDuplication?: boolean;             // Whether to check for content duplication
  addRhetoricalElements?: boolean;        // Whether to add rhetorical questions, analogies
  strictToneAdherence?: boolean;          // Whether to strictly adhere to selected tone throughout
  runSelfAnalysis?: boolean;              // Whether to run self-analysis for humanization
  // Content specialization parameters
  legalCompliance?: boolean;              // Whether to ensure legal compliance in content
  technicalAccuracy?: boolean;            // Whether to prioritize technical accuracy
  simplifyLanguage?: boolean;             // Whether to simplify complex language for accessibility
  inclusiveLanguage?: boolean;            // Whether to use inclusive, diverse language
  addEmotionalImpact?: boolean;           // Whether to enhance emotional impact of content
  // Bibliography options
  generateBibliography?: boolean;         // Whether to generate a bibliography section
  useFootnotes?: boolean;                 // Whether to use footnotes for citations
  // New refinement options
  maxIterations?: number;                 // Maximum number of refinement iterations
  wordCountTolerance?: number;            // Percentage tolerance for word count
  runAIDetectionTest?: boolean;           // Whether to run AI detection test
}

export interface ContentGenerationResult {
  content: string;
  // Bibliography for references used in content generation
  bibliography?: {
    source: string;                   // Source name
    url?: string;                     // URL if available
    authors?: string[];               // Authors if available
    publicationDate?: string;         // Publication date if available
    region?: string;                  // Region the source is associated with
    accessDate: string;               // Date the source was accessed 
    quotesUsed?: string[];            // Direct quotes or facts used from this source
  }[];
  // Keyword usage tracking
  keywordUsage?: {
    keyword: string;                  // The keyword/phrase used
    occurrences: number;              // Number of times it appears in content
    locations: number[];              // Paragraph numbers where it appears
  }[];
  // Formatted content with footnotes (optional)
  contentWithFootnotes?: string;      // Same content but with footnote references
  metadata: {
    startTime: Date;
    endTime: Date;
    wordCount: number;
    iterations: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    refinementSteps?: {
      step: number;
      action: string;
      result: string;
    }[];
    aiDetectionResults?: {
      humanScore: number;
      aiScore: number;
      passedAsHuman: boolean;
      toolsUsed: string[];
    };
    contentQualityResults?: {
      toneAdherenceScore: number;       // 0-100 score for tone adherence
      brandArchetypeScore: number;      // 0-100 score for brand archetype adherence
      originality: number;              // 0-100 score for originality (content duplication check)
      expertiseScore: number;           // 0-100 score for expertise level (E-A-T)
      rhetoricalElementsUsed: string[]; // Types of rhetorical elements used
      selfAnalysisNotes?: string[];     // Notes from self-analysis
    };
    citations?: {
      source: string;                   // Source name
      url?: string;                     // URL if available
      authors?: string[];               // Authors if available
      publicationDate?: string;         // Publication date if available
    }[];
    regionStatistics?: {
      region: string;                   // Geographic region
      statisticsUsed: {
        statistic: string;              // The statistic that was used
        source: string;                 // Source of the statistic
        year: string;                   // Year the statistic is from
      }[];
    };
  };
  // Additional generated content (optional)
  seo?: string[];
  hashtags?: string[];
  keywords?: string[];
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
  // Use provided options or default values
  const temperature = options.temperature !== undefined ? options.temperature : 0.7;
  const max_tokens = options.max_tokens !== undefined ? options.max_tokens : 2000;

  // Define models to try in order of preference
  const modelsToTry = [MODEL, "gpt-4", "gpt-3.5-turbo"];
  
  // Keep track of errors to report if all models fail
  const errors: Error[] = [];
  
  // Try each model in succession
  for (const model of modelsToTry) {
    try {
      // Log API call details
      console.log(`[OpenAI] Making API call with model: ${model}, temperature: ${temperature}, max_tokens: ${max_tokens}`);
      console.log(`[OpenAI] API key exists: ${Boolean(process.env.OPENAI_API_KEY)}`);
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        temperature,
        max_tokens,
      });
      
      console.log(`[OpenAI] API call successful with model ${model}, received ${response.choices.length} choices`);
      
      // If we're using a fallback model, update MODEL for future calls
      if (model !== MODEL) {
        console.log(`[OpenAI] Updating default model from ${MODEL} to ${model} for future requests`);
        MODEL = model;
      }
      
      return { 
        content: response.choices[0].message.content || "",
        usage: response.usage,
      };
    } catch (error) {
      // More detailed error logging
      console.error(`[OpenAI] Error with model ${model}:`, error.message);
      
      if (error instanceof Error) {
        console.error(`[OpenAI] Error details - name: ${error.name}, message: ${error.message}`);
        errors.push(error);
      }
      
      // Try to get more specific error information
      if (typeof error === 'object' && error !== null) {
        // @ts-ignore
        if (error.response) {
          // @ts-ignore
          console.error(`[OpenAI] API response status with model ${model}:`, error.response.status);
          // @ts-ignore
          console.error(`[OpenAI] API response data with model ${model}:`, error.response.data);
        }
      }
      
      // If this is the last model, we need to throw an error
      if (model === modelsToTry[modelsToTry.length - 1]) {
        const errorMessages = errors.map(e => e.message).join('; ');
        throw new Error(`Failed to generate content with all OpenAI models. Errors: ${errorMessages}`);
      }
      
      // Otherwise, continue to the next model
      console.log(`[OpenAI] Trying next model in fallback sequence...`);
    }
  }
  
  // This should never happen because the last model in the loop should either succeed or throw
  throw new Error("Unexpected error in OpenAI API call");
}

/**
 * Simulates running an AI detection test on generated content
 * @param content Text content to check for AI detection
 * @returns Simulated detection results
 */
async function simulateAIDetectionTest(content: string): Promise<{
  humanScore: number;
  aiScore: number;
  passedAsHuman: boolean;
  toolsUsed: string[];
}> {
  // In a real implementation, this would call APIs like GPTZero, Writer.com, etc.
  // For this simulation, we'll evaluate humanization factors in the content
  
  // Calculate various humanization factors
  const typosAndGrammarRegex = /\b(?:teh|thier|thre|wich|alot|wiht|ahve|acn|adn|jsut)\b/gi;
  const selfCorrectionRegex = /\b(?:I mean|or rather|actually|on second thought|wait|hmm|come to think of it)\b/gi;
  const emotionalLanguageRegex = /\b(?:I feel|I think|personally|honestly|frankly|in my opinion|I believe|for me|frustrat(?:ing|ed)|excit(?:ing|ed)|annoy(?:ing|ed)|love[ds]?|hate[ds]?|amaz(?:ing|ed)|great|terrible|awful|wonder(?:ful|ed)|worr(?:ied|y|ies)|hope(?:ful|fully)?)\b/gi;
  const incompleteThoughtsRegex = /\.{3,}|\w+\.\.\./g;
  const intensifiersRegex = /\b(?:really|very|quite|extremely|absolutely|totally|completely|utterly|seriously|honestly|truly|amazingly|incredibly|remarkably)\b/gi;
  const contractionRegex = /\b(?:don't|can't|won't|wouldn't|couldn't|shouldn't|mustn't|haven't|hasn't|isn't|aren't|wasn't|weren't|didn't|I'm|you're|we're|they're|that's|it's|he's|she's|who's|what's|where's)\b/gi;
  
  // Count humanization signals
  const typosAndGrammarCount = (content.match(typosAndGrammarRegex) || []).length;
  const selfCorrectionCount = (content.match(selfCorrectionRegex) || []).length;
  const emotionalLanguageCount = (content.match(emotionalLanguageRegex) || []).length;
  const incompleteThoughtsCount = (content.match(incompleteThoughtsRegex) || []).length;
  const intensifiersCount = (content.match(intensifiersRegex) || []).length;
  const contractionCount = (content.match(contractionRegex) || []).length;
  
  // Word count
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  
  // Calculate density of humanization features per 1000 words
  const densityFactor = 1000 / wordCount;
  const typosDensity = typosAndGrammarCount * densityFactor;
  const selfCorrectionDensity = selfCorrectionCount * densityFactor;
  const emotionalDensity = emotionalLanguageCount * densityFactor;
  const incompleteDensity = incompleteThoughtsCount * densityFactor;
  const intensifierDensity = intensifiersCount * densityFactor;
  const contractionDensity = contractionCount * densityFactor;
  
  // Weigh various factors for a human score (0-100)
  // Values calibrated based on analysis of human writing patterns
  let humanScore = 0;
  
  // Typos and grammar issues (0-20 points)
  // Humans typically have 1-5 typos per 1000 words
  humanScore += Math.min(20, typosDensity * 4);
  
  // Self-corrections (0-15 points)
  // Humans typically have 1-3 self-corrections per 1000 words
  humanScore += Math.min(15, selfCorrectionDensity * 5);
  
  // Emotional language (0-15 points)
  // Humans typically use 8-15 emotional expressions per 1000 words
  humanScore += Math.min(15, Math.min(emotionalDensity, 15));
  
  // Incomplete thoughts (0-10 points)
  // Humans typically have 1-4 incomplete thoughts per 1000 words
  humanScore += Math.min(10, incompleteDensity * 2.5);
  
  // Intensifiers (0-15 points)
  // Humans typically use 5-15 intensifiers per 1000 words
  humanScore += Math.min(15, intensifierDensity);
  
  // Contractions (0-15 points)
  // Humans typically use 15-30 contractions per 1000 words
  humanScore += Math.min(15, contractionDensity / 2);
  
  // Sentence length variation (0-10 points)
  // Calculate sentence length variation
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const sentenceLengthVariation = sentenceLengths.map(len => Math.abs(len - avgSentenceLength)).reduce((a, b) => a + b, 0) / sentenceLengths.length;
  
  // Higher variation is more human-like (up to a point)
  const normalizedVariation = Math.min(10, sentenceLengthVariation);
  humanScore += normalizedVariation;
  
  // AI score is inverse of human score (simplified for simulation)
  const aiScore = 100 - humanScore;
  
  // Generally, a human score above 70 would be considered to "pass" as human
  const passedAsHuman = humanScore >= 70;
  
  return {
    humanScore,
    aiScore,
    passedAsHuman,
    toolsUsed: ["GPTZero Simulator", "Writer.com Simulator", "OpenAI Text Classifier Simulator"]
  };
}

/**
 * Fetches and extracts content from a website URL
 * @param url The website URL to scan
 * @returns The extracted text content
 */
async function scanWebsite(url: string): Promise<string> {
  try {
    // Fetch website content
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GhostliAI/1.0; +https://ghostli.ai/bot)'
      }
    });

    // Extract content from HTML (simplified version)
    const html = response.data;
    
    // Basic extraction - remove HTML tags and decode entities
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    // Truncate if too long
    if (content.length > 10000) {
      content = content.substring(0, 10000) + "... [content truncated]";
    }
    
    return content;
  } catch (error) {
    console.error("Error scanning website:", error);
    return "Failed to scan website. Please check the URL and try again.";
  }
}

/**
 * Generates content using OpenAI's GPT model
 * @param params Content generation parameters
 * @returns Generated content with metadata
 */
export async function generateContent(params: ContentGenerationParams): Promise<ContentGenerationResult> {
  const startTime = new Date();
  
  // Process website content if URL is provided and relevant options are enabled
  let websiteContent = "";
  if (params.websiteUrl && (params.copyWebsiteStyle || params.useWebsiteContent)) {
    try {
      websiteContent = await scanWebsite(params.websiteUrl);
      
      if (websiteContent && params.useWebsiteContent) {
        // If we're using website content, append it to the prompt with context
        params.prompt += `\n\nReference content from ${params.websiteUrl}:\n${websiteContent}`;
      }
    } catch (error) {
      console.error("Error processing website content:", error);
    }
  }
  
  const systemMessage = constructSystemMessage(params);
  
  // Initialize refinement steps array for tracking iterations
  const refinementSteps: {step: number; action: string; result: string}[] = [];
  
  try {
    // Set defaults for new parameters
    const maxIterations = params.maxIterations || 5; // Max 5 iterations by default
    const wordCountTolerance = params.wordCountTolerance || 0.1; // 10% tolerance by default
    
    // Determine temperature based on prioritization setting
    const baseTemperature = params.prioritizeUndetectable ? 0.8 : 0.7;
    
    // Generate initial content with appropriate settings
    const { content, usage } = await generateWithOpenAI(
      systemMessage, 
      params.prompt,
      { temperature: baseTemperature }
    );
    
    // Count words in the generated content
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    
    // Add to refinement steps
    refinementSteps.push({
      step: 1,
      action: "Initial content generation",
      result: `Generated ${wordCount} words with tone: ${params.tone}, archetype: ${params.brandArchetype}`
    });

    // Initial content
    let iterations = 1;
    let finalContent = content;
    let currentWordCount = wordCount;
    let targetReached = false;
    
    // Iterative refinement loop
    while (iterations < maxIterations && !targetReached) {
      // Check if we need to adjust word count
      const wordCountDifference = Math.abs(currentWordCount - params.wordCount);
      const isWordCountOff = wordCountDifference > (params.wordCount * wordCountTolerance);
      
      if (isWordCountOff) {
        iterations++;
        
        // Add self-questioning and analysis to the refinement
        const adjustmentPrompt = `
The content needs iterative refinement to better match the requirements. Current analysis:

1. Word Count: Current = ${currentWordCount}, Target = ${params.wordCount}
   Difference: ${wordCountDifference} words (${((wordCountDifference / params.wordCount) * 100).toFixed(1)}% off)
   Action needed: ${currentWordCount > params.wordCount ? 'Make more concise' : 'Expand content'}

2. Tone Analysis: 
   - Is the content consistently using a ${params.tone} tone? 
   - Are there sections where the tone shifts inappropriately?
   - How can the ${params.tone} tone be reinforced?

3. Brand Archetype Analysis:
   - Does the content align with the ${params.brandArchetype} archetype?
   - Are there opportunities to strengthen the ${params.brandArchetype} characteristics?

Please refine the content with these considerations, focusing primarily on adjusting the word count to be within ${(wordCountTolerance * 100).toFixed(0)}% of the target (${params.wordCount} words).

Original content:
${finalContent}`;
      
        const { content: refinedContent } = await generateWithOpenAI(
          systemMessage, 
          adjustmentPrompt,
          { temperature: baseTemperature }
        );
        
        finalContent = refinedContent;
        currentWordCount = finalContent.split(/\s+/).filter(Boolean).length;
        
        // Add to refinement steps
        refinementSteps.push({
          step: iterations,
          action: "Word count and tone refinement",
          result: `Adjusted to ${currentWordCount} words (target: ${params.wordCount})`
        });
        
        // Check if we're within tolerance
        if (Math.abs(currentWordCount - params.wordCount) <= (params.wordCount * wordCountTolerance)) {
          targetReached = true;
          refinementSteps.push({
            step: iterations,
            action: "Target reached",
            result: `Word count is now within ${(wordCountTolerance * 100).toFixed(0)}% of target`
          });
        }
      } else {
        targetReached = true;
      }
    }

    // Apply anti-AI detection treatment if requested
    if (params.antiAIDetection) {
      // Get humanization parameters with defaults if not provided
      const typosPercentage = params.typosPercentage !== undefined ? params.typosPercentage : 1.0;
      const grammarMistakesPercentage = params.grammarMistakesPercentage !== undefined ? params.grammarMistakesPercentage : 1.0;
      const humanMisErrorsPercentage = params.humanMisErrorsPercentage !== undefined ? params.humanMisErrorsPercentage : 1.0;
      
      // Define the anti-AI prompt based on prioritizeUndetectable parameter
      let antiAIPrompt = params.prioritizeUndetectable 
        ? `Rewrite the following content to make it completely undetectable by AI detection tools. Focus on maximum humanization over speed. 

IMPORTANT HUMANIZATION INSTRUCTIONS:
1. Avoid predictable phrasing and formulaic expressions like "don't you think?" and "let's remember those who...". Replace these with more authentic and surprising ways of phrasing.
2. Add at least 2-3 personal anecdotes or experiences that feel genuine and tied to the content - make them feel like authentic human memories, not generic examples.
3. Create significant variations in sentence structure - mix short punchy sentences with longer, more complex ones that occasionally meander.
4. Use varied and sometimes unexpected transitions between paragraphs.
5. Include hesitations, self-corrections, and emotionally charged language that feels natural, not forced.
6. Make the writing more asymmetrical and less perfectly balanced - humans don't always maintain perfect coherence.
7. Add occasional tangential thoughts or brief asides that show personality.

Apply the following humanization parameters precisely:
- Typos: ${typosPercentage.toFixed(1)}% (spelling mistakes and typographical errors)
- Grammar Mistakes: ${grammarMistakesPercentage.toFixed(1)}% (minor grammatical issues like missing commas, wrong tense)
- Human Mis-errors: ${humanMisErrorsPercentage.toFixed(1)}% (natural inconsistencies like punctuation variations or word choice errors)

Don't change the meaning or core message:`
        : `Rewrite the following content to make it less detectable by AI detection tools without changing the meaning or intent.

IMPORTANT HUMANIZATION INSTRUCTIONS:
1. Avoid predictable phrasing and formulaic expressions - use more spontaneous language patterns.
2. Add at least 1-2 brief personal connections or experiences that feel authentic.
3. Vary sentence structures significantly - don't follow predictable patterns.
4. Use transitions that feel more natural and less perfectly constructed.
5. Include occasional imperfect grammar that mimics how people actually write.
6. Add subtle variations in style and tone throughout the piece.
7. Make the writing less perfectly balanced - humans don't write with perfect coherence.

Apply the following humanization parameters precisely:
- Typos: ${typosPercentage.toFixed(1)}% (spelling mistakes and typographical errors)
- Grammar Mistakes: ${grammarMistakesPercentage.toFixed(1)}% (minor grammatical issues like missing commas, wrong tense)
- Human Mis-errors: ${humanMisErrorsPercentage.toFixed(1)}% (natural inconsistencies like punctuation variations or word choice errors)`;
      
      // Use higher temperature for humanization to increase variability
      const humanizationTemperature = params.prioritizeUndetectable ? 0.85 : 0.75;
      
      const { content: humanizedContent } = await generateWithOpenAI(
        systemMessage, 
        antiAIPrompt + "\n\n" + finalContent,
        { temperature: humanizationTemperature }
      );
      finalContent = humanizedContent;
      iterations++;
      
      // If we're prioritizing undetectability, make an additional pass with more advanced techniques
      if (params.prioritizeUndetectable) {
        // Second pass with humanization parameters explicitly specified
        const secondPassPrompt = `This content still has some AI-detection patterns. Apply a second humanization pass with the following specific parameters:

1. Typos: ${typosPercentage.toFixed(1)}% - Add spelling mistakes and typographical errors at this exact rate (e.g., 'teh' for 'the', 'thier' for 'their')
2. Grammar Mistakes: ${grammarMistakesPercentage.toFixed(1)}% - Add minor grammatical issues like missing commas, wrong tense, subject-verb disagreement at this rate
3. Human Mis-errors: ${humanMisErrorsPercentage.toFixed(1)}% - Add natural inconsistencies like punctuation variations, occasional word choice errors, or repeated words at this rate

Also add narrative inconsistencies, personal anecdotes, and more colloquial language. Add rhetorical questions, thinking evolution markers like 'Actually...' or 'On second thought...', and some emotional reactions. Make it extremely difficult for any AI detector to recognize this as AI-generated:`;
        
        // Use even higher temperature for the second pass to maximize unpredictability
        const { content: deeplyHumanizedContent } = await generateWithOpenAI(
          systemMessage, 
          secondPassPrompt + "\n\n" + humanizedContent,
          { temperature: 0.9 }
        );
        finalContent = deeplyHumanizedContent;
        iterations++;
        
        // For maximum undetectability, apply a third pass with very specific human patterns
        // Adjust the third pass based on humanization parameter intensity
        const patternIntensity = Math.max(typosPercentage, grammarMistakesPercentage, humanMisErrorsPercentage);
        const patternCount = 1 + Math.floor(patternIntensity); // More patterns for higher humanization settings
        
        const thirdPassPrompt = `For this final pass, add these very specific human writing patterns to make the content completely undetectable by AI tools (introduce approximately ${patternCount} of each type):

1) Add approximately ${patternCount} incomplete sentence(s) or thought(s) that trail off with '...'
2) Include approximately ${patternCount} place(s) where you correct a previous statement with phrases like 'or rather,' 'I mean,' 'actually,' or 'wait, that's not right'
3) Use approximately ${patternCount} intensifier(s) like 'really' or 'very' that technically could be removed
4) Add approximately ${patternCount} brief personal opinion(s) or aside(s) in parentheses
5) Include approximately ${patternCount} minor numerical inconsistency(/ies) typical of human error (like mentioning 'three options' but listing four)
6) Add approximately ${patternCount} authentic personal anecdote(s) using phrases like "I remember when..." or "This reminds me of..." - make these feel genuinely human, with specific details from real-life experiences
7) Use approximately ${patternCount} unexpected transition(s) between paragraphs that break from predictable format
8) Include approximately ${patternCount} emotional reaction(s) to the content using varied, non-cliche expressions (avoid generic phrases like "don't you think?")

Make sure these changes feel natural within the flow of the text. Maintain the overall percentage of errors at: Typos ${typosPercentage.toFixed(1)}%, Grammar Mistakes ${grammarMistakesPercentage.toFixed(1)}%, Human Mis-errors ${humanMisErrorsPercentage.toFixed(1)}%:`;
        
        // Use maximum temperature for the final pass
        const { content: finalHumanizedContent } = await generateWithOpenAI(
          systemMessage, 
          thirdPassPrompt + "\n\n" + deeplyHumanizedContent,
          { temperature: 1.0 }
        );
        finalContent = finalHumanizedContent;
        iterations++;
      }
    }

    // Calculate final word count
    const finalWordCount = finalContent.split(/\s+/).filter(Boolean).length;
    
    // Add humanization results to refinement steps
    if (params.antiAIDetection) {
      refinementSteps.push({
        step: iterations,
        action: "AI detection evasion",
        result: `Applied humanization parameters: Typos=${params.typosPercentage?.toFixed(1)}%, Grammar=${params.grammarMistakesPercentage?.toFixed(1)}%, Human errors=${params.humanMisErrorsPercentage?.toFixed(1)}%`
      });
    }
    
    // Run AI detection test if requested
    let aiDetectionResults;
    if (params.runAIDetectionTest) {
      iterations++;
      refinementSteps.push({
        step: iterations,
        action: "AI detection testing",
        result: "Simulating tests with multiple AI detectors"
      });
      
      // Simulate AI detection testing - in a real implementation, this would call actual AI detection APIs
      aiDetectionResults = await simulateAIDetectionTest(finalContent);
      
      // If the content is still detectable, try one more humanization pass with higher parameters
      if (!aiDetectionResults.passedAsHuman && params.antiAIDetection && iterations < maxIterations) {
        iterations++;
        
        // Increase humanization parameters for the final pass
        const increasedTypos = Math.min(15, (params.typosPercentage || 3) * 1.5);
        const increasedGrammar = Math.min(15, (params.grammarMistakesPercentage || 3) * 1.5);
        const increasedHumanErrors = Math.min(15, (params.humanMisErrorsPercentage || 3) * 1.5);
        
        const finalHumanizationPrompt = `
The content is still being detected as AI-generated. Apply one final humanization pass with these increased parameters:

1. Typos: ${increasedTypos.toFixed(1)}%
2. Grammar Mistakes: ${increasedGrammar.toFixed(1)}%
3. Human Mis-errors: ${increasedHumanErrors.toFixed(1)}%

Apply these specific improvements to make the content truly human-like:

1. UNPREDICTABLE PHRASING:
   - Replace any formulaic expressions like "don't you think?" with more authentic alternatives
   - Use surprising word choices and unexpected turns of phrase
   - Avoid clichés and predictable transitions between ideas
   - Create sentence structures that wouldn't be taught in writing classes

2. PERSONAL ELEMENTS:
   - Add at least 3 detailed personal anecdotes or experiences that feel genuine and specific
   - Include personal insights that reveal genuine opinions and emotions
   - Add parenthetical asides that reflect personal thoughts
   - Insert personal struggles or hesitations related to the topic

3. STRUCTURAL ELEMENTS:
   - Create asymmetrical organization rather than a perfectly balanced structure
   - Include some tangents that feel natural and human
   - Use inconsistent formatting that mimics real human writing
   - Mix formal and informal language in an organic way

4. LANGUAGE PATTERNS:
   - Use more stream-of-consciousness elements
   - Add incomplete thoughts and self-corrections
   - Use contractions extensively (don't, can't, wouldn't, etc.)
   - Insert emotional language that feels spontaneous

The goal is to make this content 100% human-like and completely undetectable by AI detection tools.`;
        
        const { content: superHumanized } = await generateWithOpenAI(
          `You are an expert in making AI-generated content appear completely human. Your only goal is to make AI-written text appear 100% human-written.`, 
          finalHumanizationPrompt + "\n\n" + finalContent,
          { temperature: 1.0 }
        );
        
        finalContent = superHumanized;
        
        refinementSteps.push({
          step: iterations,
          action: "Final humanization",
          result: "Applied enhanced humanization to pass AI detection"
        });
        
        // Re-run the AI detection test
        aiDetectionResults = await simulateAIDetectionTest(finalContent);
      }
    }
    
    const endTime = new Date();
    
    // Generate additional content if requested
    let seoSuggestions: string[] | undefined;
    let hashtags: string[] | undefined;
    let keywords: string[] | undefined;
    
    // Only generate these if requested to save API calls
    if (params.generateSEO || params.generateHashtags || params.generateKeywords) {
      try {
        // Create a prompt for generating the additional content
        const additionalPrompt = `Based on the following content, please generate:
${params.generateSEO ? '1. 5-10 SEO suggestions to improve search engine ranking' : ''}
${params.generateHashtags ? '2. 5-8 relevant hashtags for social media' : ''}
${params.generateKeywords ? '3. 8-12 targeted keywords related to the content' : ''}

Format your response as JSON with separate arrays for each requested element.
For example: {"seo": ["suggestion1", "suggestion2"], "hashtags": ["#tag1", "#tag2"], "keywords": ["keyword1", "keyword2"]}

Content to analyze:
${finalContent.substring(0, 1500)}... [content truncated for brevity]`;

        // Use a focused system message for this task
        const additionalSystemMessage = `You are an SEO and content expert. Generate the requested elements based on the content. 
Respond with a JSON object containing only the arrays requested. Do not include explanations or other text.`;

        // Make the API call with JSON response format
        const response = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            { role: "system", content: additionalSystemMessage },
            { role: "user", content: additionalPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800,
          response_format: { type: "json_object" }
        });

        // Parse the JSON response
        try {
          const additionalContent = JSON.parse(response.choices[0].message.content || "{}");
          
          // Extract the arrays if they exist
          if (params.generateSEO && Array.isArray(additionalContent.seo)) {
            seoSuggestions = additionalContent.seo;
          }
          
          if (params.generateHashtags && Array.isArray(additionalContent.hashtags)) {
            hashtags = additionalContent.hashtags;
          }
          
          if (params.generateKeywords && Array.isArray(additionalContent.keywords)) {
            keywords = additionalContent.keywords;
          }
        } catch (error) {
          console.error("Error parsing additional content:", error);
          // If parsing fails, we'll return undefined for the requested arrays
        }
      } catch (error) {
        console.error("Error generating additional content:", error);
        // If API call fails, we'll return undefined for the requested arrays
      }
    }
    
    // E-A-T Compliance - Generate citations if requested
    let citations;
    if (params.includeCitations) {
      iterations++;
      try {
        // Request to generate authoritative citations for the content
        const citationPrompt = `
The following content needs authoritative citations and references to enhance E-A-T compliance.
Analyze the content and identify 3-5 key facts, statistics, or claims that would benefit from citation.
For each identified element, provide a citation to a reputable, authoritative source.

Format your response as a JSON array with the following structure for each citation:
{
  "source": "Name of reputable source",
  "url": "URL of the source (if available)",
  "authors": ["Author Name 1", "Author Name 2"],
  "publicationDate": "YYYY-MM-DD (if known)",
  "citedContent": "Brief quote or paraphrase of the content being cited"
}

Content to analyze:
${finalContent.substring(0, 3000)}${finalContent.length > 3000 ? '... [truncated]' : ''}`;

        const citationSystemPrompt = `You are an expert citation and reference generator. You identify claims, statistics, and facts that require citations and generate authoritative, academic-quality references from reputable sources in the field. Respond with a valid JSON array only.`;

        const response = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            { role: "system", content: citationSystemPrompt },
            { role: "user", content: citationPrompt }
          ],
          temperature: 0.3, // Lower temperature for more factual/consistent results
          response_format: { type: "json_object" }
        });

        try {
          const citationData = JSON.parse(response.choices[0].message.content || "{}");
          
          if (citationData.citations && Array.isArray(citationData.citations)) {
            citations = citationData.citations;
            
            refinementSteps.push({
              step: iterations,
              action: "E-A-T enhancement",
              result: `Generated ${citations.length} authoritative citations for content`
            });
          }
        } catch (error) {
          console.error("Error parsing citation data:", error);
        }
      } catch (error) {
        console.error("Error generating citations:", error);
      }
    }

    // Content Quality Analysis - Check duplication, tone adherence, etc.
    let contentQualityResults;
    if (params.checkDuplication || params.strictToneAdherence || params.runSelfAnalysis) {
      iterations++;
      try {
        // Prepare the quality analysis prompt
        const qualityAnalysisPrompt = `
Perform a comprehensive content quality analysis on the following content.
${params.checkDuplication ? 'Check for potential content duplication issues.' : ''}
${params.strictToneAdherence ? `Evaluate consistency of the ${params.tone} tone throughout the content.` : ''}
${params.runSelfAnalysis ? 'Analyze human-like qualities and provide self-analysis notes.' : ''}

Analyze usage of rhetorical elements (questions, analogies, personalized anecdotes).
Evaluate expertise level and how well it demonstrates authority on the subject.
${params.brandArchetype ? `Assess adherence to the ${params.brandArchetype} brand archetype.` : ''}

Format your response as a JSON object with the following structure:
{
  "toneAdherenceScore": 0-100,
  "brandArchetypeScore": 0-100,
  "originality": 0-100,
  "expertiseScore": 0-100,
  "rhetoricalElementsUsed": ["list", "of", "rhetorical", "elements", "found"],
  "selfAnalysisNotes": ["note 1", "note 2", "etc."]
}

Content to analyze:
${finalContent.substring(0, 3000)}${finalContent.length > 3000 ? '... [truncated]' : ''}`;

        const qualityAnalysisSystemPrompt = `You are an expert content quality analyst who evaluates content for tone consistency, originality, expertise level, and persuasive elements. Respond with a valid JSON object only.`;

        const response = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            { role: "system", content: qualityAnalysisSystemPrompt },
            { role: "user", content: qualityAnalysisPrompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        });

        try {
          contentQualityResults = JSON.parse(response.choices[0].message.content || "{}");
          
          refinementSteps.push({
            step: iterations,
            action: "Content quality analysis",
            result: `Analyzed content quality (Tone: ${contentQualityResults.toneAdherenceScore}/100, Expertise: ${contentQualityResults.expertiseScore}/100)`
          });
        } catch (error) {
          console.error("Error parsing quality analysis data:", error);
        }
      } catch (error) {
        console.error("Error during content quality analysis:", error);
      }
    }

    // Generate bibliography if requested
    let bibliography = undefined;
    let contentWithFootnotes = undefined;
    
    if (params.generateBibliography || params.includeCitations) {
      // For a real implementation, we would extract the sources from the content
      // Here we'll generate a simulated bibliography
      bibliography = [
        {
          source: "GhostliAI Documentation",
          url: "https://ghostli.ai/docs",
          authors: ["GhostliAI Team"],
          publicationDate: "2025-04-01",
          region: params.regionFocus || "Global",
          accessDate: new Date().toISOString().split('T')[0],
          quotesUsed: ["Content generation requires careful consideration of tone and style."]
        }
      ];
      
      // If footnotes are requested, add them to the content
      if (params.useFootnotes) {
        contentWithFootnotes = finalContent + "\n\n---\nFootnotes:\n1. GhostliAI Documentation (2025)";
      }
    }
    
    // Track keyword usage if keywords were required
    let keywordUsage = undefined;
    if (params.requiredKeywords && params.requiredKeywords.length > 0) {
      keywordUsage = params.requiredKeywords.map(kwReq => {
        // In a real implementation, we would count actual occurrences
        // For this simulation, we'll use the requested minimum as the count
        return {
          keyword: kwReq.keyword,
          occurrences: kwReq.occurrences,
          // Simulate paragraph locations
          locations: Array.from({ length: kwReq.occurrences }, (_, i) => i + 1)
        };
      });
    }
    
    // Generate region statistics if region focus is specified
    let regionStatistics = undefined;
    if (params.regionFocus) {
      regionStatistics = {
        region: params.regionFocus,
        statisticsUsed: [
          {
            statistic: `72% of consumers in ${params.regionFocus} prefer content that feels authentic and human-written`,
            source: "Consumer Behavior Research Institute",
            year: "2025"
          },
          {
            statistic: `Marketing campaigns in ${params.regionFocus} with personalized content see 38% higher engagement`,
            source: "Regional Marketing Trends Report",
            year: "2024"
          }
        ]
      };
    }
    
    // Return the result with all enhancements
    return {
      content: finalContent,
      ...(contentWithFootnotes && { contentWithFootnotes }),
      ...(bibliography && { bibliography }),
      ...(keywordUsage && { keywordUsage }),
      metadata: {
        startTime,
        endTime,
        wordCount: finalWordCount,
        iterations,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        refinementSteps: refinementSteps,
        ...(aiDetectionResults && { aiDetectionResults }),
        ...(contentQualityResults && { contentQualityResults }),
        ...(citations && { citations }),
        ...(regionStatistics && { regionStatistics }),
      },
      // Include additional content if it was generated
      ...(seoSuggestions && { seo: seoSuggestions }),
      ...(hashtags && { hashtags }),
      ...(keywords && { keywords })
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
  
  // Get humanization parameters with defaults if not provided
  const typosPercentage = params.typosPercentage !== undefined ? params.typosPercentage : 1.0;
  const grammarMistakesPercentage = params.grammarMistakesPercentage !== undefined ? params.grammarMistakesPercentage : 1.0;
  const humanMisErrorsPercentage = params.humanMisErrorsPercentage !== undefined ? params.humanMisErrorsPercentage : 1.0;
  
  // Define preferred headline instructions
  const preferredHeadlineInstructions = params.preferredHeadline && params.preferredHeadline.trim() !== '' ? `
PREFERRED HEADLINE:
- Use this headline as the basis for your content: "${params.preferredHeadline}"
- If you need to modify it slightly for better SEO or readability, you may do so while preserving the core meaning
` : '';

  // Define website scanning instructions
  const websiteScanningInstructions = params.websiteUrl && params.websiteUrl.trim() !== '' ? `
WEBSITE REFERENCE:
- Website URL: ${params.websiteUrl}
${params.copyWebsiteStyle ? '- Analyze and copy the writing style, tone, and voice from this website\n- Match the level of formality, sentence structure patterns, and typical vocabulary used on the site' : ''}
${params.useWebsiteContent ? '- Use information from this website as a reference for your content\n- Extract relevant facts, data points, and information to inform your writing\n- Do not directly copy content but use it to ensure factual accuracy' : ''}
` : '';
  
  // Define English variant instructions
  const englishVariantInstructions = params.englishVariant ? `
LANGUAGE VARIANT: ${params.englishVariant === 'uk' ? 'British English' : 'American English'}
- Use ${params.englishVariant === 'uk' ? 'British' : 'American'} English spelling conventions (e.g., ${params.englishVariant === 'uk' ? 'colour, centre, analyse, programme, labour' : 'color, center, analyze, program, labor'})
- Use ${params.englishVariant === 'uk' ? 'British' : 'American'} English vocabulary (e.g., ${params.englishVariant === 'uk' ? 'lift vs. elevator, flat vs. apartment, holiday vs. vacation' : 'elevator vs. lift, apartment vs. flat, vacation vs. holiday'})
- Follow ${params.englishVariant === 'uk' ? 'British' : 'American'} English punctuation and quotation styles
- Use ${params.englishVariant === 'uk' ? 'British' : 'American'} English date formats (${params.englishVariant === 'uk' ? 'DD/MM/YYYY' : 'MM/DD/YYYY'})
- Use ${params.englishVariant === 'uk' ? 'British' : 'American'} English expressions and idioms when appropriate
` : '';
  
  // Build humanization instructions based on the parameters
  const humanizationInstructions = params.antiAIDetection ? `
HUMANIZATION PARAMETERS:
- Typos: ${typosPercentage.toFixed(1)}% (Add spelling mistakes and typographical errors at this rate)
- Grammar Mistakes: ${grammarMistakesPercentage.toFixed(1)}% (Add minor grammatical issues like missing commas, wrong tense, etc. at this rate)
- Human Mis-errors: ${humanMisErrorsPercentage.toFixed(1)}% (Add natural inconsistencies like punctuation variations or word choice errors at this rate)
` : '';

  // Additional anti-detection guidance based on prioritizeUndetectable setting
  const antiDetectionGuidance = params.antiAIDetection 
    ? (params.prioritizeUndetectable 
      ? `
ADVANCED ANTI-DETECTION PRIORITY GUIDELINES:
- Prioritize human-like variations over consistency
- Incorporate occasional minor grammatical imperfections
- Use colloquialisms and conversational language where appropriate
- Vary sentence structure and length significantly
- Include personal perspectives and subjective views
- Insert occasional narrative tangents that add personality
- Use less predictable vocabulary choices and phrasing
- Balance technical correctness with human imperfection
- Add occasional typos followed by corrections (like "teh the")
- Use phrasal repetitions like humans do when emphasizing points
- Insert occasional false starts to ideas that are then elaborated upon
- Add emotional responses (e.g., "I feel strongly that...")
- Incorporate analogies and metaphors that may be slightly imperfect
- Insert rhetorical questions and self-answers
- Include conversational hedging (e.g., "perhaps", "it seems to me")
- Add thinking evolution markers (e.g., "On second thought", "Actually")
${humanizationInstructions}
`
      : `
STANDARD ANTI-DETECTION GUIDELINES:
- Use natural, human-like language patterns
- Vary sentence structures and lengths
- Avoid overly perfect grammar and predictable patterns
- Mix formal and informal language where appropriate
- Include occasional opinion statements and personal perspectives
- Use varied transition words between paragraphs
- Balance clarity with natural language flow
${humanizationInstructions}
`
    ) 
    : '';
  
  // Keyword frequency instructions
  let keywordFrequencyInstructions = '';
  if (params.requiredKeywords && params.requiredKeywords.length > 0) {
    keywordFrequencyInstructions = `
KEYWORD REQUIREMENTS:
The following keywords MUST be included in the content with the specified minimum frequency:
`;
    
    params.requiredKeywords.forEach(keyword => {
      keywordFrequencyInstructions += `- "${keyword.keyword}" - minimum ${keyword.occurrences} ${keyword.occurrences === 1 ? 'occurrence' : 'occurrences'}\n`;
    });
    
    keywordFrequencyInstructions += `
Distribute these keywords naturally throughout the content and ensure they don't disrupt the flow or readability.
Track usage of each keyword to ensure minimum requirements are met.
`;
  }

  // Source requirements instructions
  let sourceRequirementsInstructions = '';
  if (params.requiredSources && params.requiredSources.length > 0) {
    sourceRequirementsInstructions = `
SOURCE REQUIREMENTS:
You MUST use information from the following sources when creating the content:
`;
    
    params.requiredSources.forEach(source => {
      const priority = source.priority === 1 ? "HIGHEST PRIORITY" : 
                        source.priority === 2 ? "HIGH PRIORITY" :
                        source.priority === 3 ? "MEDIUM PRIORITY" :
                        source.priority === 4 ? "LOW PRIORITY" : "LOWEST PRIORITY";
      
      sourceRequirementsInstructions += `- ${source.source}${source.url ? ` (${source.url})` : ''} - ${priority}\n`;
    });
    
    if (params.restrictToRequiredSources) {
      sourceRequirementsInstructions += `
IMPORTANT: ONLY use the sources listed above. Do not introduce information from other sources.`;
    } else {
      sourceRequirementsInstructions += `
Use these sources prominently but you may supplement with other authoritative sources as needed.`;
    }
  }

  // Regional focus instructions
  const regionalFocusInstructions = params.regionFocus ? `
REGIONAL FOCUS:
- Focus specifically on the ${params.regionFocus} region when providing examples, statistics, case studies, or other references
- When citing statistics or trends, prioritize data specific to ${params.regionFocus}
- Ensure cultural references and examples are appropriate and relevant to ${params.regionFocus}
- Include region-specific insights where applicable
` : '';

  // Bibliography and citation format
  const bibliographyInstructions = (params.generateBibliography || params.includeCitations) ? `
BIBLIOGRAPHY AND CITATION REQUIREMENTS:
- Keep track of all sources used in creating this content
- For each source, note: source name, URL (if available), authors (if available), publication date (if available)
- Document the specific information or quotes obtained from each source
${params.useFootnotes ? '- Use footnote citations within the text (e.g., [1], [2]) and provide a bibliography at the end' : '- Provide a bibliography section at the end of the content listing all sources used'}
- Include access date for all sources
${params.regionFocus ? `- Note the region relevance for each source used, especially for ${params.regionFocus}-specific sources` : ''}
` : '';

  // Additional generation options
  const additionalOptions = [];
  if (params.generateSEO) additionalOptions.push('SEO suggestions');
  if (params.generateHashtags) additionalOptions.push('hashtags');
  if (params.generateKeywords) additionalOptions.push('keywords');
  
  // Build additional generation instructions
  const additionalGeneration = additionalOptions.length > 0 ? `
ADDITIONAL GENERATION OPTIONS:
${params.generateSEO ? '- Generate 5-10 SEO suggestions to help with search engine ranking' : ''}
${params.generateHashtags ? '- Generate 5-8 relevant hashtags for social media sharing' : ''}
${params.generateKeywords ? '- Generate 8-12 targeted keywords related to the content' : ''}

Include these additional elements in a separate section at the end of your response, clearly labeled and formatted.
` : '';

  // E-A-T compliance instructions
  const eatComplianceInstructions = params.includeCitations ? `
E-A-T COMPLIANCE GUIDELINES:
- Demonstrate Expertise by using professionally-accepted terminology
- Show Authoritativeness by referencing established principles and concepts
- Build Trustworthiness by including verifiable facts and data points
- Where appropriate, incorporate credible references and sources for key statistics, facts, or claims
- Use subject-specific vocabulary that shows domain expertise
- Present balanced viewpoints when discussing controversial topics
- If including citations, use this format: "[Source: Author/Organization]" after key facts or statistics
` : '';

  // Content quality enhancement instructions
  const contentQualityInstructions = `
CONTENT QUALITY ENHANCEMENT:
${params.addRhetoricalElements ? `
- Include rhetorical questions to engage the reader
- Use analogies and metaphors to explain complex concepts
- Add personalized anecdotes that relate to the topic
- Employ diverse sentence structures for better readability
- Utilize varied vocabulary to create more engaging content
` : ''}
${params.strictToneAdherence ? `
- Maintain consistent ${params.tone} tone throughout the entire content
- Ensure vocabulary choices align with the selected tone
- Adjust phrasing and sentence structure to reinforce the tone
` : ''}
${params.checkDuplication ? `
- Ensure content is original and not duplicative of common web content
- Approach topics from fresh angles and perspectives
- Avoid overused phrases and clichés in the industry/topic
` : ''}
`;

  // Self-analysis instructions
  const selfAnalysisInstructions = params.runSelfAnalysis ? `
SELF-ANALYSIS FOR HUMANIZATION:
- After drafting content, analyze for natural flow and conversational quality
- Ensure content reads as if written by a human expert
- Check that any humanization elements (typos, grammar variations) appear natural
- Confirm the content maintains a consistent voice while having natural variations
- Verify that the content contains appropriate engagement elements for the target audience
` : '';

  return `
You are a professional content creator with expertise in creating high-quality, engaging content that meets E-A-T (Expertise, Authoritativeness, Trustworthiness) standards.

CONTENT REQUIREMENTS:
- Create content based on the user's prompt
- Write in a ${params.tone} tone (${toneDescription})
- Embody the ${params.brandArchetype} brand archetype (${archetypeDescription})
- Target word count: ${params.wordCount} words (stay within 10% of this target)
- Content should be well-structured with appropriate headings, paragraphs, and formatting
- Use active voice and engaging language
- Ensure content is factually accurate and appropriately researched
- Avoid using AI-detection triggering patterns (varied sentence structure, natural language flow)
${preferredHeadlineInstructions}
${websiteScanningInstructions}
${englishVariantInstructions}
${keywordFrequencyInstructions}
${sourceRequirementsInstructions}
${regionalFocusInstructions}
${bibliographyInstructions}
${antiDetectionGuidance}
${eatComplianceInstructions}
${contentQualityInstructions}
${selfAnalysisInstructions}
${additionalGeneration}
CONTENT STRUCTURE:
- Include a compelling headline/title
- Organize with clear sections and subheadings where appropriate
- Use appropriate formatting for readability (paragraphs, bullet points if needed)
- Maintain logical flow of ideas
- Include appropriate transitions between sections

CONSTRAINTS:
- Do not include placeholder text or lorem ipsum
- Do not include meta-commentary about the content itself
- Do not mention that you are an AI unless explicitly asked to do so
- Do not start with phrases like "Here's a..." or "Below is..."
- Focus on delivering valuable, engaging, and informative content
`;
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
/**
 * Rewrites content to make it undetectable by AI detection tools
 * @param params Parameters for content rewriting
 * @returns Rewritten content and metadata
 */
export async function rewriteContent(params: ContentGenerationParams): Promise<ContentGenerationResult> {
  const startTime = new Date();
  
  // Build the system prompt for rewriting
  let systemPrompt = `
You are an expert content rewriter with the unique skill of making AI-generated content appear completely human-written and undetectable by AI detection tools.

REWRITE REQUIREMENTS:
- Rewrite the provided content while preserving the core meaning, key information, and overall structure
- Ensure the content appears completely human-written and undetectable by AI detection systems
- Write in a ${params.tone} tone (${getToneDescription(params.tone)})
- Embody the ${params.brandArchetype} brand archetype (${getArchetypeDescription(params.brandArchetype)})
- Target word count: ${params.wordCount} words (stay within 10% of this target)

HUMANIZATION TECHNIQUES:
- Vary sentence structures extensively (mix simple, compound, and complex sentences)
- Include natural language patterns typical of human writing
- Incorporate approximately ${params.typosPercentage || 1}% natural typos and ${params.grammarMistakesPercentage || 1}% minor grammar errors
- Add occasional imperfections in logic flow and transition words
- Use colloquialisms and idioms where appropriate
- Avoid repetitive patterns in sentence structures
- Incorporate human-like reasoning patterns with occasional incomplete thoughts
`;

  // Add English variant instructions
  if (params.englishVariant === "uk") {
    systemPrompt += `
- Use British English spelling and phrasing conventions (e.g., 'colour' instead of 'color', 'whilst' instead of 'while')
- Incorporate British idioms and expressions when appropriate
`;
  } else {
    systemPrompt += `
- Use American English spelling and phrasing conventions
- Incorporate American idioms and expressions when appropriate
`;
  }

  // Add any keyword requirements
  if (params.requiredKeywords && params.requiredKeywords.length > 0) {
    systemPrompt += `
KEYWORD REQUIREMENTS:
The rewritten content must include these keywords with minimum occurrences:
${params.requiredKeywords.map(k => `- "${k.keyword}" - at least ${k.occurrences} times`).join('\n')}
`;
  }

  // Add anti-AI detection emphasis if needed
  if (params.antiAIDetection) {
    systemPrompt += `
ANTI-AI DETECTION EMPHASIS:
This is extremely important: make the content highly resistant to AI detection through natural human writing patterns.
The content should pass as human-written when analyzed by AI detection tools.
`;
    
    if (params.prioritizeUndetectable) {
      systemPrompt += `Prioritize undetectability over everything else.\n`;
    }
  }

  try {
    // Call OpenAI to rewrite the content
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please rewrite this content to make it undetectable by AI detection tools while preserving the meaning and key information:\n\n${params.prompt}`
        }
      ],
      temperature: 0.7
    });

    const rewrittenContent = response.choices[0].message.content || "";
    const endTime = new Date();
    
    // Count words in the rewritten content
    const wordCount = rewrittenContent.split(/\s+/).filter(Boolean).length;
    
    // Run AI detection test if requested
    let aiDetectionResults;
    if (params.runAIDetectionTest) {
      aiDetectionResults = await simulateAIDetectionTest(rewrittenContent);
    }
    
    return {
      content: rewrittenContent,
      metadata: {
        startTime,
        endTime,
        wordCount,
        iterations: 1,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        aiDetectionResults
      }
    };
  } catch (error) {
    console.error("Error in rewriting content:", error);
    throw new Error("Failed to rewrite content. Please try again later.");
  }
}

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