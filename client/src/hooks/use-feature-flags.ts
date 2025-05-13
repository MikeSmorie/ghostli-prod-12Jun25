import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useState, useEffect } from "react";

// Feature constants - these should match keys on the server
export const FEATURES = {
  // Content Generation
  CONTENT_GENERATION_BASIC: "CONTENT_GENERATION_BASIC",
  CONTENT_GENERATION_PREMIUM: "CONTENT_GENERATION_PREMIUM",
  
  // Interface
  WRITING_BRIEF_LITE: "WRITING_BRIEF_LITE",
  WRITING_BRIEF_PRO: "WRITING_BRIEF_PRO",
  
  // Personalization
  CLONE_ME: "CLONE_ME",
  HUMANIZATION_SETTINGS: "HUMANIZATION_SETTINGS",
  VOCABULARY_CONTROL: "VOCABULARY_CONTROL",
  
  // Quality & Optimization
  PLAGIARISM_DETECTION: "PLAGIARISM_DETECTION",
  SEO_OPTIMIZATION: "SEO_OPTIMIZATION",
  
  // Export
  EXPORT_BASIC: "EXPORT_BASIC",
  MULTIPLE_EXPORT_FORMATS: "MULTIPLE_EXPORT_FORMATS",
};

// Map for tier levels
export const TIER_LEVELS = {
  FREE: "free",
  BASIC: "basic", 
  PREMIUM: "premium",
  ENTERPRISE: "enterprise"
};

// Define the shape of feature flag data from the API
interface FeatureFlagResponse {
  features: Record<string, boolean>;
  tier: string;
}

/**
 * Hook for accessing the user's feature flags and subscription tier
 */
export function useFeatureFlags() {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [tier, setTier] = useState<string>(TIER_LEVELS.FREE);

  // Fetch feature flags from the API
  const { data, isLoading, error, isError } = useQuery<FeatureFlagResponse>({
    queryKey: ["/api/subscription/features"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/subscription/features");
        if (!response.ok) {
          throw new Error("Failed to fetch feature flags");
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching feature flags:", error);
        // Return default values on error
        return {
          features: getDefaultFeatures(),
          tier: TIER_LEVELS.FREE
        };
      }
    },
    // Only refetch on mount or when explicitly invalidated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setFeatures(data.features);
      setTier(data.tier);
    }
  }, [data]);

  // Check if the user has access to a specific feature
  const hasFeature = (featureName: string): boolean => {
    return features[featureName] === true;
  };

  // Check if the user is a Pro subscriber
  const isProUser = (): boolean => {
    return tier !== TIER_LEVELS.FREE;
  };

  // Get the user's subscription tier
  const getUserTier = (): string => {
    return tier;
  };

  // Default features (free tier) - fallback if API call fails
  const getDefaultFeatures = (): Record<string, boolean> => {
    return {
      [FEATURES.CONTENT_GENERATION_BASIC]: true,
      [FEATURES.WRITING_BRIEF_LITE]: true,
      [FEATURES.EXPORT_BASIC]: true,
      
      // Premium features are disabled by default
      [FEATURES.CONTENT_GENERATION_PREMIUM]: false,
      [FEATURES.WRITING_BRIEF_PRO]: false,
      [FEATURES.CLONE_ME]: false,
      [FEATURES.HUMANIZATION_SETTINGS]: false,
      [FEATURES.VOCABULARY_CONTROL]: false,
      [FEATURES.PLAGIARISM_DETECTION]: false,
      [FEATURES.SEO_OPTIMIZATION]: false,
      [FEATURES.MULTIPLE_EXPORT_FORMATS]: false,
    };
  };

  return {
    features,
    tier,
    isLoading,
    error,
    isError,
    hasFeature,
    isProUser,
    getUserTier,
  };
}