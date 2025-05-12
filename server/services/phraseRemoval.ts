/**
 * Phrase Removal System
 * 
 * This utility identifies and replaces redundant phrases like "not just" to make content
 * more direct, concise, and professional.
 */

export interface PhraseRemovalOptions {
  // Whether to apply concise writing style that avoids redundant phrases
  conciseStyle?: boolean;
  // Whether to run additional quality checks to ensure professional, clear content
  qualityCheck?: boolean;
}

// Types of phrases we target for replacement
export const redundantPhraseTypes = {
  NOT_JUST: 'NOT_JUST',
  NOT_ONLY: 'NOT_ONLY',
  NOT_JUST_ABOUT: 'NOT_JUST_ABOUT',
  ITS_NOT_JUST: 'ITS_NOT_JUST',
} as const;

export type RedundantPhraseType = typeof redundantPhraseTypes[keyof typeof redundantPhraseTypes];

// Phrase patterns to detect (using regex)
export const redundantPhrasePatterns: Record<RedundantPhraseType, RegExp> = {
  // "Not just X, but Y" pattern
  'NOT_JUST': /not\s+just\s+([^,\.]+)(?:,|,\s+but|\s+but)\s+([^,\.]+)/gi,
  
  // "Not only is it X, but it's also Y" pattern
  'NOT_ONLY': /not\s+only\s+(?:is\s+it|are\s+they|does\s+it|do\s+they|will\s+it|can\s+it|are|is|does|do|will|can)\s+([^,\.]+)(?:,|,\s+but|\s+but)(?:\s+it\'s|\s+they\'re|\s+it|\s+they)?\s+(?:also\s+)?([^,\.]+)/gi,
  
  // "It's not just about X, it's about Y" pattern
  'NOT_JUST_ABOUT': /(?:it\'s|its|this\s+is)\s+not\s+just\s+about\s+([^,\.]+)(?:,|,\s+it\'s|\s+it\'s)\s+(?:about\s+)?([^,\.]+)/gi,
  
  // "It's not just X, it's Y" pattern
  'ITS_NOT_JUST': /(?:it\'s|its|this\s+is)\s+not\s+just\s+([^,\.]+)(?:,|,\s+it\'s|\s+it\'s)\s+([^,\.]+)/gi,
};

/**
 * Helper function to replace "not just" type phrases with more direct language
 */
export function replaceRedundantPhrase(text: string, phraseType: RedundantPhraseType): string {
  const pattern = redundantPhrasePatterns[phraseType];
  
  return text.replace(pattern, (match, group1, group2) => {
    switch (phraseType) {
      case 'NOT_JUST':
        return `${group1} and ${group2}`;
      
      case 'NOT_ONLY':
        return `${group1} and ${group2}`;
      
      case 'NOT_JUST_ABOUT':
        return `${group1} and ${group2} both matter`;
      
      case 'ITS_NOT_JUST':
        return `It is ${group1} and ${group2}`;
      
      default:
        return match; // If no replacement rule, return the original text
    }
  });
}

/**
 * Find all instances of redundant phrases in the content
 */
export function findRedundantPhrases(content: string): { phraseType: RedundantPhraseType, match: string }[] {
  const results: { phraseType: RedundantPhraseType, match: string }[] = [];
  
  // Check each pattern
  Object.entries(redundantPhrasePatterns).forEach(([type, pattern]) => {
    const phraseType = type as RedundantPhraseType;
    const matches = content.match(pattern);
    
    if (matches) {
      matches.forEach(match => {
        results.push({ phraseType, match });
      });
    }
  });
  
  return results;
}

/**
 * Processes content to remove redundant "not just" type phrases
 * @param content The content to process
 * @param options Configuration options for phrase removal
 * @returns The processed content with redundant phrases replaced
 */
export function removeRedundantPhrases(content: string, options: PhraseRemovalOptions = {}): {
  processedContent: string;
  removedPhrases: { phraseType: RedundantPhraseType, match: string }[];
} {
  // Skip processing if conciseStyle is false
  if (options.conciseStyle === false) {
    return { processedContent: content, removedPhrases: [] };
  }
  
  // Find all redundant phrases before making any changes
  const redundantPhrases = findRedundantPhrases(content);
  
  // Process the content with each replacement pattern
  let processedContent = content;
  
  // Apply replacements
  (['NOT_JUST', 'NOT_ONLY', 'NOT_JUST_ABOUT', 'ITS_NOT_JUST'] as const).forEach(phraseType => {
    processedContent = replaceRedundantPhrase(processedContent, phraseType);
  });
  
  // Optional quality check - apply additional transformations
  if (options.qualityCheck) {
    // Additional transformations for clarity and professionalism could be added here
    // This is a placeholder for future expansion
  }
  
  return {
    processedContent,
    removedPhrases: redundantPhrases
  };
}