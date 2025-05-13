import OpenAI from "openai";

// Initialize OpenAI (using same API key as content generation)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define interface for plagiarism check result
export interface PlagiarismCheckResult {
  isPlagiarized: boolean;
  score: number; // 0-100 where 0 is completely original and 100 is completely plagiarized
  matchedSources: MatchedSource[];
  originalContent: string;
  checkedTimestamp: Date;
}

// Interface for matched source information
export interface MatchedSource {
  source: string | null;
  url: string | null;
  matchedText: string;
  matchPercentage: number; // 0-100
  startPosition: number;
  endPosition: number;
  suggestedCitation?: string;
  suggestedRephrase?: string;
}

/**
 * Checks content for plagiarism using AI analysis
 * @param content The content to check for plagiarism
 * @returns Promise resolving to plagiarism check result
 */
export async function checkPlagiarism(textContent: string): Promise<PlagiarismCheckResult> {
  try {
    // Use OpenAI to analyze the content for potential plagiarism
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a sophisticated plagiarism detection system. Your task is to:
          1. Identify any passages that appear to be directly copied from common sources
          2. For each potentially plagiarized section, provide a confidence percentage
          3. Generate a suggested citation and a suggested rephrasing
          4. Return a final originality score (0-100 where 100 means completely original)
          
          Format your response as detailed JSON according to this schema:
          {
            "originalityScore": number, // 0-100
            "isPlagiarized": boolean, // true if any section has > 70% match confidence
            "matchedSources": [
              {
                "matchedText": "exact text portion that appears plagiarized",
                "matchPercentage": number, // 0-100 confidence this is plagiarized
                "source": "potential source name if identifiable or null",
                "url": "URL of likely source if identifiable or null", 
                "startPosition": number, // approximate character position in original text
                "endPosition": number, // approximate character position in original text
                "suggestedCitation": "proper academic citation",
                "suggestedRephrase": "suggested original rewording"
              }
            ]
          }`
        },
        {
          role: "user",
          content: `Please analyze this content for potential plagiarism:\n\n${textContent}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Lower temperature for more deterministic results
    });

    // Parse the response
    const responseContent = response.choices[0].message.content;
    const analysis = responseContent ? JSON.parse(responseContent) : { isPlagiarized: false, originalityScore: 100, matchedSources: [] };
    
    // Construct the result
    const result: PlagiarismCheckResult = {
      isPlagiarized: analysis.isPlagiarized || false,
      score: 100 - (analysis.originalityScore || 0), // Invert so higher means more plagiarized
      matchedSources: analysis.matchedSources || [],
      originalContent: textContent,
      checkedTimestamp: new Date()
    };

    return result;
  } catch (error) {
    console.error("Error checking plagiarism:", error);
    // Return safe defaults in case of error
    return {
      isPlagiarized: false,
      score: 0,
      matchedSources: [],
      originalContent: content,
      checkedTimestamp: new Date()
    };
  }
}

/**
 * Rephrases potentially plagiarized content to make it original
 * @param content Original content
 * @param matchedSource Information about the matched source
 * @returns Promise resolving to rephrased content
 */
export async function rephraseContent(content: string, matchedSource: MatchedSource): Promise<string> {
  try {
    // Extract the problematic portion
    const beforeMatch = content.substring(0, matchedSource.startPosition);
    const matchedPortion = content.substring(matchedSource.startPosition, matchedSource.endPosition);
    const afterMatch = content.substring(matchedSource.endPosition);
    
    // If we already have a suggested rephrase, use it
    if (matchedSource.suggestedRephrase && matchedSource.suggestedRephrase.length > 0) {
      return beforeMatch + matchedSource.suggestedRephrase + afterMatch;
    }
    
    // Otherwise, generate a new rephrase
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are helping to rewrite a potentially plagiarized passage to make it original while preserving the meaning. 
          Rewrite completely using different sentence structure, vocabulary, and phrasing.
          Only output the rewritten text with no explanations or additional content.`
        },
        {
          role: "user",
          content: `Rewrite this passage in a completely original way:\n\n${matchedPortion}`
        }
      ],
      temperature: 0.7, // Higher temperature for more creativity
    });
    
    const rephrased = response.choices[0].message.content?.toString() || matchedPortion;
    
    // Return the content with the rephrased section
    return beforeMatch + rephrased + afterMatch;
  } catch (error) {
    console.error("Error rephrasing content:", error);
    return content; // Return original content if rephrasing fails
  }
}

/**
 * Adds proper citations to potentially plagiarized content
 * @param content Original content
 * @param matchedSources Information about the matched sources
 * @returns Promise resolving to content with citations
 */
export async function addCitations(content: string, matchedSources: MatchedSource[]): Promise<string> {
  try {
    // Sort sources by end position in descending order to avoid position shifts
    const sortedSources = [...matchedSources].sort((a, b) => b.endPosition - a.endPosition);
    
    let contentWithCitations = content;
    
    for (const source of sortedSources) {
      // Skip if there's no source information
      if (!source.source) continue;
      
      // Extract the citation if we have it
      const sourceText = source.source || "Unknown Source";
      const citation = source.suggestedCitation || `(${sourceText}${source.url ? `, ${source.url}` : ''})`;
      
      // Insert citation at the end of the matched portion
      contentWithCitations = 
        contentWithCitations.substring(0, source.endPosition) + 
        ` ${citation} ` + 
        contentWithCitations.substring(source.endPosition);
    }
    
    return contentWithCitations;
  } catch (error) {
    console.error("Error adding citations:", error);
    return content; // Return original content if citation process fails
  }
}