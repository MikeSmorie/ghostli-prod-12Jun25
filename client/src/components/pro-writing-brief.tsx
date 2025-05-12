import React, { useState } from "react";
import { WritingBrief, WritingBriefForm } from "./writing-brief-form";
import { FeatureGuard } from "@/components/feature-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProWritingBriefProps {
  onSubmit: (params: any) => void;
  isSubmitting: boolean;
}

export function ProWritingBrief({ onSubmit, isSubmitting }: ProWritingBriefProps) {
  const { toast } = useToast();
  
  const handleBriefSubmit = (brief: WritingBrief) => {
    // Transform the brief into the format expected by the content generator
    const transformedParams = {
      prompt: generatePromptFromBrief(brief),
      tone: brief.tone,
      wordCount: brief.wordCount,
      antiAIDetection: true, // Assuming this is a default
      
      // Add keywords as required keywords with frequencies
      requiredKeywords: [
        ...brief.primaryKeywords.map(keyword => ({ 
          keyword, 
          occurrences: Math.max(1, Math.floor(brief.wordCount / 300)) // Rough estimate based on word count
        })),
        ...brief.secondaryKeywords.map(keyword => ({ 
          keyword, 
          occurrences: 1 // Secondary keywords just need to appear
        }))
      ],
      
      // Add sources if any
      requiredSources: brief.sources.length > 0 ? brief.sources.map((source, index) => ({
        source: source.description || `Source ${index + 1}`,
        url: source.url,
        priority: index + 1
      })) : undefined,
      
      // Citation handling
      includeCitations: brief.includeCitations,
      
      // Other related settings that we can infer from the brief
      strictToneAdherence: true, // Professional content should strictly adhere to tone
      addRhetoricalElements: brief.writingStyle.toLowerCase() === 'persuasive',
      simplifyLanguage: brief.writingStyle.toLowerCase() === 'educational',
      
      // We could map writing style to brand archetype, but for simplicity:
      brandArchetype: mapStyleToArchetype(brief.writingStyle),
    };
    
    // Pass the transformed params to the parent component
    onSubmit(transformedParams);
  };
  
  // Helper function to generate a prompt from the brief
  const generatePromptFromBrief = (brief: WritingBrief): string => {
    const contentType = brief.contentType ? `${brief.contentType}` : "content";
    const audience = brief.targetAudience ? `for ${brief.targetAudience}` : "";
    
    let prompt = `Create a ${contentType} ${audience} with the following structure:\n\n`;
    
    // Add sections
    if (brief.sections.length > 0) {
      prompt += "Sections to include:\n";
      brief.sections.forEach((section, index) => {
        prompt += `${index + 1}. ${section}\n`;
      });
      prompt += "\n";
    }
    
    // Add formatting requirements
    if (brief.formatRequirements.length > 0) {
      prompt += "Please include the following formatting elements:\n";
      brief.formatRequirements.forEach(format => {
        prompt += `- ${format}\n`;
      });
      prompt += "\n";
    }
    
    // Add revision instructions if provided
    if (brief.revisionInstructions) {
      prompt += `Additional instructions: ${brief.revisionInstructions}\n\n`;
    }
    
    return prompt;
  };
  
  // Helper function to map writing style to brand archetype
  const mapStyleToArchetype = (style: string): string => {
    const styleToArchetypeMap: Record<string, string> = {
      informative: "sage",
      conversational: "everyman",
      narrative: "storyteller",
      technical: "sage",
      academic: "sage",
      promotional: "hero",
      analytical: "sage",
      descriptive: "creator",
      journalistic: "explorer",
      educational: "sage",
      persuasive: "magician",
      tutorial: "caregiver"
    };
    
    return styleToArchetypeMap[style.toLowerCase()] || "sage";
  };

  return (
    <FeatureGuard 
      featureName="proWritingBrief"
      fallback={
        <Card className="mb-6">
          <CardHeader className="bg-gray-100 dark:bg-gray-800">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              <CardTitle className="text-xl">Professional Writing Brief</CardTitle>
            </div>
            <CardDescription>
              Step-by-step content planning for professional results
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Premium Feature</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The structured writing brief is available for Premium users. 
                  Upgrade your plan to access step-by-step content planning for better results.
                </p>
              </div>
              <Button 
                variant="default" 
                onClick={() => toast({
                  title: "Premium Feature",
                  description: "Please upgrade your subscription to access this feature.",
                  variant: "default",
                })}
              >
                Upgrade to Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    >
      <WritingBriefForm 
        onSubmit={handleBriefSubmit} 
        isSubmitting={isSubmitting} 
      />
    </FeatureGuard>
  );
}