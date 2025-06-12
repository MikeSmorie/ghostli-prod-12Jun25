import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, HelpCircle, Settings, Zap, RefreshCw, Copy, ArrowLeft, Shield, AlertTriangle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import CreditsDisplay from "@/components/credits-display";
import { WriteInMyStyle } from "../components/write-in-my-style";
import { useLocation } from "wouter";
import { EarlyFeedbackPopup } from "@/components/early-feedback-popup";

// Types
interface GenerationParams {
  prompt: string;
  tone: string;
  brandArchetype: string;
  wordCount: number;
  antiAIDetection: boolean;
  isRewrite?: boolean;
  usePersonalStyle?: boolean;
}

interface GenerationMetadata {
  wordCount: number;
  generationTime: number;
  iterations: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

interface GenerationResult {
  content: string;
  metadata: GenerationMetadata;
}

export default function ContentGeneratorNew() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Brief mode state
  const [briefMode, setBriefMode] = useState<"quick" | "detailed">("quick");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Form state
  const [prompt, setPrompt] = useState("");
  const [inputType, setInputType] = useState<"prompt" | "rewrite">("prompt");
  const [tone, setTone] = useState("professional");
  const [brandArchetype, setBrandArchetype] = useState("sage");
  const [wordCount, setWordCount] = useState(1000);
  const [antiAIDetection, setAntiAIDetection] = useState(true);
  const [usePersonalStyle, setUsePersonalStyle] = useState(false);
  
  // Language options
  const [englishVariant, setEnglishVariant] = useState<'us' | 'uk'>('us'); // Default to US English
  
  // Humanization parameters (1% default as per original design)
  const [typosPercentage, setTyposPercentage] = useState(1.0);
  const [grammarMistakesPercentage, setGrammarMistakesPercentage] = useState(1.0);
  const [humanMisErrorsPercentage, setHumanMisErrorsPercentage] = useState(1.0);
  
  // Result state
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Generation tracking for feedback popup
  const [generationCount, setGenerationCount] = useState(0);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  // Content generation mutation
  const { mutate, isPending: isLoading } = useMutation<GenerationResult, Error, GenerationParams>({
    mutationFn: async (params) => {
      setProgress(10);
      
      // Include humanization parameters and language variant in the request
      const requestParams = {
        ...params,
        englishVariant,
        typosPercentage,
        grammarMistakesPercentage,
        humanMisErrorsPercentage
      };
      
      const response = await apiRequest("POST", "/api/content/generate", requestParams);
      setProgress(50);
      const result = await response.json();
      setProgress(100);
      return result;
    },
    onSuccess: (data) => {
      // Defensive programming - ensure data structure exists
      const content = data?.content || "";
      const metadata = data?.metadata || {
        wordCount: 0,
        generationTime: 0,
        iterations: 0,
        tokens: { prompt: 0, completion: 0, total: 0 }
      };
      
      setGeneratedContent(content);
      setMetadata(metadata);
      setProgress(0);
      
      // Track generation count and show feedback popup after 3 generations
      const newCount = generationCount + 1;
      setGenerationCount(newCount);
      
      if (newCount === 3) {
        setShowFeedbackPopup(true);
      }
      
      // Safe access to metadata properties with fallbacks
      const wordCount = metadata?.wordCount || content.split(/\s+/).filter(Boolean).length || 0;
      const generationTime = metadata?.generationTime || 0;
      
      toast({
        title: "Content Generated Successfully",
        description: `Generated ${wordCount} words in ${formatDuration(generationTime)}`,
      });
    },
    onError: (error) => {
      setProgress(0);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide a prompt or content to generate.",
        variant: "destructive",
      });
      return;
    }

    const params: GenerationParams = {
      prompt: prompt.trim(),
      tone,
      brandArchetype,
      wordCount,
      antiAIDetection,
      isRewrite: inputType === "rewrite",
      usePersonalStyle,
    };
    
