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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Clock, FileText, AlertTriangle, CheckCircle, Download, Copy, RefreshCw, Search, HelpCircle, Settings, Info, KeySquare, X, Plus, BookMarked, Library, Globe, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { WriteInMyStyle } from "../components/write-in-my-style";
import { FeatureSection } from "../components/feature-section";

// Types
interface GenerationParams {
  prompt: string;
  preferredHeadline?: string;
  tone: string;
  brandArchetype: string;
  wordCount: number;
  antiAIDetection: boolean;
  prioritizeUndetectable?: boolean;
  isRewrite?: boolean; // Indicates whether this is a rewrite request
  
  // Language options
  englishVariant?: 'us' | 'uk';
  
  // Website scanning options
  websiteUrl?: string;
  copyWebsiteStyle?: boolean;
  useWebsiteContent?: boolean;
  
  // "Write in My Style" feature
  usePersonalStyle?: boolean;
  
  // Keyword control options - NEW FEATURE 1
  requiredKeywords?: {keyword: string, occurrences: number}[];
  
  // Source control options - NEW FEATURE 2
  requiredSources?: {source: string, url: string, priority: number}[];
  restrictToRequiredSources?: boolean;
  
  // Bibliography options - NEW FEATURE 3
  generateBibliography?: boolean;
  useFootnotes?: boolean;
  
  // Regional focus - NEW FEATURE 4
  regionFocus?: string;
  subRegion?: string;
  
  // Humanization parameters (percentages)
  typosPercentage?: number;
  grammarMistakesPercentage?: number;
  humanMisErrorsPercentage?: number;
  
  // Additional generation options
  generateSEO?: boolean;
  generateHashtags?: boolean;
  generateKeywords?: boolean;
  
  // E-A-T and content quality parameters
  includeCitations?: boolean;
  checkDuplication?: boolean;
  addRhetoricalElements?: boolean;
  strictToneAdherence?: boolean;
  runSelfAnalysis?: boolean;
  
  // Content specialization parameters
  legalCompliance?: boolean;
  technicalAccuracy?: boolean;
  simplifyLanguage?: boolean;
  inclusiveLanguage?: boolean;
  addEmotionalImpact?: boolean;
  
  // Additional refinement options
  maxIterations?: number;
  wordCountTolerance?: number;
  runAIDetectionTest?: boolean;
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
  contentWithFootnotes?: string; // For bibliography with footnotes
  bibliography?: {
    source: string;
    url?: string;
    authors?: string[];
    publicationDate?: string;
    region?: string;
    accessDate: string;
    quotesUsed?: string[];
  }[];
  keywordUsage?: {
    keyword: string;
    occurrences: number;
    locations: number[];
  }[];
  metadata: GenerationMetadata & {
    regionStatistics?: {
      region: string;
      statisticsUsed: {
        statistic: string;
        source: string;
        year: string;
      }[];
    };
  };
  seo?: string[];
  hashtags?: string[];
  keywords?: string[];
}

// Helper functions for brand archetype descriptions
const getArchetypeDescription = (archetype: string): string => {
  const descriptions: Record<string, string> = {
    sage: "Wise, thoughtful, and insightful. Focuses on knowledge, expertise, and truth.",
    hero: "Courageous, triumphant, and inspiring. Aims to overcome challenges and improve the world.",
    outlaw: "Rebellious, disruptive, and revolutionary. Breaks rules and challenges conventions.",
    explorer: "Adventurous, independent, and pioneering. Seeks discovery, freedom, and authenticity.",
    creator: "Innovative, artistic, and imaginative. Values creativity, self-expression, and originality.",
    ruler: "Authoritative, structured, and commanding. Creates order, stability, and control.",
    caregiver: "Nurturing, supportive, and empathetic. Protects, cares for, and helps others.",
    innocent: "Optimistic, pure, and straightforward. Values simplicity, goodness, and authenticity.",
    everyman: "Relatable, authentic, and down-to-earth. Seeks belonging and connection.",
    jester: "Playful, entertaining, and humorous. Lives in the moment and brings joy.",
    lover: "Passionate, indulgent, and appreciative. Focuses on relationships, pleasure, and beauty.",
    magician: "Transformative, visionary, and charismatic. Makes dreams into reality."
  };
  
  return descriptions[archetype] || "Authentic and engaging brand voice";
};

