import React, { useState } from "react";
import { WritingBrief } from "./writing-brief-form";
import { FeatureGuard } from "@/components/feature-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Lock, 
  FileText, 
  MessageSquare, 
  HelpCircle,
  Globe,
  Users,
  Sparkles,
  Bookmark,
  Layers,
  BookOpen,
  Settings,
  RefreshCw,
  Check,
  Plus,
  X,
  ChevronRight,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnhancedWritingBriefProps {
  onSubmit: (params: any) => void;
  isSubmitting: boolean;
}

const CONTENT_TYPES = [
  "Ad Copy",
  "Email",
  "Newsletter",
  "Product Description",
  "Landing Page",
  "Blog Post",
  "E-book",
  "Case Study",
  "Press Release",
  "Social Media Post",
  "Academic Paper",
];

const TONES = [
  "Professional",
  "Casual",
  "Formal",
  "Enthusiastic",
  "Authoritative",
  "Friendly",
  "Persuasive",
  "Empathetic",
  "Humorous",
  "Serious",
  "Inspirational",
  "Technical",
];

const WRITING_STYLES = [
  "Informative",
  "Conversational",
  "Narrative",
  "Technical",
  "Academic",
  "Promotional",
  "Analytical",
  "Descriptive",
  "Journalistic",
  "Educational",
  "Persuasive",
  "Tutorial",
];

const GRADE_LEVELS = [
  { value: "grade-4-6", label: "Grade 4-6", description: "Simple, clear, accessible writing" },
  { value: "grade-7-10", label: "Grade 7-10", description: "Intermediate complexity for general audiences" },
  { value: "grade-11-12", label: "Grade 11-12", description: "Advanced writing for professional or academic use" },
  { value: "college", label: "College/Professional", description: "High-level content with complex vocabulary and structure" },
];

const KEYWORD_FREQUENCIES = [
  { value: "low", label: "3-5 times" },
  { value: "medium", label: "6-10 times" },
  { value: "high", label: "11-15 times" },
];

const REVISION_ROUNDS = [
  { value: 1, label: "1 Round" },
  { value: 2, label: "2 Rounds" },
  { value: 3, label: "3 Rounds" },
];

