import { useEffect, useState } from "react";
import { useUser } from "./use-user";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

// Define the available feature flags
export const FEATURES = {
  // Basic features (available to Lite/Free users)
  CONTENT_GENERATION_BASIC: "content_generation_basic",
  WRITING_BRIEF_LITE: "writing_brief_lite",
  EXPORT_BASIC: "export_basic",
  
  // Pro features
  CONTENT_GENERATION_PREMIUM: "content_generation_premium",
  WRITING_BRIEF_PRO: "writing_brief_pro",
  CLONE_ME: "clone_me",
  HUMANIZATION_SETTINGS: "humanization_settings",
  VOCABULARY_CONTROL: "vocabulary_control",
  PLAGIARISM_DETECTION: "plagiarism_detection",
  SEO_OPTIMIZATION: "seo_optimization",
  MULTIPLE_EXPORT_FORMATS: "multiple_export_formats"
};

// Define tier constants
export const TIER_LITE = "free";
export const TIER_PRO = "premium";

interface FeatureFlag {
  name: string;
  enabled: boolean;
}

export interface SubscriptionInfo {
  tier: string;
  features: Record<string, boolean>;
  isPro: boolean;
  isActive: boolean;
}

export function useFeatureFlags() {
  const { user } = useUser();
  const [userFeatures, setUserFeatures] = useState<Record<string, boolean>>({});
  
  const { data: subscriptionInfo, isLoading } = useQuery({
    queryKey: ["/api/subscription/features"],
    queryFn: async () => {
      if (!user) return {
        tier: TIER_LITE,
        features: {},
        isPro: false,
        isActive: false
      };
      
      const res = await apiRequest("GET", "/api/subscription/features");
      return await res.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  }
  );
  
  useEffect(() => {
    if (subscriptionInfo) {
      setUserFeatures(subscriptionInfo.features);
    }
  }, [subscriptionInfo]);
  
  const hasFeature = (featureName: string): boolean => {
    // If still loading, default to not having access
    if (isLoading) {
      return false;
    }
    
    // If no subscription info yet, check if it's a free feature
    if (!subscriptionInfo) {
      return [
        FEATURES.CONTENT_GENERATION_BASIC,
        FEATURES.WRITING_BRIEF_LITE,
        FEATURES.EXPORT_BASIC
      ].includes(featureName);
    }
    
    // Return the feature access from the subscription info
    return subscriptionInfo.features[featureName] || false;
  };
  
  const getUserTier = (): string => {
    return subscriptionInfo?.tier || TIER_LITE;
  };
  
  const isProUser = (): boolean => {
    return subscriptionInfo?.isPro || false;
  };
  
  const hasActiveSubscription = (): boolean => {
    return subscriptionInfo?.isActive || false;
  };
  
  return {
    hasFeature,
    getUserTier,
    isProUser,
    hasActiveSubscription,
    isLoading,
    features: userFeatures,
  };
}