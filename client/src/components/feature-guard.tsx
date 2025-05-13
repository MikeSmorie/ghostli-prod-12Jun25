import { ReactNode } from "react";
import { useFeatureFlags } from "../hooks/use-feature-flags";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FeatureGuardProps {
  /** The name of the feature to check access for */
  featureName: string;
  /** Content to render if the user has access to the feature */
  children: ReactNode;
  /** Alternative content to render if the user doesn't have access (optional) */
  fallback?: ReactNode;
  /** Whether to show an upgrade dialog (default: true) */
  showUpgradeDialog?: boolean;
}

/**
 * A component that conditionally renders its children based on whether
 * the current user has access to a specific feature.
 */
export function FeatureGuard({
  featureName,
  children,
  fallback,
  showUpgradeDialog = true,
}: FeatureGuardProps) {
  const { hasFeature, isLoading } = useFeatureFlags();
  
  // Wait for features to load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has access to the feature, render the children
  if (hasFeature(featureName)) {
    return <>{children}</>;
  }

  // If no fallback is provided and we don't want to show upgrade dialog, render nothing
  if (!fallback && !showUpgradeDialog) {
    return null;
  }

  // If a fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Otherwise show the upgrade dialog
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default">Access this feature</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pro Feature Required</AlertDialogTitle>
          <AlertDialogDescription>
            This feature requires a Pro subscription. Upgrade now to unlock
            advanced content generation features, including premium humanization,
            Clone Me, and more.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href="/subscription">
              <Button>View Plans</Button>
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}