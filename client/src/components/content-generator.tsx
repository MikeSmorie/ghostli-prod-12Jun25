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
import { Loader2, Clock, FileText, AlertTriangle, CheckCircle, Download, Copy } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Types
interface GenerationParams {
  prompt: string;
  tone: string;
  brandArchetype: string;
  wordCount: number;
  antiAIDetection: boolean;
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
  const [tone, setTone] = useState("professional");
  const [brandArchetype, setBrandArchetype] = useState("sage");
  const [wordCount, setWordCount] = useState(300);
  const [antiAIDetection, setAntiAIDetection] = useState(false);
  
  // Result state
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  
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
        
        const response = await apiRequest("POST", "/api/generate-content", params);
        
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
        title: "Content Generated",
        description: "Your content has been successfully generated!",
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
      tone,
      brandArchetype,
      wordCount,
      antiAIDetection,
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

  // Generate fallback content for API failures (for testing only - will be removed)
  const generateFallbackContent = (params: GenerationParams): string => {
    return `This is sample content generated based on your prompt: "${params.prompt}". It would be written in a ${params.tone} tone, using the ${params.brandArchetype} brand archetype, and would be approximately ${params.wordCount} words long. ${params.antiAIDetection ? "Content would be optimized to bypass AI detection." : ""}`;
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
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Input Parameters */}
            <div className="md:col-span-1 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="What would you like to generate? Be specific with your requirements."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] bg-blue-50 dark:bg-blue-950"
                />
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
                      <SelectItem value="informative">Informative</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
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
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="antiDetection"
                    checked={antiAIDetection}
                    onCheckedChange={setAntiAIDetection}
                  />
                  <Label htmlFor="antiDetection">Enable Anti-AI Detection</Label>
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
            <div className="md:col-span-2">
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
                      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md border">
                        <div 
                          ref={contentRef} 
                          className="whitespace-pre-wrap font-medium"
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
                      
                      <div className="flex space-x-2">
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
                          Reset
                        </Button>
                      </div>
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
                <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 border-2 border-dashed rounded-lg">
                  <div className="p-4 rounded-full bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium">No Content Generated Yet</h3>
                    <p className="text-sm text-gray-500">
                      Fill out the form on the left and click "Generate Content" to create
                      AI-powered content based on your specifications.
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