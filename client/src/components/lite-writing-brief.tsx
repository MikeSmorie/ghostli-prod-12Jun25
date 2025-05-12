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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle, File, Lightbulb, Send } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// Types
export interface LiteWritingBrief {
  contentType: string;
  tone: string;
  primaryKeyword: string;
  wordCount: number;
}

export interface LiteWritingBriefProps {
  onSubmit: (brief: LiteWritingBrief) => void;
  isSubmitting: boolean;
}

const DEFAULT_BRIEF: LiteWritingBrief = {
  contentType: "Blog post",
  tone: "casual",
  primaryKeyword: "",
  wordCount: 500,
};

const CONTENT_TYPES = [
  "Blog post",
  "Email",
  "Short article",
  "Social media post",
  "Product description",
  "Newsletter",
  "Website copy",
  "Other"
];

const TONES = [
  "Casual",
  "Friendly",
  "Professional",
  "Formal",
  "Enthusiastic",
  "Serious",
  "Humorous",
  "Authoritative",
  "Inspirational"
];

const WORD_COUNT_OPTIONS = [
  { label: "Short (300 words)", value: 300 },
  { label: "Brief (500 words)", value: 500 },
  { label: "Medium (750 words)", value: 750 },
  { label: "Standard (1,000 words)", value: 1000 },
  { label: "Detailed (1,500 words)", value: 1500 }
];

export function LiteWritingBrief({ onSubmit, isSubmitting }: LiteWritingBriefProps) {
  const [brief, setBrief] = useState<LiteWritingBrief>(DEFAULT_BRIEF);
  const [showForm, setShowForm] = useState(false);
  
  const updateBrief = (field: keyof LiteWritingBrief, value: string | number) => {
    setBrief((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = () => {
    onSubmit(brief);
  };
  
  if (!showForm) {
    return (
      <Card className="w-full mb-6 border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-blue-50 dark:bg-blue-950 border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <File className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg">Quick Writing Brief</CardTitle>
            </div>
            <Badge variant="outline" className="px-2 py-1 bg-blue-100 dark:bg-blue-900">
              Lite
            </Badge>
          </div>
          <CardDescription>
            Streamline your content creation with a simple writing brief
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col items-center text-center p-2 space-y-3">
            <Lightbulb className="h-8 w-8 text-amber-500" />
            <p className="text-sm text-muted-foreground">
              Create content faster with guided prompts. Specify type, tone, keywords, and length.
            </p>
            <Button variant="default" onClick={() => setShowForm(true)}>
              Create Quick Brief
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full mb-6 border-blue-200 dark:border-blue-800">
      <CardHeader className="bg-blue-50 dark:bg-blue-950 border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <File className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg">Quick Writing Brief</CardTitle>
          </div>
          <Badge variant="outline" className="px-2 py-1 bg-blue-100 dark:bg-blue-900">
            Lite
          </Badge>
        </div>
        <CardDescription>
          Streamline your content creation with a simple writing brief
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Content Type */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="contentType" className="font-medium">
                Content Type
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2 h-4 w-4">
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="max-w-xs text-xs">
                      What type of content are you creating?
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
              </SelectContent>
            </Select>
          </div>
          
          {/* Tone */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="tone" className="font-medium">
                Tone
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2 h-4 w-4">
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="max-w-xs text-xs">
                      How should your content sound to readers?
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Keyword */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="primaryKeyword" className="font-medium">
                Primary Keyword (Optional)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2 h-4 w-4">
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="max-w-xs text-xs">
                      Main keyword that should appear in your content
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <Input
              id="primaryKeyword"
              placeholder="e.g., digital marketing"
              value={brief.primaryKeyword}
              onChange={(e) => updateBrief("primaryKeyword", e.target.value)}
            />
          </div>
          
          {/* Word Count */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="wordCount" className="font-medium">
                Word Count
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2 h-4 w-4">
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="max-w-xs text-xs">
                      How long should your content be?
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <Select
              value={brief.wordCount.toString()}
              onValueChange={(value) => updateBrief("wordCount", parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select word count" />
              </SelectTrigger>
              <SelectContent>
                {WORD_COUNT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button
          variant="ghost"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !brief.contentType || !brief.tone}
          className="gap-1"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin">⟳</span>
              Generating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Generate Content
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}