import React from "react";
import { useFeatureFlags, type FeatureFlag } from "@/hooks/use-feature-flags";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

interface FeatureGuardProps {
  /** Feature flag that should be required */
  feature: string | FeatureFlag;
  /** Content to display when feature access is granted */
  children: React.ReactNode;
  /** Optional fallback content when feature is not available */
  fallback?: React.ReactNode;
  /** If set to true, will render nothing when feature is disabled (instead of fallback) */
  hideIfDisabled?: boolean;
  /** If set to true, will render a loading indicator instead of nothing when checking feature access */
  showLoading?: boolean;
  /** If true, shows a clear upgrade message for features only available in Pro tier */
  showUpgradeInfo?: boolean;
}

/**
 * Component that conditionally renders its children based on feature access.
 * Can optionally display a fallback UI when the feature is not available.
 */
export function FeatureGuard({
  feature,
  children,
  fallback,
  hideIfDisabled = false,
  showLoading = false,
  showUpgradeInfo = false,
}: FeatureGuardProps) {
  const { hasFeature, isLoading, isPro, getTier } = useFeatureFlags();
  
  // Show loading state if still checking feature access
  if (isLoading && showLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  // If user has access to the feature, render the children
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // If hideIfDisabled is true, render nothing
  if (hideIfDisabled) {
    return null;
  }

  // If fallback is provided, render that
  if (fallback) {
    return <>{fallback}</>;
  }

  // Otherwise show a default message about feature restriction
  if (showUpgradeInfo) {
    const tier = getTier();
    const isFreeTier = tier === "free" || tier === "none";
    
    return (
      <div className="rounded-md border p-4 bg-muted/30">
        <div className="flex flex-col gap-3">
          <h3 className="text-md font-semibold">
            Pro Feature Required
          </h3>
          <p className="text-sm text-muted-foreground">
            {isFreeTier 
              ? "This feature is only available with a Pro subscription."
              : "Your current subscription plan doesn't include this feature."}
          </p>
          <div className="flex mt-2">
            <Link href="/subscription">
              <Button variant="default" size="sm">
                {isFreeTier ? "Upgrade to Pro" : "View Plans"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default minimal fallback
  return (
    <div className="text-sm text-muted-foreground py-2">
      This feature is not available in your current plan.
    </div>
  );
}