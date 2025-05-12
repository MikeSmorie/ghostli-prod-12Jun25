import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  ChevronRight,
  FilePlus,
  FileText,
  HelpCircle,
  Globe,
  Users,
  MessageSquare,
  Bookmark,
  RefreshCw,
  X
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

// Types
export interface WritingBrief {
  // Content Purpose
  contentType: string;
  targetAudience: string;
  
  // Tone & Style
  tone: string;
  writingStyle: string;
  gradeLevel: string;
  
  // Length & Keywords
  wordCount: number;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  keywordFrequency: string;
  
  // Content Structure
  sections: string[];
  formatRequirements: string[];
  
  // Sources and Citations
  sources: {
    url: string;
    description: string;
  }[];
  includeCitations: boolean;
  
  // Revision Instructions
  revisionInstructions: string;
  revisionRounds: number;
}

export interface WritingBriefFormProps {
  onSubmit: (brief: WritingBrief) => void;
  isSubmitting: boolean;
}

const DEFAULT_BRIEF: WritingBrief = {
  contentType: "",
  targetAudience: "",
  tone: "professional",
  writingStyle: "informative",
  gradeLevel: "grade-7-10",
  wordCount: 1000,
  primaryKeywords: [],
  secondaryKeywords: [],
  keywordFrequency: "medium",
  sections: [],
  formatRequirements: [],
  sources: [],
  includeCitations: false,
  revisionInstructions: "",
  revisionRounds: 1,
};

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

