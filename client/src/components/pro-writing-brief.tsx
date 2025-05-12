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
    // Handle undefined revisionRounds (for backward compatibility)
    const revisionRounds = brief.revisionRounds || 1;
    
    // Transform the brief into the format expected by the content generator
    const transformedParams = {
      prompt: generatePromptFromBrief(brief),
      tone: brief.tone,
      wordCount: brief.wordCount,
      antiAIDetection: true, // Assuming this is a default
      
      // Add keywords as required keywords with frequencies
      requiredKeywords: [
        ...brief.primaryKeywords.map(keyword => {
          // Use the keyword frequency setting if available
          let occurrences = 3; // Default to low (3-5 times)
          if (brief.keywordFrequency) {
            switch(brief.keywordFrequency) {
              case 'low': occurrences = 3; break; // 3-5 times
              case 'medium': occurrences = 6; break; // 6-10 times
              case 'high': occurrences = 11; break; // 11-15 times
              default: occurrences = 3; // Default to low if unrecognized
            }
          }
          return { keyword, occurrences };
        }),
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
      
      // Revision information
      revisionRounds: revisionRounds,
      revisionInstructions: brief.revisionInstructions,
      
      // Other related settings that we can infer from the brief
      strictToneAdherence: true, // Professional content should strictly adhere to tone
      addRhetoricalElements: brief.writingStyle.toLowerCase() === 'persuasive',
      simplifyLanguage: brief.writingStyle.toLowerCase() === 'educational',
      
      // Grade level complexity
      complexityLevel: mapGradeLevelToComplexity(brief.gradeLevel),
      
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
    
    // Get the grade level label
    const gradeLevelInfo = brief.gradeLevel ? getGradeLevelInfo(brief.gradeLevel) : "intermediate complexity";
    
    let prompt = `Create a ${contentType} ${audience} with ${gradeLevelInfo} and the following structure:\n\n`;
    
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
    if (brief.revisionInstructions || brief.revisionRounds) {
      prompt += "Revision information:\n";
      
      if (brief.revisionRounds) {
        prompt += `- Expected revision rounds: ${brief.revisionRounds}\n`;
      }
      
      if (brief.revisionInstructions) {
        prompt += `- Revision instructions: ${brief.revisionInstructions}\n`;
      }
      
      prompt += "\n";
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
  
  // Helper function to map grade level to complexity value
  const mapGradeLevelToComplexity = (gradeLevel: string): number => {
    const gradeLevelToComplexityMap: Record<string, number> = {
      "grade-4-6": 0.25,     // Simple
      "grade-7-10": 0.5,     // Intermediate
      "grade-11-12": 0.75,   // Advanced
      "college": 1.0         // College/Professional
    };
    
    return gradeLevelToComplexityMap[gradeLevel] || 0.5;
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