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
import { Loader2, Clock, FileText, AlertTriangle, CheckCircle, Download, Copy, RefreshCw, Search, HelpCircle, Settings, Info, KeySquare, X, Plus, BookMarked, Library, Globe, BookOpen } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { WriteInMyStyle } from "./write-in-my-style";
import { FeatureTabs } from "./ui/content-tabs";
import { WritingBriefManager } from "./writing-brief-manager";

// Types
interface GenerationParams {
  prompt: string;
  preferredHeadline?: string;
  tone: string;
  brandArchetype: string;
  wordCount: number;
  antiAIDetection: boolean;
  prioritizeUndetectable?: boolean;
  
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
  
  // Plagiarism detection options
  checkPlagiarism?: boolean;
  userTier?: string;
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
  
  // Plagiarism detection results for Pro users
  plagiarismResults?: {
    isPlagiarized: boolean;
    score: number;
    checkedTimestamp: string;
    matchedSources: {
      source: string | null;
      url: string | null;
      matchedText: string;
      matchPercentage: number;
      startPosition: number;
      endPosition: number;
      suggestedCitation?: string;
      suggestedRephrase?: string;
    }[];
  };
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

export default function ContentGenerator() {
  // Form state
  const [prompt, setPrompt] = useState("");
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
  const [regionFocus, setRegionFocus] = useState("");
  
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
  
  // Plagiarism detection options
  const [checkPlagiarism, setCheckPlagiarism] = useState(false);
  const [userTier] = useState("premium"); // Set to "premium" to test the feature, would come from user auth
  
  // Result state
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [seoKeywords, setSeoKeywords] = useState<string[] | null>(null);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [plagiarismResults, setPlagiarismResults] = useState<GenerationResult['plagiarismResults'] | null>(null);
  
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
        
        const response = await apiRequest("POST", "/api/content/generate", params);
        
        // Clear interval when response is received
        clearInterval(progressInterval);
        
        if (!response.ok) {
          setProgress(0);
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate content");
        }
        
        // Set progress to 100% to indicate completion
        setProgress(100);
        
        // Use a try-catch block around response.json() to handle JSON parse errors
        try {
          const text = await response.text();
          try {
            // First try direct JSON parsing
            return JSON.parse(text);
          } catch (jsonError) {
            console.error("JSON parse error:", jsonError);
            console.log("Raw response text:", text);
            
            // If parsing fails, try to extract content and create a valid response
            if (text.includes('"content"')) {
              const contentMatch = text.match(/"content"\s*:\s*"([^"]+)"/);
              if (contentMatch && contentMatch[1]) {
                return {
                  content: contentMatch[1],
                  contentWithFootnotes: null,
                  metadata: {
                    wordCount: contentMatch[1].split(/\s+/).filter(Boolean).length,
                    generationTime: 1000,
                    iterations: 1,
                    tokens: {
                      prompt: 0,
                      completion: 0,
                      total: 0
                    }
                  }
                };
              }
            }
            
            // If all attempts fail, throw an error with details
            throw new Error(`JSON parsing failed: ${String(jsonError)}. Raw response: ${text.slice(0, 100)}...`);
          }
        } catch (error) {
          console.error("Error processing response:", error);
          throw error;
        }
      } catch (error: any) {
        setProgress(0);
        throw new Error(error.message || "An error occurred while generating content");
      }
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setMetadata(data.metadata);
      setPlagiarismResults(data.plagiarismResults || null);
      
      // Show different toast based on plagiarism check results
      if (data.plagiarismResults?.isPlagiarized) {
        toast({
          title: "Content Generated - Plagiarism Detected",
          description: `Your content has been generated, but potential plagiarism was detected with a score of ${data.plagiarismResults.score}%.`,
          variant: "destructive",
        });
      } else if (data.plagiarismResults && !data.plagiarismResults.isPlagiarized) {
        toast({
          title: "Content Generated - Plagiarism Free",
          description: "Your content has been successfully generated and passed the plagiarism check!",
          variant: "default",
        });
      } else {
        toast({
          title: "Content Generated",
          description: "Your content has been successfully generated!",
          variant: "default",
        });
      }
      
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
  
  // Export functions
  const exportAsPDF = async () => {
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
  };
  
  const exportAsWord = () => {
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
  };
  
  const exportAsHTML = () => {
    if (!generatedContent) return;
    
    try {
      setExportLoading('html');
      
      // Create HTML document with formatting
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Generated Content</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1, h2, h3 { color: #333; }
            p { margin-bottom: 16px; }
          </style>
        </head>
        <body>
          ${generatedContent.replace(/\n/g, '<br>')}
        </body>
        </html>
      `;
      
      // Create a blob and trigger download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      document.body.appendChild(link);
      link.href = url;
      link.download = 'generated-content.html';
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Content has been exported as HTML file.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export content as HTML file.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setExportLoading(null);
    }
  };
  
  const copyFormattedText = () => {
    if (!generatedContent) return;
    
    try {
      setExportLoading('formatted');
      
      // Create temporary textarea with rich text
      const htmlContent = generatedContent.replace(/\n/g, '<br>');
      
      // Use the clipboard API to copy HTML content
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([generatedContent], { type: 'text/plain' })
      });
      
      navigator.clipboard.write([clipboardItem]).then(() => {
        toast({
          title: "Copied to Clipboard",
          description: "Formatted content has been copied to clipboard.",
          variant: "default",
        });
      });
    } catch (error) {
      // Fallback to plain text if clipboard API fails
      navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copied to Clipboard",
        description: "Content has been copied to clipboard (plain text only).",
        variant: "default",
      });
    } finally {
      setExportLoading(null);
    }
  };

  // Handle form submission
  const handleGenerate = () => {
    if (!prompt) {
      toast({
        title: "Missing Input",
        description: "Please provide a prompt for content generation.",
        variant: "destructive",
      });
      return;
    }

    const params: GenerationParams = {
      prompt,
      preferredHeadline,
      tone,
      brandArchetype,
      wordCount,
      antiAIDetection,
      prioritizeUndetectable,
      
      // Include language options
      englishVariant,
      
      // Include website scanning options
      websiteUrl: websiteUrl.trim(),
      copyWebsiteStyle,
      useWebsiteContent,
      
      // Include "Write in My Style" option
      usePersonalStyle,
      
      // Include keyword control options - NEW FEATURE 1
      requiredKeywords: requiredKeywords.length > 0 ? requiredKeywords : undefined,
      
      // Include source control options - NEW FEATURE 2
      requiredSources: requiredSources.length > 0 ? requiredSources : undefined,
      restrictToRequiredSources,
      
      // Include bibliography options - NEW FEATURE 3
      generateBibliography,
      useFootnotes,
      
      // Include regional focus - NEW FEATURE 4
      regionFocus: regionFocus.trim(),
      
      // Include humanization parameters
      typosPercentage,
      grammarMistakesPercentage,
      humanMisErrorsPercentage,
      
      // Include additional generation options
      generateSEO,
      generateHashtags,
      generateKeywords,
      
      // Include E-A-T and content quality parameters
      includeCitations,
      checkDuplication,
      addRhetoricalElements,
      strictToneAdherence,
      runSelfAnalysis,
      
      // Include content specialization parameters
      legalCompliance,
      technicalAccuracy,
      simplifyLanguage,
      inclusiveLanguage,
      addEmotionalImpact,
      
      // Include plagiarism detection options
      checkPlagiarism,
      userTier,
    };
    
    mutate(params);
  };

  // Handle generation reset
  const handleReset = () => {
    setGeneratedContent(null);
    setMetadata(null);
    setPlagiarismResults(null);
  };
  
  // Handle rephrasing content for plagiarism remediation
  const handleRephrase = async (source: any) => {
    if (!generatedContent) return;
    
    try {
      toast({
        title: "Rephrasing Content",
        description: "Replacing plagiarized section with original wording...",
        variant: "default",
      });
      
      // Call the API to rephrase the content
      const response = await apiRequest("POST", "/api/content/rephrase", {
        content: generatedContent,
        matchedSource: source
      });
      
      if (!response.ok) {
        throw new Error("Failed to rephrase content");
      }
      
      const result = await response.json();
      
      // Update the content with the rephrased version
      setGeneratedContent(result.content);
      
      toast({
        title: "Content Rephrased",
        description: "Plagiarized section has been successfully rephrased.",
        variant: "default",
      });
      
      // Run plagiarism check again
      runPlagiarismCheck();
      
    } catch (error) {
      toast({
        title: "Rephrasing Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Handle adding citation for plagiarism remediation
  const handleAddCitation = async (source: any) => {
    if (!generatedContent) return;
    
    try {
      toast({
        title: "Adding Citation",
        description: "Adding proper attribution to the content...",
        variant: "default",
      });
      
      // Call the API to add citation
      const response = await apiRequest("POST", "/api/content/add-citation", {
        content: generatedContent,
        matchedSource: source
      });
      
      if (!response.ok) {
        throw new Error("Failed to add citation");
      }
      
      const result = await response.json();
      
      // Update the content with the cited version
      setGeneratedContent(result.content);
      
      toast({
        title: "Citation Added",
        description: "Proper attribution has been added to the content.",
        variant: "default",
      });
      
      // Run plagiarism check again
      runPlagiarismCheck();
      
    } catch (error) {
      toast({
        title: "Citation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Function to run plagiarism check on demand
  const runPlagiarismCheck = async () => {
    if (!generatedContent) return;
    
    try {
      toast({
        title: "Running Plagiarism Check",
        description: "Analyzing content for potential plagiarism...",
        variant: "default",
      });
      
      // Call the API to check for plagiarism
      const response = await apiRequest("POST", "/api/check-plagiarism", {
        content: generatedContent
      });
      
      if (!response.ok) {
        throw new Error("Failed to check plagiarism");
      }
      
      const result = await response.json();
      
      // Update the plagiarism results
      setPlagiarismResults(result);
      
      if (result.isPlagiarized) {
        toast({
          title: "Plagiarism Detected",
          description: `Potential plagiarism detected with a score of ${result.score}%.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Plagiarism Detected",
          description: "Your content appears to be original!",
          variant: "default",
        });
      }
      
    } catch (error) {
      toast({
        title: "Plagiarism Check Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
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

  // Update our handler functions with improved error handling
  // (We already have basic addKeyword and removeKeyword functions declared earlier)
  
  // Generate fallback content for API failures (for testing only - will be removed)
  const generateFallbackContent = (params: GenerationParams): string => {
    return `This is sample content generated based on your prompt: "${params.prompt}". It would be written in a ${params.tone} tone, using the ${params.brandArchetype} brand archetype, and would be approximately ${params.wordCount} words long. ${params.antiAIDetection ? "Content would be optimized to bypass AI detection." : ""}`;
  };
  
  // Generate SEO keywords for content
  const generateSeoKeywords = async () => {
    if (!generatedContent) {
      toast({
        title: "No Content",
        description: "Please generate content first before generating SEO keywords.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingSeo(true);
      
      // Call API to generate SEO keywords
      const response = await apiRequest("POST", "/api/generate-seo", {
        content: generatedContent.substring(0, 2000) // Limit content length for API request
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate SEO keywords");
      }
      
      const data = await response.json();
      setSeoKeywords(data.keywords);
      
      toast({
        title: "SEO Keywords Generated",
        description: "Your SEO keywords and hashtags are now available.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "SEO Generation Failed",
        description: error.message || "An error occurred while generating SEO keywords",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSeo(false);
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
      
      {/* Writing Brief Manager - Shows Pro or Lite version based on user access */}
      <WritingBriefManager 
        onSubmit={(params: any) => {
          // Update all the relevant form fields based on the structured brief
          setPrompt(params.prompt);
          setTone(params.tone);
          
          // For Pro brief
          if (params.brandArchetype) {
            setBrandArchetype(params.brandArchetype);
          }
          
          // Handle wordCount from either brief type
          if (params.wordCount) {
            setWordCount(params.wordCount);
          }
          
          // Handle primaryKeyword from Lite brief
          if (params.primaryKeyword && !params.requiredKeywords) {
            setRequiredKeywords([{ 
              keyword: params.primaryKeyword, 
              occurrences: Math.max(1, Math.floor(params.wordCount / 400))
            }]);
          }
          
          // Handle requiredKeywords from Pro brief
          if (params.requiredKeywords) {
            setRequiredKeywords(params.requiredKeywords);
          }
          
          // Handle Pro brief specific fields
          if (params.requiredSources) {
            setRequiredSources(params.requiredSources);
          }
          
          if (params.includeCitations !== undefined) {
            setIncludeCitations(params.includeCitations);
          }
          
          // Additional params that might be set in Pro brief
          if (params.strictToneAdherence !== undefined) {
            setStrictToneAdherence(params.strictToneAdherence);
          }
          
          if (params.addRhetoricalElements !== undefined) {
            setAddRhetoricalElements(params.addRhetoricalElements);
          }
          
          if (params.simplifyLanguage !== undefined) {
            setSimplifyLanguage(params.simplifyLanguage);
          }
          
          // Focus on the prompt field after submission
          document.getElementById('prompt')?.scrollIntoView({ behavior: 'smooth' });
        }}
        isSubmitting={isLoading}
      />
      
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Input Parameters */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt">What would you like me to write about?</Label>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 mb-2 rounded-md border text-sm italic">
                  <p className="font-medium mb-1">Please include in your request:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>What or who is this writing for? (e.g., "for marketing professionals", "for our company blog")</li>
                    <li>How will it be used? (e.g., "as a sales email", "for our website's about page")</li>
                    <li>What reaction do you want from the reader? (e.g., "to feel confident in our expertise", "to sign up for a demo")</li>
                    <li>Any key points you want to emphasize</li>
                    <li>Specific format requirements (e.g., "as a blog post with headings and bullet points")</li>
                  </ul>
                </div>
                <Textarea
                  id="prompt"
                  placeholder="What would you like to generate? Be specific with your requirements."
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
                      <TooltipContent className="max-w-[300px] p-3">
                        <p className="mb-1"><strong>Preferred Headline:</strong></p>
                        <p className="mb-1">Enter your ideal headline or title for the content. The system will use this as a basis for generating your content.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Input
                    id="preferredHeadline"
                    placeholder="Enter your preferred headline or title"
                    value={preferredHeadline}
                    onChange={(e) => setPreferredHeadline(e.target.value)}
                    className="mt-1 bg-blue-50 dark:bg-blue-950"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-blue-50 dark:bg-blue-950">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                      <SelectItem value="legal">Legal (compliant)</SelectItem>
                      <SelectItem value="firm">Firm</SelectItem>
                      <SelectItem value="placatory">Placatory</SelectItem>
                      <SelectItem value="informative">Informative</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="polite">Polite</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="compassionate">Compassionate</SelectItem>
                      <SelectItem value="inspiring">Inspiring</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brandArchetype">Brand Archetype</Label>
                  <Select value={brandArchetype} onValueChange={setBrandArchetype}>
                    <SelectTrigger className="bg-blue-50 dark:bg-blue-950">
                      <SelectValue placeholder="Select archetype" />
                    </SelectTrigger>
                    <SelectContent>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="sage">Sage</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-md">
                            <p>Wise, thoughtful, and insightful. Focuses on knowledge, expertise, and truth.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="hero">Hero</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Courageous, triumphant, and inspiring. Aims to overcome challenges and improve the world.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="outlaw">Outlaw</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Rebellious, disruptive, and revolutionary. Breaks rules and challenges conventions.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="explorer">Explorer</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Adventurous, independent, and pioneering. Seeks discovery, freedom, and authenticity.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="creator">Creator</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Innovative, artistic, and imaginative. Values creativity, self-expression, and originality.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="ruler">Ruler</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Authoritative, structured, and commanding. Creates order, stability, and control.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="caregiver">Caregiver</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Nurturing, supportive, and empathetic. Protects, cares for, and helps others.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="innocent">Innocent</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Optimistic, pure, and straightforward. Values simplicity, goodness, and authenticity.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="everyman">Everyman</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Relatable, authentic, and down-to-earth. Seeks belonging and connection.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="jester">Jester</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Playful, entertaining, and humorous. Lives in the moment and brings joy.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="lover">Lover</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Passionate, indulgent, and appreciative. Focuses on relationships, pleasure, and beauty.</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SelectItem value="magician">Magician</SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Transformative, visionary, and charismatic. Makes dreams into reality.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </SelectContent>
                  </Select>
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
                
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="antiDetection"
                      checked={antiAIDetection}
                      onCheckedChange={setAntiAIDetection}
                    />
                    <Label htmlFor="antiDetection" className="font-medium">Enable Anti-AI Detection</Label>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800 text-sm">
                    <p className="font-bold mb-1 text-yellow-800 dark:text-yellow-400">IMPORTANT:</p>
                    <p>Our anti-AI detection system ensures your content is completely undetectable by third parties or Google as AI-written. This is a core feature of the GhostliAI system.</p>
                    <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-500 text-xs">Mode Selection:</p>
                      <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                        <li><span className="font-semibold">Speed Mode:</span> Faster generation with standard AI detection evasion (1 pass)</li>
                        <li><span className="font-semibold">Undetectable Mode:</span> Maximum humanization with 3 processing passes for complete AI-detection evasion (takes 2-3x longer)</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1 pb-2 px-2 border rounded-md">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-medium flex items-center">
                            Mode <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] p-3">
                          <p className="mb-2"><strong>Speed vs. Undetectable:</strong></p>
                          <p className="mb-2"><strong>Speed:</strong> Faster generation with standard anti-AI detection (good for drafts).</p>
                          <p><strong>Undetectable:</strong> Maximum humanization with multiple passes for AI detection evasion (slower but more secure).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex items-center">
                      <span className={`text-xs mr-2 ${!prioritizeUndetectable ? 'font-bold' : 'text-gray-500'}`}>Speed</span>
                      <Switch
                        id="priorityMode"
                        checked={prioritizeUndetectable}
                        onCheckedChange={setPrioritizeUndetectable}
                      />
                      <span className={`text-xs ml-2 ${prioritizeUndetectable ? 'font-bold' : 'text-gray-500'}`}>Undetectable</span>
                    </div>
                  </div>
                  
                  {/* Language Options */}
                  <div className="mt-4 bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800 text-sm">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400">Language Options</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <HelpCircle className="h-3 w-3 text-blue-600 dark:text-blue-500" />
                            </span>
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
                    
                    <div className="flex items-center">
                      <span className={`text-xs mr-2 ${englishVariant === 'us' ? 'font-bold' : 'text-gray-500'}`}>American English</span>
                      <Switch
                        id="englishVariant"
                        checked={englishVariant === 'uk'}
                        onCheckedChange={(checked) => setEnglishVariant(checked ? 'uk' : 'us')}
                      />
                      <span className={`text-xs ml-2 ${englishVariant === 'uk' ? 'font-bold' : 'text-gray-500'}`}>British English</span>
                    </div>
                  </div>
                  
                  {/* Website Scanning Options */}
                  <div className="mt-4 bg-cyan-50 dark:bg-cyan-950/30 p-3 rounded-md border border-cyan-200 dark:border-cyan-800 text-sm">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-cyan-800 dark:text-cyan-400">Website Scanning</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <HelpCircle className="h-3 w-3 text-cyan-600 dark:text-cyan-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>Website Scanning:</strong></p>
                            <p className="mb-1">Analyze an existing website to generate content similar to it or based on it.</p>
                            <p className="mb-1"><strong>Copy Style:</strong> Mimics the tone and style of the website</p>
                            <p className="mb-1"><strong>Use Content:</strong> Extracts information from the website to use in generation</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-3">
                      <Input
                        id="websiteUrl"
                        placeholder="Enter website URL (e.g., https://example.com)"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="h-8 text-sm"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="copyWebsiteStyle" 
                            checked={copyWebsiteStyle} 
                            onCheckedChange={(checked) => setCopyWebsiteStyle(checked === true)}
                            disabled={!websiteUrl} 
                          />
                          <Label htmlFor="copyWebsiteStyle" className={`text-xs ${!websiteUrl ? 'text-gray-400' : ''}`}>
                            Copy website style & tone
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="useWebsiteContent" 
                            checked={useWebsiteContent} 
                            onCheckedChange={(checked) => setUseWebsiteContent(checked === true)}
                            disabled={!websiteUrl} 
                          />
                          <Label htmlFor="useWebsiteContent" className={`text-xs ${!websiteUrl ? 'text-gray-400' : ''}`}>
                            Use website content
                          </Label>
                        </div>
                      </div>
                      
                      {websiteUrl && (
                        <div className="text-xs text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-md">
                          <p className="flex items-center">
                            <Info className="h-3 w-3 mr-1 inline" />
                            {copyWebsiteStyle && useWebsiteContent 
                              ? "Will analyze and copy both style and content from the website." 
                              : copyWebsiteStyle 
                                ? "Will analyze and copy only the writing style from the website." 
                                : useWebsiteContent 
                                  ? "Will extract and use information from the website." 
                                  : "Website URL provided but no scanning options selected."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Humanization Parameters - Only shown when Anti-AI Detection is enabled */}
                  {antiAIDetection && (
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-md border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-purple-800 dark:text-purple-400">Humanization Parameters</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <AlertTriangle className="h-3 w-3 text-purple-600 dark:text-purple-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>Humanization Parameters:</strong></p>
                            <p className="mb-1">These sliders control the percentage of human-like imperfections added to the generated content.</p>
                            <p className="mb-1"><strong>Typos:</strong> Spelling mistakes and typographical errors.</p>
                            <p className="mb-1"><strong>Grammar Mistakes:</strong> Minor grammatical issues like missing commas, wrong tense, etc.</p>
                            <p className="mb-1"><strong>Human Mis-errors:</strong> Natural inconsistencies like punctuation variations or word choice errors.</p>
                            <p className="text-xs italic">Higher percentages make content appear more human-written but may impact readability.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-4 mt-3">
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

                  {/* NEW FEATURE 1: Keyword Frequency Controls */}
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-300 dark:border-amber-800">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Keyword Frequency Controls</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>Keyword Controls:</strong></p>
                            <p className="mb-1">Specify keywords that must appear in the content with a minimum number of occurrences.</p>
                            <p className="mb-1">Useful for SEO-optimized content and ensuring key terms are adequately covered.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Keyword list */}
                    {requiredKeywords.length > 0 ? (
                      <div className="mb-3 space-y-2">
                        {requiredKeywords.map((kw, index) => (
                          <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-md border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center">
                              <KeySquare className="h-3 w-3 mr-2 text-amber-600 dark:text-amber-400" />
                              <span className="text-sm font-medium">{kw.keyword}</span>
                              <Badge variant="outline" className="ml-2 text-xs">Min: {kw.occurrences}×</Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => removeKeyword(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">No required keywords added yet. Add keywords below.</p>
                    )}
                    
                    {/* Add keyword form */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7">
                        <Input
                          placeholder="Enter keyword"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select value={newOccurrences.toString()} onValueChange={(val) => setNewOccurrences(parseInt(val))}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}×</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Button 
                          type="button" 
                          size="sm" 
                          className="h-8 w-full bg-amber-600 hover:bg-amber-700" 
                          onClick={addKeyword}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* NEW FEATURE 2: Required Source Selection */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-300 dark:border-blue-800">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400">Required Source Selection</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <AlertTriangle className="h-3 w-3 text-blue-600 dark:text-blue-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>Source Controls:</strong></p>
                            <p className="mb-1">Specify sources that must be referenced in the content generation.</p>
                            <p className="mb-1">Set priority levels (1-5) to indicate the importance of each source.</p>
                            <p className="mb-1">Optionally restrict generation to only use the specified sources.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Sources list */}
                    {requiredSources.length > 0 ? (
                      <div className="mb-3 space-y-2">
                        {requiredSources.map((src, index) => (
                          <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center">
                              <BookOpen className="h-3 w-3 mr-2 text-blue-600 dark:text-blue-400" />
                              <div>
                                <span className="text-sm font-medium">{src.source}</span>
                                {src.url && (
                                  <div className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[200px]">{src.url}</div>
                                )}
                              </div>
                              <Badge variant="outline" className="ml-2 text-xs">Priority: {src.priority}</Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => removeSource(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">No required sources added yet. Add sources below.</p>
                    )}
                    
                    {/* Add source form */}
                    <div className="space-y-2">
                      <Input
                        placeholder="Source name (e.g., 'Harvard Business Review')"
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Source URL (optional)"
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-10">
                          <Select value={newPriority.toString()} onValueChange={(val) => setNewPriority(parseInt(val))}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Priority 1 (Highest)</SelectItem>
                              <SelectItem value="2">Priority 2</SelectItem>
                              <SelectItem value="3">Priority 3</SelectItem>
                              <SelectItem value="4">Priority 4</SelectItem>
                              <SelectItem value="5">Priority 5 (Lowest)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Button 
                            type="button" 
                            size="sm" 
                            className="h-8 w-full bg-blue-600 hover:bg-blue-700" 
                            onClick={addSource}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox 
                          id="restrictSources" 
                          checked={restrictToRequiredSources} 
                          onCheckedChange={(checked) => setRestrictToRequiredSources(checked as boolean)} 
                        />
                        <Label htmlFor="restrictSources" className="text-sm">Restrict to these sources only</Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* NEW FEATURE 3: Bibliography Generation */}
                  <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-md border border-indigo-300 dark:border-indigo-800">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-400">Bibliography Generation</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <AlertTriangle className="h-3 w-3 text-indigo-600 dark:text-indigo-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>Bibliography Options:</strong></p>
                            <p className="mb-1">Generate a professionally formatted bibliography of all sources used.</p>
                            <p className="mb-1">Optionally include footnotes throughout the text for academic credibility.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="generateBibliography" 
                          checked={generateBibliography} 
                          onCheckedChange={(checked) => setGenerateBibliography(checked as boolean)} 
                        />
                        <Label htmlFor="generateBibliography" className="text-sm">Generate bibliography of sources</Label>
                      </div>
                      
                      {generateBibliography && (
                        <div className="flex items-center space-x-2 ml-6">
                          <Checkbox 
                            id="useFootnotes" 
                            checked={useFootnotes} 
                            onCheckedChange={(checked) => setUseFootnotes(checked as boolean)} 
                          />
                          <Label htmlFor="useFootnotes" className="text-sm">Use footnotes for citations in text</Label>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* NEW FEATURE 4: Regional/Geographic Focus */}
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-300 dark:border-emerald-800">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Regional/Geographic Focus</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <AlertTriangle className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>Regional Focus:</strong></p>
                            <p className="mb-1">Specify a geographic region to focus on for statistics and examples.</p>
                            <p className="mb-1">Content will include data and information relevant to the selected region.</p>
                            <p className="mb-1">Examples: "United States", "European Union", "Asia Pacific", etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="mt-2">
                      <Input
                        placeholder="Enter region (e.g., 'United States', 'European Union', 'Asia Pacific')"
                        value={regionFocus}
                        onChange={(e) => setRegionFocus(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Additional Generation Options */}
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-green-800 dark:text-green-400">Additional Generation Options</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <AlertTriangle className="h-3 w-3 text-green-600 dark:text-green-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>Additional Generation Options:</strong></p>
                            <p className="mb-1">These options generate supplementary content along with your main text.</p>
                            <p className="mb-1"><strong>SEO Keywords:</strong> Keywords for search engine optimization.</p>
                            <p className="mb-1"><strong>Hashtags:</strong> Relevant hashtags for social media posts.</p>
                            <p className="mb-1"><strong>Keywords:</strong> General keywords for categorization.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="seo" checked={generateSEO} onCheckedChange={(checked) => setGenerateSEO(checked as boolean)} />
                        <Label htmlFor="seo" className="text-sm">Generate SEO Keywords</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="hashtags" checked={generateHashtags} onCheckedChange={(checked) => setGenerateHashtags(checked as boolean)} />
                        <Label htmlFor="hashtags" className="text-sm">Generate Hashtags</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="keywords" checked={generateKeywords} onCheckedChange={(checked) => setGenerateKeywords(checked as boolean)} />
                        <Label htmlFor="keywords" className="text-sm">Generate Keywords</Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* NEW FEATURE 1: Keyword Controls */}
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Keyword Frequency Controls</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>Keyword Controls:</strong></p>
                            <p className="mb-1">Specify keywords that must appear in the content with a minimum number of occurrences.</p>
                            <p className="mb-1">Useful for SEO-optimized content and ensuring key terms are adequately covered.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Keyword list */}
                    {requiredKeywords.length > 0 ? (
                      <div className="mb-3 space-y-2">
                        {requiredKeywords.map((kw, index) => (
                          <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-md border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center">
                              <KeySquare className="h-3 w-3 mr-2 text-amber-600 dark:text-amber-400" />
                              <span className="text-sm font-medium">{kw.keyword}</span>
                              <Badge variant="outline" className="ml-2 text-xs">Min: {kw.occurrences}×</Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => removeKeyword(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">No required keywords added yet. Add keywords below.</p>
                    )}
                    
                    {/* Add keyword form */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7">
                        <Input
                          placeholder="Enter keyword"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select value={newOccurrences.toString()} onValueChange={(val) => setNewOccurrences(parseInt(val))}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}×</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Button 
                          type="button" 
                          size="sm" 
                          className="h-8 w-full" 
                          onClick={addKeyword}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* E-A-T & Content Quality Controls */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400">E-A-T & Content Quality</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <AlertTriangle className="h-3 w-3 text-blue-600 dark:text-blue-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>E-A-T & Content Quality:</strong></p>
                            <p className="mb-1">These options enhance the Expertise, Authoritativeness, and Trustworthiness of your content.</p>
                            <p className="mb-1"><strong>Citations:</strong> Include authoritative citations and references.</p>
                            <p className="mb-1"><strong>Duplication Check:</strong> Verify content originality.</p>
                            <p className="mb-1"><strong>Rhetorical Elements:</strong> Add persuasive elements like questions and analogies.</p>
                            <p className="mb-1"><strong>Strict Tone:</strong> Enforce consistent tone throughout content.</p>
                            <p className="mb-1"><strong>Self-Analysis:</strong> Include AI self-critique to improve humanness.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="citations" checked={includeCitations} onCheckedChange={(checked) => setIncludeCitations(checked as boolean)} />
                        <Label htmlFor="citations" className="text-sm">Include Citations & References</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="duplication" checked={checkDuplication} onCheckedChange={(checked) => setCheckDuplication(checked as boolean)} />
                        <Label htmlFor="duplication" className="text-sm">Check for Content Duplication</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="rhetorical" checked={addRhetoricalElements} onCheckedChange={(checked) => setAddRhetoricalElements(checked as boolean)} />
                        <Label htmlFor="rhetorical" className="text-sm">Add Rhetorical Elements</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="tone" checked={strictToneAdherence} onCheckedChange={(checked) => setStrictToneAdherence(checked as boolean)} />
                        <Label htmlFor="tone" className="text-sm">Strict Tone Adherence</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="analysis" checked={runSelfAnalysis} onCheckedChange={(checked) => setRunSelfAnalysis(checked as boolean)} />
                        <Label htmlFor="analysis" className="text-sm">Run Self-Analysis</Label>
                      </div>
                    </div>
                  </div>

                  {/* Content Specialization Controls */}
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-md border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-bold text-purple-800 dark:text-purple-400">Content Specialization</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 cursor-help">
                              <AlertTriangle className="h-3 w-3 text-purple-600 dark:text-purple-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-3">
                            <p className="mb-1"><strong>Content Specialization:</strong></p>
                            <p className="mb-1">These options adapt your content for specific purposes and audiences.</p>
                            <p className="mb-1"><strong>Legal Compliance:</strong> Ensure content adheres to legal standards and disclaimers.</p>
                            <p className="mb-1"><strong>Technical Accuracy:</strong> Prioritize precision in technical or scientific content.</p>
                            <p className="mb-1"><strong>Simplify Language:</strong> Make content more accessible with simpler language.</p>
                            <p className="mb-1"><strong>Inclusive Language:</strong> Use diverse and inclusive terminology.</p>
                            <p className="mb-1"><strong>Emotional Impact:</strong> Add compelling emotional elements to content.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="legal" checked={legalCompliance} onCheckedChange={(checked) => setLegalCompliance(checked as boolean)} />
                        <Label htmlFor="legal" className="text-sm">Legal Compliance & Disclaimers</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="technical" checked={technicalAccuracy} onCheckedChange={(checked) => setTechnicalAccuracy(checked as boolean)} />
                        <Label htmlFor="technical" className="text-sm">Technical Accuracy</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="simplify" checked={simplifyLanguage} onCheckedChange={(checked) => setSimplifyLanguage(checked as boolean)} />
                        <Label htmlFor="simplify" className="text-sm">Simplify Language</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="inclusive" checked={inclusiveLanguage} onCheckedChange={(checked) => setInclusiveLanguage(checked as boolean)} />
                        <Label htmlFor="inclusive" className="text-sm">Use Inclusive Language</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox id="emotional" checked={addEmotionalImpact} onCheckedChange={(checked) => setAddEmotionalImpact(checked as boolean)} />
                        <Label htmlFor="emotional" className="text-sm">Add Emotional Impact</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
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
            </div>
            
            {/* Right Column - Generated Content */}
            <div className="lg:col-span-8">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 p-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-center text-lg">Generating high-quality content based on your specifications...</p>
                  <p className="text-center text-sm text-gray-500">This may take a few moments as we craft your content.</p>
                  
                  {/* Progress bar */}
                  {progress > 0 && (
                    <div className="w-full max-w-md space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-center text-xs text-gray-500">
                        {progress < 100 ? `Processing... ${progress}%` : "Completed!"}
                      </p>
                    </div>
                  )}
                </div>
              ) : generatedContent ? (
                <div className="space-y-4">
                  <Tabs defaultValue="preview">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="export">Export Options</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-950 p-6 rounded-md border border-green-200 dark:border-green-800 shadow-sm">
                        <div 
                          ref={contentRef} 
                          className="whitespace-pre-wrap font-medium leading-relaxed"
                        >
                          {generatedContent}
                        </div>
                      </div>
                      
                      {metadata && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {metadata.wordCount} words
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(metadata.generationTime)}
                          </Badge>
                          {metadata.tokens && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              {metadata.tokens.total} tokens
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                          className="flex items-center"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                          className="flex items-center"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                        <Button
                          variant={seoKeywords ? "secondary" : "outline"}
                          size="sm"
                          onClick={generateSeoKeywords}
                          disabled={isGeneratingSeo || !generatedContent}
                          className="flex items-center"
                        >
                          {isGeneratingSeo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Generating SEO...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-1" />
                              Generate SEO Keywords
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Display SEO Keywords */}
                      {seoKeywords && seoKeywords.length > 0 && (
                        <div className="mt-4 space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-md border">
                          <h4 className="font-medium text-sm">SEO Keywords & Hashtags</h4>
                          <div className="flex flex-wrap gap-2">
                            {seoKeywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="bg-blue-100 dark:bg-blue-900">
                                {keyword.startsWith('#') ? keyword : `#${keyword.replace(/\s+/g, '')}`}
                              </Badge>
                            ))}
                          </div>
                          <div className="pt-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(seoKeywords.map(k => 
                                k.startsWith('#') ? k : `#${k.replace(/\s+/g, '')}`).join(' '))}
                              className="text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy All Hashtags
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="export" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={exportAsPDF}
                          disabled={exportLoading !== null}
                        >
                          {exportLoading === 'pdf' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Export as PDF
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={exportAsWord}
                          disabled={exportLoading !== null}
                        >
                          {exportLoading === 'word' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Export as Word
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={exportAsHTML}
                          disabled={exportLoading !== null}
                        >
                          {exportLoading === 'html' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Export as HTML
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={copyFormattedText}
                          disabled={exportLoading !== null}
                        >
                          {exportLoading === 'formatted' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Copying...
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Formatted
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={copyToClipboard}
                          disabled={exportLoading !== null}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Plain Text
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 p-8 border-2 border-dashed rounded-lg">
                  <div className="p-4 rounded-full bg-primary/10">
                    <FileText className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-center space-y-2 max-w-xl">
                    <h3 className="text-xl font-medium">No Content Generated Yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Fill out the form on the left and click "Generate Content" to create
                      AI-powered content based on your specifications.
                    </p>
                    <p className="text-xs text-primary/70 italic mt-4 border-t border-primary/10 pt-3">
                      WriterRIGHT combines state-of-the-art content generation with AI detection evasion and human-like writing qualities.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Tips for Better Content Generation</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Be specific in your prompt, including the target audience and desired outcome.</li>
              <li>Choose a tone that aligns with your brand and audience expectations.</li>
              <li>Select a brand archetype that reflects your brand's personality and values.</li>
              <li>Adjust word count based on your content needs (blog posts, social media, etc.).</li>
              <li>Use Anti-AI Detection for content that needs to appear more human-written.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}