const FORMAT_REQUIREMENTS = [
  "Headings & Subheadings",
  "Bullet Points",
  "Numbered Lists",
  "Tables",
  "Bold Keywords",
  "Quotes/Testimonials",
  "Image Captions",
  "Call to Action",
  "FAQ Section",
  "Summary Section",
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

const GRADE_LEVELS = [
  { value: "grade-4-6", label: "Grade 4-6", description: "Simple, clear, accessible writing" },
  { value: "grade-7-10", label: "Grade 7-10", description: "Intermediate complexity for general audiences" },
  { value: "grade-11-12", label: "Grade 11-12", description: "Advanced writing for professional or academic use" },
  { value: "college", label: "College/Professional", description: "High-level content with complex vocabulary and structure" },
];

export function WritingBriefForm({ onSubmit, isSubmitting }: WritingBriefFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const [brief, setBrief] = useState<WritingBrief>(DEFAULT_BRIEF);
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
    onSubmit(brief);
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
    return (
      <div className="flex justify-between mb-6">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <div
                className={`
                  relative flex items-center justify-center w-8 h-8 rounded-full
                  ${isActive ? "bg-primary text-primary-foreground" : 
                    isCompleted ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}
                  ${index < totalSteps - 1 ? "after:content-[''] after:absolute after:top-1/2 after:h-[2px] after:w-full after:translate-y-[-50%] after:translate-x-[100%] after:bg-gray-200 dark:after:bg-gray-700" : ""}
                `}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
              </div>
              <span className="text-xs mt-1 text-center hidden sm:block">
                {stepNumber === 1 && "Purpose"}
                {stepNumber === 2 && "Style"}
                {stepNumber === 3 && "Keywords"}
                {stepNumber === 4 && "Structure"}
                {stepNumber === 5 && "Sources"}
                {stepNumber === 6 && "Revisions"}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="bg-blue-50 dark:bg-blue-950 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <FilePlus className="mr-2 h-5 w-5" />
            Structured Writing Brief
          </CardTitle>
          <Badge variant="outline" className="px-2 py-1 bg-blue-100 dark:bg-blue-900">
            Pro Feature
          </Badge>
        </div>
        <CardDescription>
          Define your content requirements step-by-step for better results
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {renderStepIndicator()}
        
        {/* Step 1: Content Purpose */}
        <div className={currentStep === 1 ? "block" : "hidden"}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <Label htmlFor="contentType" className="text-base font-semibold">
                  What is the primary goal of this content?
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Select the type of content you need. This helps set the appropriate format and approach.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={brief.contentType}
                onValueChange={(value) => updateBrief("contentType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">Other (specify in keywords)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <Label htmlFor="targetAudience" className="text-base font-semibold">
                  Who is the target audience?
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Describe who will be reading this content, including their profession, 
                        interests, knowledge level, etc.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="targetAudience"
                placeholder="e.g., Marketing professionals aged 25-45 with knowledge of SEO"
                value={brief.targetAudience}
                onChange={(e) => updateBrief("targetAudience", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>
        
        {/* Step 2: Tone & Style */}
        <div className={currentStep === 2 ? "block" : "hidden"}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <Label htmlFor="tone" className="text-base font-semibold">
                  What tone should the content convey?
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        The tone defines how your message is expressed emotionally.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={brief.tone}
                onValueChange={(value) => updateBrief("tone", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((tone) => (
                    <SelectItem key={tone} value={tone.toLowerCase()}>
                      {tone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <Label htmlFor="writingStyle" className="text-base font-semibold">
                  Choose a writing style:
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        The writing style determines how information is structured and presented.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={brief.writingStyle}
                onValueChange={(value) => updateBrief("writingStyle", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select writing style" />
                </SelectTrigger>
                <SelectContent>
                  {WRITING_STYLES.map((style) => (
                    <SelectItem key={style} value={style.toLowerCase()}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <Label htmlFor="gradeLevel" className="text-base font-semibold">
                  Content Complexity Level:
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Select the appropriate reading level for your target audience.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-4">
                <RadioGroup
                  value={brief.gradeLevel}
                  onValueChange={(value) => updateBrief("gradeLevel", value)}
                  className="grid grid-cols-1 gap-4"
                >
                  {GRADE_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-start space-x-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={level.value} id={level.value} />
                        <Label htmlFor={level.value} className="font-medium">
                          {level.label}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                  ))}
                </RadioGroup>
                
                <div className="mt-4 bg-muted/50 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Content Preview at {GRADE_LEVELS.find(level => level.value === brief.gradeLevel)?.label}</h4>
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
          </div>
        </div>
        
        {/* Step 3: Length & Keywords */}
        <div className={currentStep === 3 ? "block" : "hidden"}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <Label htmlFor="wordCount" className="text-base font-semibold">
                  Desired word count:
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Specify the approximate word count for your content.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  id="wordCount"
                  type="number"
                  min="100"
                  max="10000"
                  value={brief.wordCount}
                  onChange={(e) => updateBrief("wordCount", parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <div className="flex-1">
                  <Select
                    value={brief.wordCount.toString()}
                    onValueChange={(value) => updateBrief("wordCount", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose common length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">Short (300 words)</SelectItem>
                      <SelectItem value="500">Brief (500 words)</SelectItem>
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
            
            <div>
              <div className="flex items-center mb-2">
                <Label className="text-base font-semibold">
                  Primary keywords to be included:
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        List the main keywords you'd like the content to focus on.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newPrimaryKeyword}
                  onChange={(e) => setNewPrimaryKeyword(e.target.value)}
                  placeholder="Enter a keyword"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPrimaryKeyword();
                    }
                  }}
                />
                <Button type="button" onClick={addPrimaryKeyword}>
                  Add
                </Button>
              </div>
              {brief.primaryKeywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {brief.primaryKeywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-2 py-1 flex items-center gap-1"
                    >
                      {keyword}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => removePrimaryKeyword(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <Label className="text-base font-semibold">
                  Secondary keywords for SEO relevance:
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Provide any secondary keywords that should also be included in the content.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSecondaryKeyword}
                  onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                  placeholder="Enter a secondary keyword"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSecondaryKeyword();
                    }
                  }}
                />
                <Button type="button" onClick={addSecondaryKeyword}>
                  Add
                </Button>
              </div>
              {brief.secondaryKeywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {brief.secondaryKeywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="px-2 py-1 flex items-center gap-1"
                    >
                      {keyword}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => removeSecondaryKeyword(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Keyword Frequency Dropdown */}
            <div>
              <div className="flex items-center mb-2">
                <Label htmlFor="keywordFrequency" className="text-base font-semibold">
                  Keyword Frequency (Primary Keywords):
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Indicate how often you'd like the primary keywords to appear in the content.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={brief.keywordFrequency}
                onValueChange={(value) => updateBrief("keywordFrequency", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select keyword frequency" />
                </SelectTrigger>
                <SelectContent>
                  {KEYWORD_FREQUENCIES.map((frequency) => (
                    <SelectItem key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Step 4: Content Structure */}
        <div className={currentStep === 4 ? "block" : "hidden"}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <Label className="text-base font-semibold">
                  What sections should the content include?
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Define the structure by adding main sections for your content.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="e.g., Introduction, Key Benefits, Conclusion"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSection();
                    }
                  }}
                />
                <Button type="button" onClick={addSection}>
                  Add
                </Button>
              </div>
              {brief.sections.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">Section Order:</Label>
                  <div className="space-y-2 border rounded-md p-2 bg-gray-50 dark:bg-gray-900">
                    {brief.sections.map((section, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border"
                      >
                        <span className="flex items-center">
                          <Badge variant="outline" className="mr-2">
                            {index + 1}
                          </Badge>
                          {section}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSection(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <div className="flex items-center mb-2">
                <Label className="text-base font-semibold">
                  Specific formatting requirements:
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Select any special formatting elements that should be included.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FORMAT_REQUIREMENTS.map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={`format-${format}`}
                      checked={brief.formatRequirements.includes(format)}
                      onCheckedChange={() => toggleFormatRequirement(format)}
                    />
                    <label
                      htmlFor={`format-${format}`}
                      className="text-sm cursor-pointer"
                    >
                      {format}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 5: Sources and Citations */}
        <div className={currentStep === 5 ? "block" : "hidden"}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <Label className="text-base font-semibold">
                  Provide relevant URLs or research sources:
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Add up to 5 reference sources to inform the content.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="URL"
                    value={newSource.url}
                    onChange={(e) =>
                      setNewSource({ ...newSource, url: e.target.value })
                    }
                    className="md:col-span-1"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newSource.description}
                    onChange={(e) =>
                      setNewSource({ ...newSource, description: e.target.value })
                    }
                    className="md:col-span-2"
                  />
                </div>
                <Button
                  type="button"
                  onClick={addSource}
                  disabled={brief.sources.length >= 5}
                  className="w-full"
                >
                  Add Source
                  {brief.sources.length >= 5 && " (Max 5)"}
                </Button>
              </div>
              
              {brief.sources.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">Added Sources:</Label>
                  <div className="space-y-2">
                    {brief.sources.map((source, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-2 rounded border"
                      >
                        <div className="overflow-hidden">
                          <div className="truncate text-sm font-medium">
                            {source.url}
                          </div>
                          {source.description && (
                            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {source.description}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSource(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 pt-4">
              <Switch
                id="includeCitations"
                checked={brief.includeCitations}
                onCheckedChange={(checked) => updateBrief("includeCitations", checked)}
              />
              <Label htmlFor="includeCitations" className="text-base">
                Include citations in the content
              </Label>
            </div>
          </div>
        </div>
        
        {/* Step 6: Revision/Feedback Instructions */}
        <div className={currentStep === 6 ? "block" : "hidden"}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Revisions Section</h3>
            <p className="text-sm text-muted-foreground">
              Specify how you'd like feedback and revisions to be handled for this content.
            </p>

            <div>
              <div className="flex items-center mb-2">
                <Label htmlFor="revisionInstructions" className="text-base font-semibold">
                  Revision Instructions:
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Please outline any specific changes you'd like to see in the first draft.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="revisionInstructions"
                placeholder="e.g., Focus on improving clarity in technical sections, prioritize data accuracy over style, maintain consistent voice across revisions..."
                value={brief.revisionInstructions}
                onChange={(e) => updateBrief("revisionInstructions", e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            <div>
              <div className="flex items-center mb-2">
                <Label htmlFor="revisionRounds" className="text-base font-semibold">
                  Revision Rounds:
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        How many rounds of revisions would you prefer before final approval?
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={brief.revisionRounds.toString()}
                onValueChange={(value) => updateBrief("revisionRounds", Number(value))}
              >
                <SelectTrigger className="w-full md:w-1/3">
                  <SelectValue placeholder="Select number of rounds" />
                </SelectTrigger>
                <SelectContent>
                  {REVISION_ROUNDS.map((round) => (
                    <SelectItem key={round.value} value={round.value.toString()}>
                      {round.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-200 dark:border-blue-800 mt-6">
              <h3 className="text-base font-semibold mb-2 flex items-center">
                <Bookmark className="mr-2 h-4 w-4" />
                Brief Summary
              </h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="purpose">
                  <AccordionTrigger className="text-sm">
                    Content Purpose
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-4 text-sm">
                      <p>
                        <span className="font-medium">Type:</span>{" "}
                        {brief.contentType || "Not specified"}
                      </p>
                      <p>
                        <span className="font-medium">Audience:</span>{" "}
                        {brief.targetAudience || "Not specified"}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="style">
                  <AccordionTrigger className="text-sm">
                    Tone & Style
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-4 text-sm">
                      <p>
                        <span className="font-medium">Tone:</span>{" "}
                        {brief.tone || "Not specified"}
                      </p>
                      <p>
                        <span className="font-medium">Style:</span>{" "}
                        {brief.writingStyle || "Not specified"}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="keywords">
                  <AccordionTrigger className="text-sm">
                    Length & Keywords
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-4 text-sm">
                      <p>
                        <span className="font-medium">Word Count:</span>{" "}
                        {brief.wordCount}
                      </p>
                      <p>
                        <span className="font-medium">Keywords:</span>{" "}
                        {brief.primaryKeywords.length > 0
                          ? brief.primaryKeywords.join(", ")
                          : "None"}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="structure">
                  <AccordionTrigger className="text-sm">
                    Content Structure
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-4 text-sm">
                      <p>
                        <span className="font-medium">Sections:</span>{" "}
                        {brief.sections.length > 0
                          ? brief.sections.join(" → ")
                          : "Not specified"}
                      </p>
                      <p>
                        <span className="font-medium">Format:</span>{" "}
                        {brief.formatRequirements.length > 0
                          ? brief.formatRequirements.join(", ")
                          : "No special formatting"}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="revisions">
                  <AccordionTrigger className="text-sm">
                    Revisions
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-4 text-sm">
                      <p>
                        <span className="font-medium">Revision Rounds:</span>{" "}
                        {REVISION_ROUNDS.find(r => r.value === brief.revisionRounds)?.label || `${brief.revisionRounds} Round(s)`}
                      </p>
                      {brief.revisionInstructions && (
                        <p>
                          <span className="font-medium">Instructions:</span>{" "}
                          {brief.revisionInstructions.length > 50 
                            ? brief.revisionInstructions.substring(0, 50) + "..." 
                            : brief.revisionInstructions}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button
          type="button"
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
        
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
  );
}