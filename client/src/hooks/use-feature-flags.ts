import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface FeatureFlag {
  featureName: string;
  isEnabled: boolean;
  tierLevel: string;
  description: string | null;
  userHasAccess: boolean;
}

/**
 * Hook for accessing and manipulating feature flags
 */
export function useFeatureFlags() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all feature flags for current user
  const {
    data: features,
    isLoading,
    error
  } = useQuery<FeatureFlag[]>({
    queryKey: ["/api/features"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/features");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch feature flags");
      }
      return res.json();
    },
    // Don't show errors for unauthorized users
    onError: (error: Error) => {
      if (!error.message.includes("Authentication required")) {
        toast({
          title: "Error",
          description: `Failed to load features: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  });

  // Check if a specific feature is enabled for the current user
  const checkFeature = async (featureName: string): Promise<boolean> => {
    try {
      const res = await apiRequest("GET", `/api/features/${featureName}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to check feature access");
      }
      const data = await res.json();
      return data.hasAccess;
    } catch (error: any) {
      console.error(`Error checking feature ${featureName}:`, error);
      return false;
    }
  };

  // Update a feature flag (admin only)
  const updateFeatureMutation = useMutation({
    mutationFn: async (featureFlag: Partial<FeatureFlag> & { featureName: string }) => {
      const res = await apiRequest("POST", "/api/admin/features", featureFlag);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update feature flag");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Feature flag updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update feature flag: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete a feature flag (admin only)
  const deleteFeatureMutation = useMutation({
    mutationFn: async (featureName: string) => {
      const res = await apiRequest("DELETE", `/api/admin/features/${featureName}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete feature flag");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Feature flag deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete feature flag: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return {
    features,
    isLoading,
    error,
    checkFeature,
    updateFeature: updateFeatureMutation.mutate,
    deleteFeature: deleteFeatureMutation.mutate,
    isUpdating: updateFeatureMutation.isPending,
    isDeleting: deleteFeatureMutation.isPending,
  };
}

/**
 * Hook to check if a specific feature is available to the current user
 * @param featureName - The name of the feature to check
 * @returns An object with the feature access status
 */
export function useFeature(featureName: string) {
  const { features, isLoading, error, checkFeature } = useFeatureFlags();
  
  // Find the feature in the cached features list
  const feature = features?.find(f => f.featureName === featureName);
  
  // If the feature is in the cache, use its access status
  const hasAccess = feature?.userHasAccess ?? false;
  
  return {
    hasAccess,
    isLoading,
    error,
    // Allow direct check against backend if needed
    checkFeature: () => checkFeature(featureName)
  };
}