export default function ContentGeneratorNew() {
  // Form state
  const [prompt, setPrompt] = useState("");
  const [inputType, setInputType] = useState<"prompt" | "rewrite">("prompt"); // Toggle between prompt and rewrite modes
  const [preferredHeadline, setPreferredHeadline] = useState(""); // Optional preferred headline
  const [tone, setTone] = useState("professional");
  const [brandArchetype, setBrandArchetype] = useState("sage");
  const [wordCount, setWordCount] = useState(1000);
  const [antiAIDetection, setAntiAIDetection] = useState(true); // Default to true for undetectable content
  const [prioritizeUndetectable, setPrioritizeUndetectable] = useState(false); // Toggle for speed vs undetectability (default to speed for better responsiveness)
  
  // Language options
  const [englishVariant, setEnglishVariant] = useState<'us' | 'uk'>('us'); // Default to US English
  
  // Website scanning options
  const [websiteUrl, setWebsiteUrl] = useState(""); // URL to scan
  const [copyWebsiteStyle, setCopyWebsiteStyle] = useState(false); // Whether to copy style/tone
  const [useWebsiteContent, setUseWebsiteContent] = useState(false); // Whether to use content
  
  // "Write in My Style" option
  const [usePersonalStyle, setUsePersonalStyle] = useState(false); // Default to generic content generation
  
  // Keyword control options - NEW FEATURE 1
  const [requiredKeywords, setRequiredKeywords] = useState<{keyword: string, occurrences: number}[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newOccurrences, setNewOccurrences] = useState(1);
  
  // Source control options - NEW FEATURE 2
  const [requiredSources, setRequiredSources] = useState<{source: string, url: string, priority: number}[]>([]);
  const [newSource, setNewSource] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newPriority, setNewPriority] = useState(3);
  const [restrictToRequiredSources, setRestrictToRequiredSources] = useState(false);
  
  // Handler functions for keyword and source controls
  const addKeyword = () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Missing Keyword",
        description: "Please enter a keyword to add.",
        variant: "destructive",
      });
      return;
    }
    setRequiredKeywords([...requiredKeywords, { 
      keyword: newKeyword.trim(), 
      occurrences: newOccurrences 
    }]);
    setNewKeyword("");
    setNewOccurrences(1);
  };
  
  const removeKeyword = (index: number) => {
    const updatedKeywords = [...requiredKeywords];
    updatedKeywords.splice(index, 1);
    setRequiredKeywords(updatedKeywords);
  };
  
  const addSource = () => {
    if (!newSource.trim()) {
      toast({
        title: "Missing Source",
        description: "Please enter a source to add.",
        variant: "destructive",
      });
      return;
    }
    
    setRequiredSources([...requiredSources, {
      source: newSource.trim(),
      url: newSourceUrl.trim(),
      priority: newPriority
    }]);
    
    setNewSource("");
    setNewSourceUrl("");
    setNewPriority(3);
  };
  
  const removeSource = (index: number) => {
    const updatedSources = [...requiredSources];
    updatedSources.splice(index, 1);
    setRequiredSources(updatedSources);
  };
  
  // Bibliography options - NEW FEATURE 3
  const [generateBibliography, setGenerateBibliography] = useState(false);
  const [useFootnotes, setUseFootnotes] = useState(false);
  
  // Regional focus - NEW FEATURE 4
  const [regionFocus, setRegionFocus] = useState("none");
  const [subRegion, setSubRegion] = useState("");
  
  // Humanization parameters
  const [typosPercentage, setTyposPercentage] = useState(1.0); // Default 1% typos
  const [grammarMistakesPercentage, setGrammarMistakesPercentage] = useState(1.0); // Default 1% grammar mistakes
  const [humanMisErrorsPercentage, setHumanMisErrorsPercentage] = useState(1.0); // Default 1% human mis-errors
  
  // Additional generation options
  const [generateSEO, setGenerateSEO] = useState(true);
  const [generateHashtags, setGenerateHashtags] = useState(true);
  const [generateKeywords, setGenerateKeywords] = useState(true);
  
  // E-A-T and content quality parameters
  const [includeCitations, setIncludeCitations] = useState(false);
  const [checkDuplication, setCheckDuplication] = useState(false);
  const [addRhetoricalElements, setAddRhetoricalElements] = useState(true);
  const [strictToneAdherence, setStrictToneAdherence] = useState(false);
  const [runSelfAnalysis, setRunSelfAnalysis] = useState(false);
  
  // Content specialization parameters
  const [legalCompliance, setLegalCompliance] = useState(false);
  const [technicalAccuracy, setTechnicalAccuracy] = useState(false);
  const [simplifyLanguage, setSimplifyLanguage] = useState(false);
  const [inclusiveLanguage, setInclusiveLanguage] = useState(false);
  const [addEmotionalImpact, setAddEmotionalImpact] = useState(false);
  
  // Result state
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [seoKeywords, setSeoKeywords] = useState<string[] | null>(null);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  
  // Progress indication state
  const [progress, setProgress] = useState(0);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const { toast } = useToast();

    // Reference to generated content for PDF export
  const contentRef = useRef<HTMLDivElement>(null);

  // Content generation mutation
  const { mutate, isPending: isLoading } = useMutation<GenerationResult, Error, GenerationParams>({
    mutationFn: async (params) => {
      try {
        // Set initial progress
        setProgress(10);
        
        // Start a timer to simulate progress while waiting for the API
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 5;
          });
        }, 1000);
        
        // Pass the input type via different endpoint paths
        const endpoint = inputType === "rewrite" ? "/api/content/rewrite" : "/api/content/generate";
        const response = await apiRequest("POST", endpoint, params);
        
        // Clear interval when response is received
        clearInterval(progressInterval);
        
        if (!response.ok) {
          setProgress(0);
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate content");
        }
        
        // Set progress to 100% to indicate completion
        setProgress(100);
        return response.json();
      } catch (error: any) {
        setProgress(0);
        throw new Error(error.message || "An error occurred while generating content");
      }
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setMetadata(data.metadata);
      toast({
        title: inputType === "prompt" ? "Content Generated" : "Content Rewritten",
        description: inputType === "prompt" 
          ? "Your content has been successfully generated!" 
          : "Your content has been successfully rewritten and made AI-undetectable!",
        variant: "default",
      });
      
      // Reset progress after success
      setTimeout(() => setProgress(0), 500);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
      setProgress(0);
    },
  });
  
  // Handle form submission
  const handleGenerate = () => {
    if (!prompt) {
      toast({
        title: "Missing Input",
        description: inputType === "prompt" 
          ? "Please provide a prompt for content generation." 
          : "Please paste the content you want to rewrite.",
        variant: "destructive",
      });
      return;
    }

    // Create params object for API call
    const params: GenerationParams = {
      prompt,
      preferredHeadline,
      tone,
      brandArchetype,
      wordCount,
      antiAIDetection,
      prioritizeUndetectable,
      englishVariant,
      websiteUrl: websiteUrl || undefined,
      copyWebsiteStyle,
      useWebsiteContent,
      usePersonalStyle,
      requiredKeywords: requiredKeywords.length > 0 ? requiredKeywords : undefined,
      requiredSources: requiredSources.length > 0 ? requiredSources : undefined,
      restrictToRequiredSources,
      generateBibliography,
      useFootnotes,
      regionFocus: regionFocus === "none" ? undefined : regionFocus,
      subRegion: subRegion.trim() || undefined,
      typosPercentage,
      grammarMistakesPercentage,
      humanMisErrorsPercentage,
      generateSEO,
      generateHashtags,
      generateKeywords,
      includeCitations,
      checkDuplication,
      addRhetoricalElements,
      strictToneAdherence,
      runSelfAnalysis,
      legalCompliance,
      technicalAccuracy,
      simplifyLanguage,
      inclusiveLanguage,
      addEmotionalImpact,
    };
    
    mutate(params);
  };

  // Handle generation reset
  const handleReset = () => {
    setGeneratedContent(null);
    setMetadata(null);
  };

  // Copy to clipboard function
  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copied to Clipboard",
        description: "Content has been copied to your clipboard.",
        variant: "default",
      });
    }
  };

  // Format duration from milliseconds to readable string
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6 w-full">
      {/* Write in My Style Banner Component */}
      <WriteInMyStyle 
        usePersonalStyle={usePersonalStyle}
        setUsePersonalStyle={setUsePersonalStyle}
      />
      
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Content Parameters - Full Width */}
            <div className="w-full space-y-6">
              <div className="space-y-3">
                <div className="flex flex-col space-y-3">
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
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Info</span>
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
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="text-lg font-medium">
                      {inputType === "prompt" 
                        ? "What would you like me to write about?" 
                        : "Paste your existing content to rewrite"}
                    </Label>
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                              <HelpCircle className="h-4 w-4" />
                              <span className="sr-only">Tips</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="max-w-xs">
                            <p className="text-sm font-medium mb-1">
                              {inputType === "prompt" ? "Tips for Better Results:" : "Rewriting Tips:"}
                            </p>
                            <ul className="text-xs list-disc pl-4 space-y-1">
                              {inputType === "prompt" ? (
                                <>
                                  <li>Be specific with details and requirements</li>
                                  <li>Specify audience and purpose</li>
                                  <li>Define tone, style, and format</li>
                                  <li>Include key points to emphasize</li>
                                </>
                              ) : (
                                <>
                                  <li>Include complete paragraphs for best results</li>
                                  <li>AI-generated content will be rewritten to avoid detection</li>
                                  <li>Adjust humanization settings for more natural results</li>
                                  <li>For large content, consider breaking into smaller sections</li>
                                </>
                              )}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                
                {/* Collapsible Tips */}
                <div className="bg-blue-50/80 dark:bg-blue-950/30 p-4 rounded-md border border-blue-100 dark:border-blue-900">
                  {(() => {
                    const [tipsCollapsed, setTipsCollapsed] = useState(false);
                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center">
                            <Info className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                            Tips for Better Content Generation
                          </h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => setTipsCollapsed(!tipsCollapsed)}
                          >
                            {tipsCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {!tipsCollapsed && (
                          <ul className="text-xs text-blue-700 dark:text-blue-400 list-disc pl-5 space-y-1">
                            <li><span className="font-medium">Be specific about audience:</span> Who is this for? (e.g., "for marketing professionals", "for our company blog")</li>
                            <li><span className="font-medium">Define purpose:</span> How will it be used? (e.g., "as a sales email", "for our website's about page")</li>
                            <li><span className="font-medium">Specify desired outcome:</span> What reaction do you want? (e.g., "to build trust", "to sign up for a demo")</li>
                            <li><span className="font-medium">Include key points:</span> What must be included? List specific points or information to cover</li>
                            <li><span className="font-medium">Mention format:</span> Structure requirements (e.g., "blog post with headings and bullet points")</li>
                          </ul>
                        )}
                      </>
                    );
                  })()}
                </div>
                
                <Textarea
                  id="prompt"
                  placeholder={inputType === "prompt" 
                    ? "Describe what you'd like to generate with specific details about audience, purpose, key points, and format."
                    : "Paste your existing content here to be rewritten and made undetectable by AI detection tools..."}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] bg-blue-50 dark:bg-blue-950"
                />
                
                {/* Preferred Headline Input - NEW FEATURE */}
                <div className="mt-3">
                  <Label htmlFor="preferredHeadline">Preferred Headline (Optional)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 cursor-help">
                          <HelpCircle className="h-3 w-3 text-gray-500" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Specify a preferred headline for your content (optional).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Input
                    id="preferredHeadline"
                    placeholder="Enter your preferred headline (optional)"
                    value={preferredHeadline}
                    onChange={(e) => setPreferredHeadline(e.target.value)}
                    className="mt-1 bg-blue-50 dark:bg-blue-950"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="bg-blue-50 dark:bg-blue-950">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="confident">Confident</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="empathetic">Empathetic</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="thoughtful">Thoughtful</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="brandArchetype">Brand Archetype</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          <HelpCircle className="h-3 w-3 text-gray-500" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-sm">
                        <p className="text-sm font-medium">Brand Archetypes</p>
                        <p className="text-xs">Choose an archetype that best represents your brand personality and voice.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <Select value={brandArchetype} onValueChange={setBrandArchetype}>
                  <SelectTrigger className="bg-blue-50 dark:bg-blue-950">
                    <SelectValue placeholder="Select archetype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sage">Sage - Wise & Insightful</SelectItem>
                    <SelectItem value="hero">Hero - Courageous & Inspiring</SelectItem>
                    <SelectItem value="outlaw">Outlaw - Rebellious & Disruptive</SelectItem>
                    <SelectItem value="explorer">Explorer - Adventurous & Free</SelectItem>
                    <SelectItem value="creator">Creator - Innovative & Artistic</SelectItem>
                    <SelectItem value="ruler">Ruler - Authoritative & Structured</SelectItem>
                    <SelectItem value="caregiver">Caregiver - Nurturing & Supportive</SelectItem>
                    <SelectItem value="innocent">Innocent - Optimistic & Pure</SelectItem>
                    <SelectItem value="everyman">Everyman - Relatable & Authentic</SelectItem>
                    <SelectItem value="jester">Jester - Playful & Humorous</SelectItem>
                    <SelectItem value="lover">Lover - Passionate & Appreciative</SelectItem>
                    <SelectItem value="magician">Magician - Transformative & Visionary</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="text-xs text-muted-foreground mt-1">
                  <p>{getArchetypeDescription(brandArchetype)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="wordCount">Word Count: {wordCount}</Label>
                  <span className="text-sm text-gray-500">50-5000</span>
                </div>
                <Slider
                  id="wordCount"
                  min={50}
                  max={5000}
                  step={100}
                  value={[wordCount]}
                  onValueChange={(value) => setWordCount(value[0])}
                  className="py-2"
                />
              </div>
              
              {/* FEATURE TABS INTEGRATION */}
              <FeatureSection
                // Anti-AI Detection props
                antiAIDetection={antiAIDetection}
                setAntiAIDetection={setAntiAIDetection}
                prioritizeUndetectable={prioritizeUndetectable}
                setPrioritizeUndetectable={setPrioritizeUndetectable}
                
                // Language options
                englishVariant={englishVariant}
                setEnglishVariant={setEnglishVariant}
                
                // Humanization parameters
                typosPercentage={typosPercentage}
                setTyposPercentage={setTyposPercentage}
                grammarMistakesPercentage={grammarMistakesPercentage}
                setGrammarMistakesPercentage={setGrammarMistakesPercentage}
                humanMisErrorsPercentage={humanMisErrorsPercentage}
                setHumanMisErrorsPercentage={setHumanMisErrorsPercentage}
                
                // Website scanning options
                websiteUrl={websiteUrl}
                setWebsiteUrl={setWebsiteUrl}
                copyWebsiteStyle={copyWebsiteStyle}
                setCopyWebsiteStyle={setCopyWebsiteStyle}
                useWebsiteContent={useWebsiteContent}
                setUseWebsiteContent={setUseWebsiteContent}
                
                // Keyword control options
                requiredKeywords={requiredKeywords}
                setRequiredKeywords={setRequiredKeywords}
                newKeyword={newKeyword}
                setNewKeyword={setNewKeyword}
                newOccurrences={newOccurrences}
                setNewOccurrences={setNewOccurrences}
                addKeyword={addKeyword}
                removeKeyword={removeKeyword}
                
                // Source control options
                requiredSources={requiredSources}
                setRequiredSources={setRequiredSources}
                newSource={newSource}
                setNewSource={setNewSource}
                newSourceUrl={newSourceUrl}
                setNewSourceUrl={setNewSourceUrl}
                newPriority={newPriority}
                setNewPriority={setNewPriority}
                restrictToRequiredSources={restrictToRequiredSources}
                setRestrictToRequiredSources={setRestrictToRequiredSources}
                addSource={addSource}
                removeSource={removeSource}
                
                // Bibliography options
                generateBibliography={generateBibliography}
                setGenerateBibliography={setGenerateBibliography}
                useFootnotes={useFootnotes}
                setUseFootnotes={setUseFootnotes}
                
                // Regional focus
                regionFocus={regionFocus}
                setRegionFocus={setRegionFocus}
                subRegion={subRegion}
                setSubRegion={setSubRegion}
                
                // Professional options
                includeCitations={includeCitations}
                setIncludeCitations={setIncludeCitations}
                technicalAccuracy={technicalAccuracy}
                setTechnicalAccuracy={setTechnicalAccuracy}
                legalCompliance={legalCompliance}
                setLegalCompliance={setLegalCompliance}
                checkDuplication={checkDuplication}
                setCheckDuplication={setCheckDuplication}
              />
                            
              <Button 
                className="w-full"
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {inputType === "prompt" ? "Generating..." : "Rewriting..."}
                  </>
                ) : (
                  inputType === "prompt" ? "Generate Content" : "Rewrite Content"
                )}
              </Button>
              
              {isLoading && progress > 0 && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {progress < 100 ? "Processing your request..." : "Finalizing content..."}
                  </p>
                </div>
              )}
            </div>
            
            {/* Generated Content Section - Now displayed below settings */}
            <div className="mt-8 pt-8 border-t border-border">
              {generatedContent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Generated Content</h2>
                    <div className="flex items-center space-x-2">
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
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {metadata.wordCount} words
                      </Badge>
                      <Badge variant="outline" className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Generated in {formatDuration(metadata.generationTime)}
                      </Badge>
                      {metadata.iterations > 1 && (
                        <Badge variant="outline" className="flex items-center">
                          <Settings className="h-3 w-3 mr-1" />
                          {metadata.iterations} iterations
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <Tabs defaultValue="preview">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="export">Export Options</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="space-y-4">
                      <div 
                        ref={contentRef}
                        className="p-4 border rounded-md bg-white dark:bg-gray-950 whitespace-pre-wrap"
                      >
                        {generatedContent}
                      </div>
                      
                      {/* Display SEO Keywords if available */}
                      {seoKeywords && seoKeywords.length > 0 && (
                        <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
                          <h3 className="font-semibold mb-2">Suggested SEO Keywords:</h3>
                          <div className="flex flex-wrap gap-2">
                            {seoKeywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="export" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-2">
                              <FileText className="h-8 w-8 mb-2 text-primary" />
                              <h3 className="font-medium">Export as Document</h3>
                              <p className="text-sm text-muted-foreground">Save content as a Word document or PDF</p>
                              <div className="flex gap-2 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={async () => {
                                    if (!generatedContent || !contentRef.current) return;
                                    
                                    try {
                                      setExportLoading('pdf');
                                      const element = contentRef.current;
                                      const canvas = await html2canvas(element);
                                      const data = canvas.toDataURL('image/png');
                                      
                                      const pdf = new jsPDF({
                                        orientation: 'portrait',
                                        unit: 'mm',
                                        format: 'a4'
                                      });
                                      
                                      const imgProps = pdf.getImageProperties(data);
                                      const pdfWidth = pdf.internal.pageSize.getWidth();
                                      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                                      
                                      pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                      pdf.save('generated-content.pdf');
                                      
                                      toast({
                                        title: "Export Successful",
                                        description: "Content has been exported as PDF.",
                                        variant: "default",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Export Failed",
                                        description: "Failed to export content as PDF.",
                                        variant: "destructive",
                                      });
                                      console.error(error);
                                    } finally {
                                      setExportLoading(null);
                                    }
                                  }}
                                  disabled={exportLoading === 'pdf'}
                                >
                                  {exportLoading === 'pdf' ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                  )}
                                  PDF
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    if (!generatedContent) return;
                                    
                                    try {
                                      setExportLoading('word');
                                      
                                      // Create a blob with Word-compatible HTML
                                      const header = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Generated Content</title></head><body>';
                                      const footer = '</body></html>';
                                      const source = header + generatedContent.replace(/\n/g, '<br>') + footer;
                                      
                                      const fileType = 'application/msword';
                                      const blob = new Blob([source], { type: fileType });
                                      const url = URL.createObjectURL(blob);
                                      
                                      // Create temporary link and trigger download
                                      const link = document.createElement('a');
                                      document.body.appendChild(link);
                                      link.href = url;
                                      link.download = 'generated-content.doc';
                                      link.click();
                                      document.body.removeChild(link);
                                      URL.revokeObjectURL(url);
                                      
                                      toast({
                                        title: "Export Successful",
                                        description: "Content has been exported as Word document.",
                                        variant: "default",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Export Failed",
                                        description: "Failed to export content as Word document.",
                                        variant: "destructive",
                                      });
                                      console.error(error);
                                    } finally {
                                      setExportLoading(null);
                                    }
                                  }}
                                  disabled={exportLoading === 'word'}
                                >
                                  {exportLoading === 'word' ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                  )}
                                  Word
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-2">
                              <Copy className="h-8 w-8 mb-2 text-primary" />
                              <h3 className="font-medium">Copy to Clipboard</h3>
                              <p className="text-sm text-muted-foreground">Copy content to your clipboard</p>
                              <div className="flex gap-2 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={copyToClipboard}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy Text
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-md p-8">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="text-6xl text-gray-300 dark:text-gray-700">
                      <FileText className="h-24 w-24" />
                    </div>
                    <h3 className="text-xl font-medium">No Content Generated Yet</h3>
                    <p className="text-muted-foreground max-w-xs">
                      Fill in the prompts and parameters on the left, then click "Generate Content" to create your AI content.
                    </p>
                    <p className="text-xs text-muted-foreground mt-6">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      All content generated is private and secure
                    </p>
                  </div>
                </div>
              )}
              

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}