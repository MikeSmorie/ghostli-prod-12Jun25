import React from "react";
import { useFeature } from "@/hooks/use-feature-flags";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Lock } from "lucide-react";

interface FeatureGuardProps {
  /**
   * The name of the feature to check access for
   */
  featureName: string;
  /**
   * The content to render if the user has access to the feature
   */
  children: React.ReactNode;
  /**
   * Optional fallback component to render if the user doesn't have access
   */
  fallback?: React.ReactNode;
  /**
   * Whether to show a loading state while checking access
   */
  showLoading?: boolean;
}

/**
 * A component that conditionally renders its children based on feature flag access
 */
export function FeatureGuard({
  featureName,
  children,
  fallback,
  showLoading = true,
}: FeatureGuardProps) {
  const { hasAccess, isLoading } = useFeature(featureName);

  // Show loading state if requested and still checking access
  if (showLoading && isLoading) {
    return <Skeleton className="w-full h-28" />;
  }

  // User has access, render the children
  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access, render the fallback or the default locked content
  return (
    <>
      {fallback || (
        <Card className="p-4 flex flex-col items-center justify-center opacity-80 min-h-28">
          <Lock className="h-8 w-8 mb-2 text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            This feature requires a higher subscription tier
          </p>
        </Card>
      )}
    </>
  );
}

/**
 * A component that shows a dialog for features that require a higher tier
 */
export function FeatureRequiredDialog({
  featureName,
  isOpen,
  onClose,
  tierRequired = "premium",
}: {
  featureName: string;
  isOpen: boolean;
  onClose: () => void;
  tierRequired?: string;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Subscription Required</AlertDialogTitle>
          <AlertDialogDescription>
            The <strong>{featureName}</strong> feature requires a{" "}
            <strong className="capitalize">{tierRequired}</strong> subscription.
            Please upgrade your subscription to access this feature.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}