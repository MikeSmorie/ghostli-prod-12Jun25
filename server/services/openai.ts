import OpenAI from "openai";
import { logError } from "../middleware/logger";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

interface ContentGenerationParams {
  prompt: string;
  tone: string;
  archetype: string;
  targetWordCount: number;
}

interface ContentGenerationResult {
  content: string;
  actualWordCount: number;
  iterationCount: number;
  processingTimeMs: number;
}

export class OpenAIService {
  /**
   * Generate content with iterative refinement and anti-AI detection
   */
  async generateContent(params: ContentGenerationParams): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    let iterationCount = 0;
    let finalContent = "";
    let wordCount = 0;
    
    try {
      // Initial content generation
      const initialContent = await this.getInitialDraft(params);
      iterationCount++;
      
      // Initial word count analysis
      wordCount = this.countWords(initialContent);
      
      // If word count is within 10% of target, we can proceed to next stage
      let contentToRefine = initialContent;
      if (Math.abs(wordCount - params.targetWordCount) > params.targetWordCount * 0.1) {
        // Adjust word count if needed
        contentToRefine = await this.adjustWordCount(contentToRefine, params.targetWordCount, wordCount);
        iterationCount++;
        wordCount = this.countWords(contentToRefine);
      }
      
      // Tone and archetype alignment check
      let contentToAlign = contentToRefine;
      const alignmentResult = await this.checkAlignment(contentToAlign, params.tone, params.archetype);
      if (!alignmentResult.aligned) {
        contentToAlign = await this.alignContent(contentToAlign, params.tone, params.archetype);
        iterationCount++;
      }
      
      // Apply anti-AI detection techniques
      finalContent = await this.applyAntiAIDetection(contentToAlign);
      iterationCount++;
      
      // Calculate final word count
      wordCount = this.countWords(finalContent);
      
      const processingTimeMs = Date.now() - startTime;
      
      return {
        content: finalContent,
        actualWordCount: wordCount,
        iterationCount,
        processingTimeMs
      };
    } catch (error) {
      await logError(error as Error, "OpenAIService.generateContent");
      throw new Error(`Content generation failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Generate the initial draft based on prompt, tone, and archetype
   */
  private async getInitialDraft(params: ContentGenerationParams): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(params.tone, params.archetype, params.targetWordCount);
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: params.prompt }
      ],
      temperature: 0.7,
      max_tokens: this.estimateMaxTokens(params.targetWordCount),
    });
    
    return response.choices[0].message.content || "";
  }
  
  /**
   * Check if content aligns with desired tone and archetype
   */
  private async checkAlignment(content: string, tone: string, archetype: string): Promise<{aligned: boolean, reasons?: string[]}> {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: `You are an expert content analyzer. Analyze the following content and determine if it aligns with a ${tone} tone and a ${archetype} brand archetype. Respond with JSON in the format: {"aligned": boolean, "reasons": string[] (if not aligned)}` 
        },
        { role: "user", content }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    
    const responseContent = response.choices[0].message.content || "";
    try {
      return JSON.parse(responseContent);
    } catch (e) {
      return { aligned: false, reasons: ["Failed to parse alignment check response."] };
    }
  }
  
  /**
   * Align content with the desired tone and archetype
   */
  private async alignContent(content: string, tone: string, archetype: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: `You are an expert content editor. The following content needs to be revised to better align with a ${tone} tone and a ${archetype} brand archetype. Preserve the original meaning but adjust the style, vocabulary, and sentence structure to match the requested tone and archetype. DO NOT add additional information or change the subject matter.` 
        },
        { role: "user", content }
      ],
      temperature: 0.7,
    });
    
    return response.choices[0].message.content || content;
  }
  
  /**
   * Adjust the word count to match the target
   */
  private async adjustWordCount(content: string, targetWordCount: number, currentWordCount: number): Promise<string> {
    const action = currentWordCount > targetWordCount ? "reduce" : "expand";
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: `You are an expert content editor. The following content needs to be ${action}d from approximately ${currentWordCount} words to ${targetWordCount} words. ${action === "reduce" ? "Remove unnecessary details while preserving the key message." : "Elaborate on existing points without introducing completely new topics."} Preserve the style, tone, and voice of the original content.` 
        },
        { role: "user", content }
      ],
      temperature: 0.7,
    });
    
    return response.choices[0].message.content || content;
  }
  
  /**
   * Apply anti-AI detection techniques to make the content appear more human-written
   */
  private async applyAntiAIDetection(content: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: `You are an expert in making AI-generated content appear human-written to bypass AI detection tools. Apply the following techniques to the content:
          
          1. Introduce sentence structure variety (mix short and long sentences)
          2. Add occasional incomplete sentences or sentence fragments
          3. Use casual connectors like "well", "actually", "anyway", "you know" occasionally
          4. Vary punctuation patterns and use some unconventional punctuation
          5. Introduce a few subtle typos (about 1-2 per 500 words) like an extra space, a missing article, or a common homophone error
          6. Add some redundancy that humans naturally include
          7. Use idioms and colloquialisms where appropriate
          8. Vary paragraph lengths
          
          Important: Don't overdo any of these techniques. They should be subtle and appear natural. Preserve the original meaning, tone, and key points of the content.` 
        },
        { role: "user", content }
      ],
      temperature: 0.8,
    });
    
    return response.choices[0].message.content || content;
  }
  
  /**
   * Build the system prompt for content generation
   */
  private buildSystemPrompt(tone: string, archetype: string, targetWordCount: number): string {
    return `You are an expert content creator specializing in ${tone} tone for brands that embody the ${archetype} archetype. 
    
    Generate content that:
    1. Maintains a consistent ${tone} tone throughout
    2. Embodies the characteristics of the ${archetype} brand archetype
    3. Has approximately ${targetWordCount} words (this is a target, not a hard requirement)
    4. Is well-structured and engaging
    5. Contains natural language patterns that a human would use
    
    Focus on creating authentic content that genuinely represents the ${archetype} archetype with a ${tone} tone.`;
  }
  
  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
  
  /**
   * Estimate max tokens needed based on target word count
   * Assuming average of 0.75 tokens per word for English
   */
  private estimateMaxTokens(wordCount: number): number {
    return Math.ceil(wordCount * 1.33) + 200; // Add 200 token buffer
  }
}

export const openAIService = new OpenAIService();