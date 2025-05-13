/**
 * Service defining subscription tiers and feature flags
 * This file contains the definitions of all features and which tiers have access to them
 */

/**
 * All feature flags in the system
 */
export const FEATURES = {
  // Content Generation
  CONTENT_GENERATION: "content_generation",
  HIGH_WORD_COUNT: "high_word_count",
  
  // Content Style & Format
  STYLE_ADJUSTMENTS: "style_adjustments",
  GRADE_LEVEL_ADJUSTMENT: "grade_level_adjustment",
  CLONE_ME: "clone_me",
  
  // AI Detection Prevention
  HUMANIZATION: "humanization",
  ADVANCED_HUMANIZATION: "advanced_humanization",
  
  // Export Options
  BASIC_EXPORT: "basic_export", 
  MULTIPLE_EXPORT_FORMATS: "multiple_export_formats",
  
  // Content Analysis
  PLAGIARISM_DETECTION: "plagiarism_detection", 
  EAT_COMPLIANCE: "eat_compliance",
  
  // Content Customization
  KEYWORD_CONTROL: "keyword_control",
  PHRASE_REMOVAL: "phrase_removal",
  SOURCE_SELECTION: "source_selection",
  REGIONAL_DATA: "regional_data",
  
  // Content Management
  SAVE_CONTENT: "save_content", 
  CONTENT_HISTORY: "content_history",
  
  // Integration
  WEBSITE_SCANNING: "website_scanning",
  API_ACCESS: "api_access"
};

/**
 * Descriptions for all features
 */
export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  [FEATURES.CONTENT_GENERATION]: "Generate high-quality content with AI",
  [FEATURES.HIGH_WORD_COUNT]: "Generate content up to 5000 words",
  [FEATURES.STYLE_ADJUSTMENTS]: "Adjust tone, voice, and style of generated content",
  [FEATURES.GRADE_LEVEL_ADJUSTMENT]: "Adjust reading complexity of generated content",
  [FEATURES.CLONE_ME]: "Analyze and replicate your writing style",
  [FEATURES.HUMANIZATION]: "Basic AI detection prevention",
  [FEATURES.ADVANCED_HUMANIZATION]: "Advanced AI detection prevention with fine-tuning",
  [FEATURES.BASIC_EXPORT]: "Export content as plain text",
  [FEATURES.MULTIPLE_EXPORT_FORMATS]: "Export as PDF, Word, HTML, and more",
  [FEATURES.PLAGIARISM_DETECTION]: "Check content against online sources for originality",
  [FEATURES.EAT_COMPLIANCE]: "Ensure content meets Expertise, Authoritativeness, Trustworthiness standards",
  [FEATURES.KEYWORD_CONTROL]: "Control keyword frequency and implementation",
  [FEATURES.PHRASE_REMOVAL]: "Remove redundant phrases automatically",
  [FEATURES.SOURCE_SELECTION]: "Force content to use specific sources",
  [FEATURES.REGIONAL_DATA]: "Set regional statistical data preferences",
  [FEATURES.SAVE_CONTENT]: "Save content for future reference",
  [FEATURES.CONTENT_HISTORY]: "Access history of all generated content",
  [FEATURES.WEBSITE_SCANNING]: "Extract content from websites for analysis",
  [FEATURES.API_ACCESS]: "API access for content generation"
};

/**
 * Define subscription tiers with pricing and features
 */
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: "Lite",
    description: "Free basic content generation",
    tierLevel: "free",
    monthlyPrice: 0,
    yearlyPrice: 0
  },
  PRO: {
    name: "Pro",
    description: "Professional content generation with advanced features",
    tierLevel: "premium",
    monthlyPrice: 19.99,
    yearlyPrice: 199.99
  }
};

/**
 * Get all features with access level for a specific tier
 */
export function getFeaturesForTier(tierLevel: string): Record<string, boolean> {
  switch (tierLevel) {
    case "free": 
      return {
        // Content Generation - Limited
        [FEATURES.CONTENT_GENERATION]: true,
        [FEATURES.HIGH_WORD_COUNT]: false, // Limited to 1000 words
        
        // Content Style & Format - Basic Only
        [FEATURES.STYLE_ADJUSTMENTS]: true,
        [FEATURES.GRADE_LEVEL_ADJUSTMENT]: false,
        [FEATURES.CLONE_ME]: false,
        
        // AI Detection Prevention - Basic Only
        [FEATURES.HUMANIZATION]: true, 
        [FEATURES.ADVANCED_HUMANIZATION]: false,
        
        // Export Options - Basic Only
        [FEATURES.BASIC_EXPORT]: true,
        [FEATURES.MULTIPLE_EXPORT_FORMATS]: false,
        
        // Content Analysis - None
        [FEATURES.PLAGIARISM_DETECTION]: false,
        [FEATURES.EAT_COMPLIANCE]: false,
        
        // Content Customization - Limited
        [FEATURES.KEYWORD_CONTROL]: true,
        [FEATURES.PHRASE_REMOVAL]: false,
        [FEATURES.SOURCE_SELECTION]: false,
        [FEATURES.REGIONAL_DATA]: false,
        
        // Content Management - Basic Only
        [FEATURES.SAVE_CONTENT]: true,
        [FEATURES.CONTENT_HISTORY]: false,
        
        // Integration - None
        [FEATURES.WEBSITE_SCANNING]: false,
        [FEATURES.API_ACCESS]: false
      };
    
    case "premium":
      return {
        // Content Generation - Full
        [FEATURES.CONTENT_GENERATION]: true,
        [FEATURES.HIGH_WORD_COUNT]: true, // Up to 5000 words
        
        // Content Style & Format - Full
        [FEATURES.STYLE_ADJUSTMENTS]: true,
        [FEATURES.GRADE_LEVEL_ADJUSTMENT]: true,
        [FEATURES.CLONE_ME]: true,
        
        // AI Detection Prevention - Full
        [FEATURES.HUMANIZATION]: true,
        [FEATURES.ADVANCED_HUMANIZATION]: true,
        
        // Export Options - Full
        [FEATURES.BASIC_EXPORT]: true,
        [FEATURES.MULTIPLE_EXPORT_FORMATS]: true,
        
        // Content Analysis - Full
        [FEATURES.PLAGIARISM_DETECTION]: true,
        [FEATURES.EAT_COMPLIANCE]: true,
        
        // Content Customization - Full
        [FEATURES.KEYWORD_CONTROL]: true,
        [FEATURES.PHRASE_REMOVAL]: true,
        [FEATURES.SOURCE_SELECTION]: true,
        [FEATURES.REGIONAL_DATA]: true,
        
        // Content Management - Full
        [FEATURES.SAVE_CONTENT]: true,
        [FEATURES.CONTENT_HISTORY]: true,
        
        // Integration - Full
        [FEATURES.WEBSITE_SCANNING]: true,
        [FEATURES.API_ACCESS]: true
      };
    
    default:
      // If the tier doesn't exist, return free tier features
      return getFeaturesForTier("free");
  }
}

/**
 * Get all feature definitions to use in setting up the database
 */
export function getAllFeatureDefinitions() {
  return Object.entries(FEATURES).map(([key, name]) => ({
    name,
    description: FEATURE_DESCRIPTIONS[name]
  }));
}