export function EnhancedWritingBrief({ onSubmit, isSubmitting }: EnhancedWritingBriefProps) {
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const [brief, setBrief] = useState<WritingBrief>({
    contentType: "",
    targetAudience: "",
    tone: "professional",
    writingStyle: "informative",
    gradeLevel: "grade-7-10",
    conciseStyle: false,
    wordCount: 1000,
    primaryKeywords: [],
    secondaryKeywords: [],
    keywordFrequency: "medium",
    contentStructure: "",
    sections: [],
    formatRequirements: [],
    sources: [],
    includeCitations: false,
    revisionInstructions: "",
    revisionRounds: 1,
  });
  
  const [newPrimaryKeyword, setNewPrimaryKeyword] = useState("");
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newSource, setNewSource] = useState({ url: "", description: "" });
  
  const updateBrief = (field: string, value: any) => {
    setBrief((prev) => ({ ...prev, [field]: value }));
  };
  
  const addPrimaryKeyword = () => {
    if (!newPrimaryKeyword.trim()) return;
    updateBrief("primaryKeywords", [...brief.primaryKeywords, newPrimaryKeyword.trim()]);
    setNewPrimaryKeyword("");
  };
  
  const removePrimaryKeyword = (index: number) => {
    updateBrief(
      "primaryKeywords",
      brief.primaryKeywords.filter((_, i) => i !== index)
    );
  };
  
  const addSecondaryKeyword = () => {
    if (!newSecondaryKeyword.trim()) return;
    updateBrief("secondaryKeywords", [...brief.secondaryKeywords, newSecondaryKeyword.trim()]);
    setNewSecondaryKeyword("");
  };
  
  const removeSecondaryKeyword = (index: number) => {
    updateBrief(
      "secondaryKeywords",
      brief.secondaryKeywords.filter((_, i) => i !== index)
    );
  };
  
  const addSection = () => {
    if (!newSection.trim()) return;
    updateBrief("sections", [...brief.sections, newSection.trim()]);
    setNewSection("");
  };
  
  const removeSection = (index: number) => {
    updateBrief(
      "sections",
      brief.sections.filter((_, i) => i !== index)
    );
  };
  
  const toggleFormatRequirement = (format: string) => {
    if (brief.formatRequirements.includes(format)) {
      updateBrief(
        "formatRequirements",
        brief.formatRequirements.filter((f) => f !== format)
      );
    } else {
      updateBrief("formatRequirements", [...brief.formatRequirements, format]);
    }
  };
  
  const addSource = () => {
    if (!newSource.url.trim()) return;
    updateBrief("sources", [...brief.sources, { ...newSource }]);
    setNewSource({ url: "", description: "" });
  };
  
  const removeSource = (index: number) => {
    updateBrief(
      "sources",
      brief.sources.filter((_, i) => i !== index)
    );
  };
  
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmit = () => {
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
      revisionRounds: brief.revisionRounds || 1,
      revisionInstructions: brief.revisionInstructions,
      
      // Other related settings that we can infer from the brief
      strictToneAdherence: true, // Professional content should strictly adhere to tone
      addRhetoricalElements: brief.writingStyle.toLowerCase() === 'persuasive',
      simplifyLanguage: brief.writingStyle.toLowerCase() === 'educational',
      
      // Writing style options
      conciseStyle: brief.conciseStyle,
      
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
  
  // Helper function to get a description of the grade level for the prompt
  const getGradeLevelInfo = (gradeLevel: string): string => {
    const gradeLevelDescriptionMap: Record<string, string> = {
      "grade-4-6": "simple, clear, accessible writing (grade 4-6 level)",
      "grade-7-10": "intermediate complexity for general audiences (grade 7-10 level)",
      "grade-11-12": "advanced writing for professional or academic use (grade 11-12 level)",
      "college": "high-level content with complex vocabulary and structure (college/professional level)"
    };
    
    return gradeLevelDescriptionMap[gradeLevel] || "intermediate complexity for general audiences";
  };
  
  const isNextStepDisabled = () => {
    switch (currentStep) {
      case 1: // Content Purpose
        return !brief.contentType || !brief.targetAudience;
      case 2: // Tone & Style
        return !brief.tone || !brief.writingStyle;
      case 3: // Length & Keywords
        return brief.wordCount <= 0 || brief.primaryKeywords.length === 0;
      case 4: // Content Structure
        return brief.sections.length === 0;
      default:
        return false;
    }
  };
  
  const renderStepIndicator = () => {
    const stepLabels = [
      { number: 1, label: "Purpose", icon: <Globe className="w-4 h-4" /> },
      { number: 2, label: "Style", icon: <MessageSquare className="w-4 h-4" /> },
      { number: 3, label: "Keywords", icon: <Bookmark className="w-4 h-4" /> },
      { number: 4, label: "Structure", icon: <Layers className="w-4 h-4" /> },
      { number: 5, label: "Sources", icon: <BookOpen className="w-4 h-4" /> },
      { number: 6, label: "Revisions", icon: <RefreshCw className="w-4 h-4" /> },
    ];
    
    return (
      <div className="mb-8 border rounded-md p-2 md:p-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap justify-between">
          {stepLabels.map((step) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            
            return (
              <div 
                key={step.number} 
                className={`
                  flex items-center py-2 px-1 md:px-3 cursor-pointer rounded-md transition-colors
                  ${isActive ? "bg-blue-100 dark:bg-blue-800/40 text-primary" : 
                    isCompleted ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/30"}
                  ${step.number <= currentStep ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
                  mb-1 md:mb-0 w-1/3 md:w-auto
                `}
                onClick={() => {
                  if (step.number <= currentStep) {
                    setCurrentStep(step.number);
                  }
                }}
              >
                <div
                  className={`
                    flex items-center justify-center w-7 h-7 rounded-full mr-1 md:mr-2 flex-shrink-0
                    ${isActive ? "bg-primary text-primary-foreground" : 
                      isCompleted ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.icon}
                </div>
                <span className="text-xs font-medium hidden sm:block">
                  {step.label}
                </span>
                <span className="text-xs font-medium sm:hidden">
                  {step.number}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
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
      <Card className="w-full">
        <CardHeader className="bg-blue-100 dark:bg-blue-950/50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Professional Writing Brief
            </CardTitle>
            <Badge variant="outline" className="px-2 py-1 bg-blue-200 dark:bg-blue-900 font-medium">
              Pro Feature
            </Badge>
          </div>
          <CardDescription className="text-blue-800 dark:text-blue-300">
            Define your content requirements step-by-step for precise, professional results
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-100 dark:border-blue-900">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2 inline" />
              Complete each section to create a comprehensive brief. All fields can be edited at any time.
            </p>
          </div>
          
          {renderStepIndicator()}
          
          {/* Step 1: Content Purpose */}
          <div className={currentStep === 1 ? "block" : "hidden"}>
            <div className="space-y-6">
              <div className="rounded-md border p-4 bg-blue-50/50 dark:bg-blue-950/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800 dark:text-blue-300">
                  <Globe className="h-5 w-5 mr-2" />
                  Content Purpose
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="contentType" className="text-base font-medium">
                        Content Type
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="w-60">
                            <p>Select the type of content you need to set the appropriate format and approach</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={brief.contentType}
                      onValueChange={(value) => updateBrief("contentType", value)}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1">
                          {CONTENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                          <SelectItem value="Other">Other (specify in keywords)</SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="targetAudience" className="text-base font-medium">
                        Target Audience
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="w-72">
                            <p>Describe who will be reading this content, including their profession, interests, knowledge level, etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="targetAudience"
                      placeholder="e.g., Marketing professionals aged 25-45 with knowledge of SEO"
                      value={brief.targetAudience}
                      onChange={(e) => updateBrief("targetAudience", e.target.value)}
                      className="min-h-[100px] bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step 2: Tone & Style */}
          <div className={currentStep === 2 ? "block" : "hidden"}>
            <div className="space-y-6">
              <div className="rounded-md border p-4 bg-blue-50/50 dark:bg-blue-950/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800 dark:text-blue-300">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Tone & Voice
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tone" className="text-base font-medium">
                        Content Tone
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="w-72">
                            <p>The emotional quality of your content - how it makes readers feel</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <Select
                      value={brief.tone}
                      onValueChange={(value) => updateBrief("tone", value)}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1">
                          {TONES.map((tone) => (
                            <SelectItem 
                              key={tone} 
                              value={tone.toLowerCase()}
                              className="flex items-center px-3 py-2 rounded-md cursor-pointer"
                            >
                              {tone}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    
                    <div className="text-xs text-muted-foreground italic pl-1">
                      {brief.tone === "professional" && "Clear, direct, and business-appropriate language"}
                      {brief.tone === "casual" && "Relaxed, conversational, and approachable"}
                      {brief.tone === "formal" && "Proper, traditional, and academic language"}
                      {brief.tone === "enthusiastic" && "Energetic, positive, and excited delivery"}
                      {brief.tone === "authoritative" && "Expert, confident, and definitive voice"}
                      {brief.tone === "friendly" && "Warm, inviting, and personable language"}
                      {brief.tone === "persuasive" && "Convincing, compelling, and motivating"}
                      {brief.tone === "empathetic" && "Understanding, caring, and compassionate"}
                      {brief.tone === "humorous" && "Light-hearted, amusing, and entertaining"}
                      {brief.tone === "serious" && "Focused, no-nonsense, and straightforward"}
                      {brief.tone === "inspirational" && "Uplifting, motivating, and encouraging"}
                      {brief.tone === "technical" && "Precise, factual, and specialized terminology"}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="writingStyle" className="text-base font-medium">
                        Writing Style
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="w-72">
                            <p>The structural approach to presenting information and engaging readers</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <Select
                      value={brief.writingStyle}
                      onValueChange={(value) => updateBrief("writingStyle", value)}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                        <SelectValue placeholder="Select writing style" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1">
                          {WRITING_STYLES.map((style) => (
                            <SelectItem 
                              key={style} 
                              value={style.toLowerCase()}
                              className="flex items-center px-3 py-2 rounded-md cursor-pointer"
                            >
                              {style}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    
                    <div className="text-xs text-muted-foreground italic pl-1">
                      {brief.writingStyle === "informative" && "Provides clear, factual information to educate readers"}
                      {brief.writingStyle === "conversational" && "Friendly, approachable style that feels like dialog"}
                      {brief.writingStyle === "narrative" && "Storytelling approach with a clear sequence of events"}
                      {brief.writingStyle === "technical" && "Detailed, precise language for specialized audiences"}
                      {brief.writingStyle === "academic" && "Scholarly style with citations and formal structure"}
                      {brief.writingStyle === "promotional" && "Persuasive content highlighting benefits and features"}
                      {brief.writingStyle === "analytical" && "Examines evidence and presents logical conclusions"}
                      {brief.writingStyle === "descriptive" && "Rich, sensory details that paint a vivid picture"}
                      {brief.writingStyle === "journalistic" && "Factual reporting style with key information first"}
                      {brief.writingStyle === "educational" && "Structured content that facilitates learning"}
                      {brief.writingStyle === "persuasive" && "Convincing arguments that change opinions or behaviors"}
                      {brief.writingStyle === "tutorial" && "Step-by-step instructions for completing tasks"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-md border p-4 bg-gray-50 dark:bg-gray-950/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800 dark:text-blue-300">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Content Complexity Level
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-3">
                      <Label htmlFor="gradeLevel" className="text-base font-medium">
                        Reading Level:
                      </Label>
                      <Badge variant="outline" className="font-medium">
                        {GRADE_LEVELS.find(level => level.value === brief.gradeLevel)?.label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="py-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                          <span>Simple</span>
                          <span>Intermediate</span>
                          <span>Advanced</span>
                          <span>College</span>
                        </div>
                        <div className="relative">
                          <Slider
                            id="gradeLevelSlider"
                            min={0}
                            max={3}
                            step={1}
                            value={[GRADE_LEVELS.findIndex(level => level.value === brief.gradeLevel)]}
                            onValueChange={(value) => {
                              const index = value[0];
                              updateBrief("gradeLevel", GRADE_LEVELS[index].value);
                            }}
                            className="mb-6 mt-2"
                          />
                          <div className="absolute w-full flex justify-between -mt-1">
                            <div className="w-1 h-3 bg-gray-300 dark:bg-gray-700" />
                            <div className="w-1 h-3 bg-gray-300 dark:bg-gray-700" />
                            <div className="w-1 h-3 bg-gray-300 dark:bg-gray-700" />
                            <div className="w-1 h-3 bg-gray-300 dark:bg-gray-700" />
                          </div>
                        </div>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs flex items-center text-muted-foreground hover:text-foreground cursor-help">
                              <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                              What does this mean?
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="w-80">
                            <p className="mb-2 text-sm font-medium">Reading Level Complexity</p>
                            <ul className="text-xs space-y-1.5">
                              {GRADE_LEVELS.map((level) => (
                                <li key={level.value} className="flex items-start">
                                  <span className="font-semibold min-w-24">{level.label}:</span>
                                  <span>{level.description}</span>
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-white dark:bg-gray-900 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Example at {GRADE_LEVELS.find(level => level.value === brief.gradeLevel)?.label} Level</h4>
                      <Badge variant="secondary" className="text-xs">
                        {brief.gradeLevel === "grade-4-6" && "Flesch-Kincaid: 85-100"}
                        {brief.gradeLevel === "grade-7-10" && "Flesch-Kincaid: 65-84"}
                        {brief.gradeLevel === "grade-11-12" && "Flesch-Kincaid: 50-64"}
                        {brief.gradeLevel === "college" && "Flesch-Kincaid: 30-49"}
                      </Badge>
                    </div>
                    <p className="text-sm italic text-muted-foreground">
                      {brief.gradeLevel === "grade-4-6" && 
                        "The cat sat on the mat. It was warm there. The sun made a bright spot. The cat liked to feel warm. It closed its eyes and went to sleep."}
                      {brief.gradeLevel === "grade-7-10" && 
                        "The feline found comfort on the household rug. The afternoon sunlight created a warm patch that was ideal for relaxation. Content with its spot, the cat's eyelids grew heavy until it drifted off to sleep."}
                      {brief.gradeLevel === "grade-11-12" && 
                        "The domestic feline situated itself upon the floor covering, where the afternoon sun's rays had established a comfortable microclimate. Pleased with this fortuitous thermal condition, the cat gradually surrendered to somnolence."}
                      {brief.gradeLevel === "college" && 
                        "The domesticated felis catus positioned itself strategically on the textile floor covering, where solar radiation had created an optimal thermal environment. Experiencing contentment with this serendipitous meteorological phenomenon, the felid succumbed to a state of temporary unconsciousness characteristic of its species' diurnal habits."}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="rounded-md border p-4 bg-gray-50 dark:bg-gray-950/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800 dark:text-blue-300">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Writing Style Enhancements
                </h3>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md bg-white dark:bg-gray-900">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Label htmlFor="conciseStyle" className="text-base font-medium">
                          Concise Writing Style
                        </Label>
                        <Badge variant="outline" className="text-xs">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 sm:mb-0">
                        Removes redundant phrases for clearer, more direct writing
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="w-80">
                            <div className="space-y-2">
                              <p className="font-medium">Concise Writing Style</p>
                              <p className="text-sm">Automatically removes filler phrases and redundant expressions to make your content more direct and impactful.</p>
                              <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-2 text-sm mt-2">
                                <p className="mb-1 font-medium text-xs">Example:</p>
                                <p className="text-muted-foreground">
                                  <span className="line-through text-red-500 dark:text-red-400">This isn't just</span> AI; it's about creating...
                                </p>
                                <p className="text-green-600 dark:text-green-400 mt-2">
                                  This is AI, designed to create...
                                </p>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Switch 
                        id="conciseStyle" 
                        checked={brief.conciseStyle} 
                        onCheckedChange={(checked) => updateBrief("conciseStyle", checked)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step 3: Length & Keywords */}
          <div className={currentStep === 3 ? "block" : "hidden"}>
            <div className="space-y-6">
              <div className="rounded-md border p-4 bg-blue-50/50 dark:bg-blue-950/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800 dark:text-blue-300">
                  <Settings className="h-5 w-5 mr-2" />
                  Content Parameters
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="wordCount" className="text-base font-medium">
                        Word Count
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="w-60">
                            <p>The target length for your content. The AI will aim to be within 10% of this word count.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        id="wordCount"
                        type="number"
                        className="bg-white dark:bg-gray-900"
                        min="100"
                        max="10000"
                        value={brief.wordCount}
                        onChange={(e) => updateBrief("wordCount", parseInt(e.target.value) || 0)}
                      />
                      <Select
                        value={brief.wordCount.toString()}
                        onValueChange={(value) => updateBrief("wordCount", parseInt(value))}
                      >
                        <SelectTrigger className="w-full md:w-[220px] bg-white dark:bg-gray-900">
                          <SelectValue placeholder="Select preset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="350">Brief (350 words)</SelectItem>
                          <SelectItem value="500">Short (500 words)</SelectItem>
                          <SelectItem value="750">Medium (750 words)</SelectItem>
                          <SelectItem value="1000">Standard (1,000 words)</SelectItem>
                          <SelectItem value="1500">Detailed (1,500 words)</SelectItem>
                          <SelectItem value="2000">Comprehensive (2,000 words)</SelectItem>
                          <SelectItem value="3000">In-depth (3,000 words)</SelectItem>
                          <SelectItem value="5000">Extended (5,000 words)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-md border p-4 bg-blue-50/50 dark:bg-blue-950/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800 dark:text-blue-300">
                  <Bookmark className="h-5 w-5 mr-2" />
                  Keywords & SEO
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="keywordFrequency" className="text-base font-medium">
                        Keyword Frequency
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="w-60">
                            <p>Controls how often your primary keywords will appear in the content</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {KEYWORD_FREQUENCIES.map((freq) => (
                        <div 
                          key={freq.value}
                          className={`
                            border rounded-md p-3 text-center cursor-pointer transition-colors
                            ${brief.keywordFrequency === freq.value 
                              ? "bg-primary/10 border-primary" 
                              : "bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"}
                          `}
                          onClick={() => updateBrief("keywordFrequency", freq.value)}
                        >
                          <div className="text-sm font-medium">{freq.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {freq.value === "low" && "Subtle"}
                            {freq.value === "medium" && "Balanced"}
                            {freq.value === "high" && "Emphasized"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        Primary Keywords
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="w-72">
                            <p>Main keywords that will appear throughout the content at the selected frequency</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {brief.primaryKeywords.length > 0 ? (
                        brief.primaryKeywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="py-1.5 px-3 gap-1.5">
                            {keyword}
                            <X 
                              className="h-3.5 w-3.5 cursor-pointer hover:text-destructive" 
                              onClick={() => removePrimaryKeyword(index)} 
                            />
                          </Badge>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No primary keywords added yet
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newPrimaryKeyword}
                        onChange={(e) => setNewPrimaryKeyword(e.target.value)}
                        placeholder="Enter a keyword"
                        className="bg-white dark:bg-gray-900"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addPrimaryKeyword();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={addPrimaryKeyword}
                        className="whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        Secondary Keywords
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="w-72">
                            <p>Supporting keywords that will appear at least once in the content</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {brief.secondaryKeywords.length > 0 ? (
                        brief.secondaryKeywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="py-1.5 px-3 gap-1.5">
                            {keyword}
                            <X 
                              className="h-3.5 w-3.5 cursor-pointer hover:text-destructive" 
                              onClick={() => removeSecondaryKeyword(index)} 
                            />
                          </Badge>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No secondary keywords added yet
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newSecondaryKeyword}
                        onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                        placeholder="Enter a secondary keyword"
                        className="bg-white dark:bg-gray-900"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSecondaryKeyword();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={addSecondaryKeyword}
                        className="whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4">
          <Button
            type="button"
            onClick={goToPreviousStep}
            variant="outline"
            disabled={currentStep === 1}
          >
            Back
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={goToNextStep}
              disabled={isNextStepDisabled()}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-24"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate Content</>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </FeatureGuard>
  );
}