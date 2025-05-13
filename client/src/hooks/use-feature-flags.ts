import { useQuery } from "@tanstack/react-query";
import { useUser } from "./use-user";
import { getQueryFn } from "@/lib/queryClient";

/**
 * A hook that provides access to feature flags based on the user's subscription
 */
export function useFeatureFlags() {
  const { user, isLoading: isUserLoading } = useUser();
  
  const {
    data: featureFlags,
    isLoading: isFlagsLoading,
    error,
  } = useQuery({
    queryKey: ["/api/subscription/features"],
    queryFn: getQueryFn(),
    // Don't fetch feature flags if user isn't logged in
    enabled: !!user,
  });

  const isLoading = isUserLoading || isFlagsLoading;

  /**
   * Check if a feature is enabled for the current user
   */
  const hasFeature = (featureName: string): boolean => {
    if (isLoading || !featureFlags) return false;
    return featureFlags.features?.[featureName] === true;
  };

  /**
   * Check if the user has a pro subscription
   */
  const isPro = (): boolean => {
    if (isLoading || !featureFlags) return false;
    return featureFlags.isPro === true;
  };

  /**
   * Get user's current subscription tier
   */
  const getTier = (): string => {
    if (isLoading || !featureFlags) return "none";
    return featureFlags.tier || "none";
  };

  /**
   * Check if the subscription is active
   */
  const isActive = (): boolean => {
    if (isLoading || !featureFlags) return false;
    return featureFlags.isActive === true;
  };

  return {
    isLoading,
    error,
    hasFeature,
    isPro,
    getTier,
    isActive,
    // Expose all raw feature flags for debugging
    featureFlags,
  };
}

// Define feature flag constants for use throughout the application
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
} as const;

// Make TypeScript type from const above
export type FeatureFlag = keyof typeof FEATURES;