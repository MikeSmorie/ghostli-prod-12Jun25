import React from 'react';
import { useFeatureFlags, FEATURES } from '@/hooks/use-feature-flags';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * Component for visualizing and managing feature flags
 * This is primarily a development/demo tool
 */
export function FeatureFlagManager() {
  const { hasFeature, isLoading, error, getTier, isPro, featureFlags } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-md">
        <h3 className="font-semibold mb-2">Error loading feature flags</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  // Group features by category based on their prefix
  const featureCategories: Record<string, string[]> = {
    'Content Generation': [
      FEATURES.CONTENT_GENERATION,
      FEATURES.HIGH_WORD_COUNT,
    ],
    'Content Style': [
      FEATURES.STYLE_ADJUSTMENTS,
      FEATURES.GRADE_LEVEL_ADJUSTMENT, 
      FEATURES.CLONE_ME,
    ],
    'AI Detection': [
      FEATURES.HUMANIZATION,
      FEATURES.ADVANCED_HUMANIZATION,
    ],
    'Export': [
      FEATURES.BASIC_EXPORT,
      FEATURES.MULTIPLE_EXPORT_FORMATS,
    ],
    'Content Analysis': [
      FEATURES.PLAGIARISM_DETECTION,
      FEATURES.EAT_COMPLIANCE,
    ],
    'Content Customization': [
      FEATURES.KEYWORD_CONTROL,
      FEATURES.PHRASE_REMOVAL,
      FEATURES.SOURCE_SELECTION,
      FEATURES.REGIONAL_DATA,
    ],
    'Content Management': [
      FEATURES.SAVE_CONTENT,
      FEATURES.CONTENT_HISTORY,
    ],
    'Integration': [
      FEATURES.WEBSITE_SCANNING,
      FEATURES.API_ACCESS,
    ],
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Feature Access</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Current subscription: <Badge variant={isPro() ? "default" : "outline"}>{getTier()}</Badge>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(featureCategories).map(([category, features]) => (
            <div key={category}>
              <h3 className="font-medium mb-3">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature) => (
                  <div 
                    key={feature} 
                    className={`p-3 rounded-md border ${
                      hasFeature(feature) 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-muted/30 border-border/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{formatFeatureName(feature)}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getFeatureDescription(feature)}
                        </p>
                      </div>
                      <Badge variant={hasFeature(feature) ? "default" : "outline"}>
                        {hasFeature(feature) ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {category !== Object.keys(featureCategories).pop() && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format feature name from constants
function formatFeatureName(feature: string): string {
  // Convert snake_case to Title Case
  return feature
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to get feature description
function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    [FEATURES.CONTENT_GENERATION]: "Generate content with AI",
    [FEATURES.HIGH_WORD_COUNT]: "Generate up to 5000 words",
    [FEATURES.STYLE_ADJUSTMENTS]: "Adjust tone and style",
    [FEATURES.GRADE_LEVEL_ADJUSTMENT]: "Set reading complexity",
    [FEATURES.CLONE_ME]: "Replicate your writing style",
    [FEATURES.HUMANIZATION]: "Basic anti-AI detection",
    [FEATURES.ADVANCED_HUMANIZATION]: "Advanced humanization with fine-tuning",
    [FEATURES.BASIC_EXPORT]: "Export as plain text",
    [FEATURES.MULTIPLE_EXPORT_FORMATS]: "Export in multiple formats",
    [FEATURES.PLAGIARISM_DETECTION]: "Check for plagiarism",
    [FEATURES.EAT_COMPLIANCE]: "Expertise, Authority, Trust compliance",
    [FEATURES.KEYWORD_CONTROL]: "Control keyword density",
    [FEATURES.PHRASE_REMOVAL]: "Remove redundant phrases",
    [FEATURES.SOURCE_SELECTION]: "Force specific sources",
    [FEATURES.REGIONAL_DATA]: "Regional data preferences",
    [FEATURES.SAVE_CONTENT]: "Save content for later",
    [FEATURES.CONTENT_HISTORY]: "Access generation history",
    [FEATURES.WEBSITE_SCANNING]: "Extract website content",
    [FEATURES.API_ACCESS]: "Access via API",
  };
  
  return descriptions[feature] || "Feature description not available";
}