    mutate(params);
  };

  const handleReset = () => {
    setGeneratedContent(null);
    setMetadata(null);
    setProgress(0);
  };

  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copied to Clipboard",
        description: "Content has been copied to your clipboard.",
      });
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Content Generator</h1>
            <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
              Generate AI-powered content with anti-detection capabilities and personalized writing style.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credits Display */}
        <div className="flex justify-center mb-8">
          <CreditsDisplay />
        </div>

        {/* Brief Mode Toggle */}
        <div className="mb-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Choose Your Brief Type</h2>
                <p className="text-foreground/70">Select how detailed you want to be with your content requirements</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      briefMode === "quick" 
                        ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setBriefMode("quick")}
                  >
                    <CardContent className="pt-6 text-center">
                      <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <h3 className="font-bold text-lg text-foreground">Quick Brief</h3>
                      <p className="text-sm text-foreground/75 mt-2">
                        Fast content generation with essential parameters
                      </p>
                      <Badge className="mt-2" variant={briefMode === "quick" ? "default" : "outline"}>
                        2-3 minutes
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      briefMode === "detailed" 
                        ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setBriefMode("detailed")}
                  >
                    <CardContent className="pt-6 text-center">
                      <Settings className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <h3 className="font-bold text-lg text-foreground">Detailed Brief</h3>
                      <p className="text-sm text-foreground/75 mt-2">
                        Comprehensive control with advanced parameters
                      </p>
                      <Badge className="mt-2" variant={briefMode === "detailed" ? "default" : "outline"}>
                        5-10 minutes
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Generation Form */}
        {briefMode === "quick" ? (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Quick Brief</h3>
                  <p className="text-foreground/70">Essential parameters for fast content generation</p>
                </div>
                
                {/* Write in My Style Banner Component */}
                <WriteInMyStyle 
                  usePersonalStyle={usePersonalStyle}
                  setUsePersonalStyle={setUsePersonalStyle}
                />
                
                <div className="space-y-6">
                  {/* Input Type Toggle */}
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="input-type-toggle" 
                          checked={inputType === "rewrite"} 
                          onCheckedChange={(checked) => setInputType(checked ? "rewrite" : "prompt")}
                        />
                        <Label htmlFor="input-type-toggle" className="font-medium">
                          Rewrite Mode
                        </Label>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">
                              <span className="font-semibold">Prompt Mode:</span> Generate new content from your instructions.
                              <br /><br />
                              <span className="font-semibold">Rewrite Mode:</span> Paste existing content to be rewritten and made AI-undetectable.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Badge variant={inputType === "rewrite" ? "outline" : "default"}>
                      {inputType === "prompt" ? "Creating New Content" : "Rewriting Existing Content"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prompt" className="text-lg font-medium">
                        {inputType === "prompt" 
                          ? "What would you like me to write about?" 
                          : "Paste your existing content to rewrite"}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-gray-500 ml-1 inline" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Be specific about audience, purpose, and key points for best results</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                    </div>
                    
                    <Textarea
                      id="prompt"
                      placeholder={inputType === "prompt" 
                        ? "Describe what you'd like to generate with specific details about audience, purpose, key points, and format."
                        : "Paste your existing content here to be rewritten and made undetectable by AI detection tools..."}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  {/* Basic Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tone">
                        Tone
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-gray-500 ml-1 inline" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Choose the writing tone that best fits your content goals</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="confident">Confident</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="wordCount">
                        Word Count: {wordCount}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-gray-500 ml-1 inline" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Target word count for your content</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Slider
                        value={[wordCount]}
                        onValueChange={(value) => setWordCount(value[0])}
                        max={5000}
                        min={100}
                        step={50}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Language Options */}
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Label className="font-medium text-green-900 dark:text-green-100">English Variant</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] p-3">
                              <p className="mb-1"><strong>English Variant:</strong></p>
                              <p>Select whether to use American English (US) or British English (UK) spelling, vocabulary, and expressions.</p>
                              <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                                <li><strong>US:</strong> color, center, analyze, program, apartment</li>
                                <li><strong>UK:</strong> colour, centre, analyse, programme, flat</li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Badge variant={englishVariant === 'uk' ? "default" : "outline"}>
                        {englishVariant === 'uk' ? "British" : "American"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <span className={`text-sm mr-3 ${englishVariant === 'us' ? 'font-bold text-green-800 dark:text-green-200' : 'text-green-600 dark:text-green-400'}`}>
                        American English
                      </span>
                      <Switch
                        id="english-variant"
                        checked={englishVariant === 'uk'}
                        onCheckedChange={(checked) => setEnglishVariant(checked ? 'uk' : 'us')}
                      />
                      <span className={`text-sm ml-3 ${englishVariant === 'uk' ? 'font-bold text-green-800 dark:text-green-200' : 'text-green-600 dark:text-green-400'}`}>
                        British English
                      </span>
                    </div>
                  </div>

                  {/* Anti-AI Detection Toggle */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="anti-ai-detection"
                        checked={antiAIDetection}
                        onCheckedChange={setAntiAIDetection}
                      />
                      <div>
                        <Label htmlFor="anti-ai-detection" className="font-medium text-blue-900 dark:text-blue-100">
                          Anti-AI Detection
                        </Label>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Make content undetectable by AI detection tools
                        </p>
                      </div>
                    </div>
                    <Badge variant={antiAIDetection ? "default" : "outline"}>
                      {antiAIDetection ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {inputType === "prompt" ? "Generating..." : "Rewriting..."}
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        {inputType === "prompt" ? "Generate Content" : "Rewrite Content"}
                      </>
                    )}
                  </Button>
                  
                  {isLoading && progress > 0 && (
                    <div className="space-y-1">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-center text-foreground/70">
                        {progress < 100 ? "Processing your request..." : "Finalizing content..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Detailed Brief with Multi-Step Process */
          <Card className="max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Detailed Brief</h3>
                  <p className="text-foreground/70">Step {currentStep} of {totalSteps}</p>
                  <Progress value={(currentStep / totalSteps) * 100} className="w-full mt-2" />
                </div>
                
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h4 className="text-xl font-semibold text-foreground">Content Requirements</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="prompt">Content Description</Label>
                        <Textarea
                          id="prompt"
                          placeholder="Describe what you'd like to generate with specific details..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h4 className="text-xl font-semibold text-foreground">Tone & Style</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="tone">Tone</Label>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="confident">Confident</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="authoritative">Authoritative</SelectItem>
                            <SelectItem value="conversational">Conversational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="brandArchetype">Brand Archetype</Label>
                        <Select value={brandArchetype} onValueChange={setBrandArchetype}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select archetype" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sage">Sage - Wise & Insightful</SelectItem>
                            <SelectItem value="hero">Hero - Courageous & Inspiring</SelectItem>
                            <SelectItem value="creator">Creator - Innovative & Artistic</SelectItem>
                            <SelectItem value="ruler">Ruler - Authoritative & Structured</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h4 className="text-xl font-semibold text-foreground">Advanced Settings</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="wordCount">Word Count: {wordCount}</Label>
                        <Slider
                          value={[wordCount]}
                          onValueChange={(value) => setWordCount(value[0])}
                          max={5000}
                          min={100}
                          step={50}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Language Options */}
                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Label className="font-medium text-green-900 dark:text-green-100">English Variant</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[300px] p-3">
                                  <p className="mb-1"><strong>English Variant:</strong></p>
                                  <p>Select whether to use American English (US) or British English (UK) spelling, vocabulary, and expressions.</p>
                                  <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                                    <li><strong>US:</strong> color, center, analyze, program, apartment</li>
                                    <li><strong>UK:</strong> colour, centre, analyse, programme, flat</li>
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Badge variant={englishVariant === 'uk' ? "default" : "outline"}>
                            {englishVariant === 'uk' ? "British" : "American"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <span className={`text-sm mr-3 ${englishVariant === 'us' ? 'font-bold text-green-800 dark:text-green-200' : 'text-green-600 dark:text-green-400'}`}>
                            American English
                          </span>
                          <Switch
                            id="english-variant-detailed"
                            checked={englishVariant === 'uk'}
                            onCheckedChange={(checked) => setEnglishVariant(checked ? 'uk' : 'us')}
                          />
                          <span className={`text-sm ml-3 ${englishVariant === 'uk' ? 'font-bold text-green-800 dark:text-green-200' : 'text-green-600 dark:text-green-400'}`}>
                            British English
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-center space-x-3">
                          <Switch
                            id="anti-ai-detection"
                            checked={antiAIDetection}
                            onCheckedChange={setAntiAIDetection}
                          />
                          <div>
                            <Label htmlFor="anti-ai-detection" className="font-medium text-blue-900 dark:text-blue-100">
                              Anti-AI Detection
                            </Label>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Make content undetectable by AI detection tools
                            </p>
                          </div>
                        </div>
                        <Badge variant={antiAIDetection ? "default" : "outline"}>
                          {antiAIDetection ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>

                      {/* Humanization Parameters */}
                      {antiAIDetection && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center mb-3">
                            <h4 className="text-sm font-bold text-purple-800 dark:text-purple-400">Humanization Parameters</h4>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-2 cursor-help">
                                    <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[300px] p-3">
                                  <p className="mb-2"><strong>Humanization Parameters:</strong></p>
                                  <p className="mb-1">These sliders control the percentage of human-like imperfections added to make content undetectable:</p>
                                  <p className="mb-1"><strong>Typos:</strong> Spelling mistakes and typographical errors</p>
                                  <p className="mb-1"><strong>Grammar Mistakes:</strong> Minor grammatical issues like missing commas, wrong tense</p>
                                  <p className="mb-1"><strong>Human Mis-errors:</strong> Natural inconsistencies like punctuation variations</p>
                                  <p className="text-xs italic">Higher percentages make content more human-like but may impact readability.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Typos Slider */}
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label htmlFor="typos" className="text-xs">Typos: {typosPercentage.toFixed(1)}%</Label>
                                <span className="text-xs text-gray-500">0-5%</span>
                              </div>
                              <Slider
                                id="typos"
                                min={0}
                                max={5}
                                step={0.1}
                                value={[typosPercentage]}
                                onValueChange={(value) => setTyposPercentage(value[0])}
                                className="py-1"
                              />
                            </div>
                            
                            {/* Grammar Mistakes Slider */}
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label htmlFor="grammar" className="text-xs">Grammar Mistakes: {grammarMistakesPercentage.toFixed(1)}%</Label>
                                <span className="text-xs text-gray-500">0-5%</span>
                              </div>
                              <Slider
                                id="grammar"
                                min={0}
                                max={5}
                                step={0.1}
                                value={[grammarMistakesPercentage]}
                                onValueChange={(value) => setGrammarMistakesPercentage(value[0])}
                                className="py-1"
                              />
                            </div>
                            
                            {/* Human Mis-errors Slider */}
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label htmlFor="human-errors" className="text-xs">Human Mis-errors: {humanMisErrorsPercentage.toFixed(1)}%</Label>
                                <span className="text-xs text-gray-500">0-5%</span>
                              </div>
                              <Slider
                                id="human-errors"
                                min={0}
                                max={5}
                                step={0.1}
                                value={[humanMisErrorsPercentage]}
                                onValueChange={(value) => setHumanMisErrorsPercentage(value[0])}
                                className="py-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between pt-6">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Back
                  </Button>
                  
                  {currentStep < totalSteps ? (
                    <Button onClick={nextStep} disabled={currentStep === 1 && !prompt.trim()}>
                      Next
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleGenerate}
                      disabled={isLoading || !prompt.trim()}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Content"
                      )}
                    </Button>
                  )}
                </div>
                
                {isLoading && progress > 0 && (
                  <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-center text-foreground/70">
                      {progress < 100 ? "Processing your request..." : "Finalizing content..."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Footer Navigation */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        {/* Generated Content Section */}
        {generatedContent && (
          <Card className="max-w-4xl mx-auto mt-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Generated Content</h2>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setLocation(`/ai-shield?content=${encodeURIComponent(generatedContent)}`)}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Run AI Detection Shield
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                
                {metadata && (
                  <div className="flex flex-wrap gap-2 text-xs text-foreground/70">
                    <Badge variant="outline">
                      {metadata.wordCount} words
                    </Badge>
                    <Badge variant="outline">
                      Generated in {formatDuration(metadata.generationTime)}
                    </Badge>
                    {metadata.iterations > 1 && (
                      <Badge variant="outline">
                        {metadata.iterations} iterations
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="p-4 border rounded-md bg-white dark:bg-gray-950 whitespace-pre-wrap text-foreground">
                  {generatedContent}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Early Feedback Popup */}
      <EarlyFeedbackPopup 
        isOpen={showFeedbackPopup}
        onClose={() => setShowFeedbackPopup(false)}
        generationCount={generationCount}
      />
    </div>
  );
}