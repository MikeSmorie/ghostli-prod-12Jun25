import { useFeatureFlags, FEATURES } from "../hooks/use-feature-flags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Lock, Unlock, ExternalLink } from "lucide-react";

export function FeatureFlagManager() {
  const { features, getUserTier, isProUser, isLoading } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  const tier = getUserTier();
  const isPro = isProUser();

  // Group features by category
  const featuresByCategory: Record<string, { name: string; enabled: boolean }[]> = {
    "Content Generation": [
      { name: FEATURES.CONTENT_GENERATION_BASIC, enabled: features[FEATURES.CONTENT_GENERATION_BASIC] || false },
      { name: FEATURES.CONTENT_GENERATION_PREMIUM, enabled: features[FEATURES.CONTENT_GENERATION_PREMIUM] || false },
    ],
    "Interface": [
      { name: FEATURES.WRITING_BRIEF_LITE, enabled: features[FEATURES.WRITING_BRIEF_LITE] || false },
      { name: FEATURES.WRITING_BRIEF_PRO, enabled: features[FEATURES.WRITING_BRIEF_PRO] || false },
    ],
    "Personalization": [
      { name: FEATURES.CLONE_ME, enabled: features[FEATURES.CLONE_ME] || false },
      { name: FEATURES.HUMANIZATION_SETTINGS, enabled: features[FEATURES.HUMANIZATION_SETTINGS] || false },
      { name: FEATURES.VOCABULARY_CONTROL, enabled: features[FEATURES.VOCABULARY_CONTROL] || false },
    ],
    "Quality & Optimization": [
      { name: FEATURES.PLAGIARISM_DETECTION, enabled: features[FEATURES.PLAGIARISM_DETECTION] || false },
      { name: FEATURES.SEO_OPTIMIZATION, enabled: features[FEATURES.SEO_OPTIMIZATION] || false },
    ],
    "Export": [
      { name: FEATURES.EXPORT_BASIC, enabled: features[FEATURES.EXPORT_BASIC] || false },
      { name: FEATURES.MULTIPLE_EXPORT_FORMATS, enabled: features[FEATURES.MULTIPLE_EXPORT_FORMATS] || false },
    ],
  };

  // Function to format feature name for display
  const formatFeatureName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Feature Access</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current Tier:</span>
          {isPro ? (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700">
              <Crown className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700">
              <Sparkles className="h-3 w-3 mr-1" />
              Lite
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
            <div key={category}>
              <h3 className="font-medium text-lg mb-3">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryFeatures.map((feature) => (
                  <div
                    key={feature.name}
                    className={`p-3 rounded-md border ${
                      feature.enabled
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center">
                      {feature.enabled ? (
                        <Unlock className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2 text-gray-400" />
                      )}
                      <span className="text-sm font-medium">
                        {formatFeatureName(feature.name)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!isPro && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Unlock All Features</h3>
                <p className="text-muted-foreground mb-4">
                  Upgrade to Pro to access premium features and enhance your content generation experience.
                </p>
                <Link href="/subscription">
                  <Button className="gap-2">
                    <Crown className="h-4 w-4" />
                    View Pro Plans
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}