import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Copy, 
  RefreshCw, 
  Upload, 
  HelpCircle,
  Star,
  StarHalf,
  Sparkles,
  File,
  Trash,
  MoreHorizontal
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Types
interface EssaySubmission {
  title: string;
  content: string;
  tone: string;
}

interface Essay {
  id: number;
  title: string;
  wordCount: number;
  tone: string;
  status: string;
  createdAt: string;
}

interface WritingStyle {
  id: number;
  userId: number;
  styleFeatures: Record<string, any>;
  avgSentenceLength: string;
  avgParagraphLength: string;
  vocabularyDiversity: string;
  createdAt: string;
  lastUpdated: string;
  isActive: boolean;
  essayCount: number;
}

interface ContentGenerationParams {
  prompt: string;
  tone: string;
  wordCount: number;
  // Humanization parameters (percentages)
  typosPercentage?: number;
  grammarMistakesPercentage?: number;
  humanMisErrorsPercentage?: number;
}

interface GeneratedContent {
  id: number;
  content: string;
  wordCount: number;
  prompt: string;
  tone: string;
  createdAt: string;
}

// Step navigation component
function StepNavigation({ currentStep, setCurrentStep, totalSteps, isNextDisabled = false }) {
  return (
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
        disabled={currentStep === 1}
      >
        Previous
      </Button>
      <div className="flex items-center">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            <div 
              className={`h-2 w-2 rounded-full ${
                index + 1 === currentStep 
                  ? "bg-primary" 
                  : index + 1 < currentStep 
                    ? "bg-primary/60" 
                    : "bg-gray-300"
              }`}
            />
            {index < totalSteps - 1 && (
              <div 
                className={`h-0.5 w-4 ${
                  index + 1 < currentStep ? "bg-primary/60" : "bg-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <Button
        variant="default"
        onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
        disabled={currentStep === totalSteps || isNextDisabled}
      >
        Next
      </Button>
    </div>
  );
}

// Main component
export default function CloneMe() {
  // State for step navigation
  const [currentStep, setCurrentStep] = useState(1);
  
  // Essay submission state
  const [essayTitle, setEssayTitle] = useState("");
  const [essayContent, setEssayContent] = useState("");
  const [essayTone, setEssayTone] = useState("professional");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Style settings state
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generationTone, setGenerationTone] = useState("professional");
  const [wordCount, setWordCount] = useState(1000);
  
  // Humanization parameters
  const [typosPercentage, setTyposPercentage] = useState(1.0); // Default 1% typos
  const [grammarMistakesPercentage, setGrammarMistakesPercentage] = useState(1.0); // Default 1% grammar mistakes
  const [humanMisErrorsPercentage, setHumanMisErrorsPercentage] = useState(1.0); // Default 1% human mis-errors
  
  // Output state
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [contentRating, setContentRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  
  // Essay Viewer Content Component
type EssayViewerContentProps = {
  essayId: number;
};

function EssayViewerContent({ essayId }: EssayViewerContentProps) {
  const [editMode, setEditMode] = useState(false);
  const [editTone, setEditTone] = useState("");
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();
  
  // Fetch the full essay content
  const { 
    data: essay, 
    isLoading,
    isError
  } = useQuery({
    queryKey: [`/api/clone-me/essays/${essayId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/clone-me/essays/${essayId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch essay');
      }
      return response.json();
    },
  });

  // Update essay mutation
  const updateEssayMutation = useMutation({
    mutationFn: async (data: { tone: string, content?: string }) => {
      const response = await apiRequest('PATCH', `/api/clone-me/essays/${essayId}`, data);
      if (!response.ok) {
        throw new Error('Failed to update essay');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Essay updated",
        description: "The essay has been successfully updated."
      });
      setEditMode(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/clone-me/essays/${essayId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/clone-me/essays'] });
    },
    onError: (error) => {
      toast({ 
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Start edit mode with current tone and content
  const handleStartEdit = () => {
    if (essay) {
      setEditTone(essay.tone);
      setEditContent(essay.content);
      setEditMode(true);
    }
  };

  // Save changes
  const handleSaveChanges = () => {
    updateEssayMutation.mutate({ 
      tone: editTone,
      content: editContent 
    });
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !essay) {
    return (
      <div className="w-full py-4 text-center text-destructive">
        <p>Failed to load essay content. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {editMode ? (
            <Select value={editTone} onValueChange={setEditTone}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
                <SelectItem value="informative">Informative</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge>{essay.tone}</Badge>
          )}
          <span className="text-sm">{essay.wordCount} words</span>
        </div>
        <div>
          {editMode ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditMode(false)}
                disabled={updateEssayMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSaveChanges}
                disabled={updateEssayMutation.isPending}
              >
                {updateEssayMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Essay & Tone
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mt-2">
        {editMode ? (
          <Textarea 
            className="min-h-[300px] w-full" 
            value={editContent} 
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your essay content here..."
          />
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            {essay.content.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Button 
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(essay.content);
            toast({
              title: "Copied to clipboard",
              description: "Essay content has been copied to clipboard"
            });
          }}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
      </div>
    </div>
  );
}

// References
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch essays
  const { 
    data: essays = [], 
    isLoading: isLoadingEssays,
    refetch: refetchEssays
  } = useQuery<Essay[]>({
    queryKey: ['/api/clone-me/essays'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/clone-me/essays');
      if (!response.ok) {
        throw new Error('Failed to fetch essays');
      }
      return response.json();
    },
  });

  // Fetch writing style
  const {
    data: writingStyle,
    isLoading: isLoadingStyle,
    refetch: refetchStyle
  } = useQuery<WritingStyle | null>({
    queryKey: ['/api/clone-me/style'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/clone-me/style');
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch writing style');
      }
      return response.json();
    },
  });

  // Delete essay mutation
  const deleteEssayMutation = useMutation({
    mutationFn: async (essayId: number) => {
      const response = await apiRequest('DELETE', `/api/clone-me/essays/${essayId}`);
      if (!response.ok) {
        throw new Error('Failed to delete essay');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Essay Deleted",
        description: "The essay has been successfully deleted.",
      });
      refetchEssays();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Re-analyze essay mutation
  const reanalyzeEssayMutation = useMutation({
    mutationFn: async (essayId: number) => {
      const response = await apiRequest('POST', `/api/clone-me/essays/${essayId}/reanalyze`);
      if (!response.ok) {
        throw new Error('Failed to re-analyze essay');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Essay Re-analyzed",
        description: "The essay has been successfully re-analyzed.",
      });
      refetchEssays();
      refetchStyle();
    },
    onError: (error: Error) => {
      toast({
        title: "Re-analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Submit essay mutation
  const submitEssayMutation = useMutation({
    mutationFn: async (essay: EssaySubmission) => {
      setIsAnalyzing(true);
      setAnalysisProgress(10);
      
      // Simulate progressive analysis
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);
      
      // Submit the essay
      try {
        const response = await apiRequest('POST', '/api/clone-me/essays', essay);
        
        clearInterval(progressInterval);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to submit essay');
        }
        
        setAnalysisProgress(100);
        setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisProgress(0);
        }, 500);
        
        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setAnalysisProgress(0);
        setIsAnalyzing(false);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Essay Submitted",
        description: "Your essay has been successfully analyzed!",
        variant: "default",
      });
      // Clear form and refresh essays
      setEssayTitle("");
      setEssayContent("");
      refetchEssays();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate writing style mutation
  const generateStyleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/clone-me/style/generate');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate writing style');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Writing Style Generated",
        description: "Your writing style has been successfully analyzed!",
        variant: "default",
      });
      refetchStyle();
    },
    onError: (error: Error) => {
      toast({
        title: "Style Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (params: ContentGenerationParams) => {
      setGenerationProgress(10);
      
      // Simulate progressive generation
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 800);
      
      try {
        const response = await apiRequest('POST', '/api/clone-me/content/generate', params);
        
        clearInterval(progressInterval);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate content');
        }
        
        setGenerationProgress(100);
        setTimeout(() => setGenerationProgress(0), 500);
        
        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        throw error;
      }
    },
    onSuccess: (data: GeneratedContent) => {
      setGeneratedContent(data.content);
      setCurrentStep(3);
      toast({
        title: "Content Generated",
        description: "Your content has been generated in your unique writing style!",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ contentId, rating, feedback }: { contentId: number, rating: number, feedback: string }) => {
      const response = await apiRequest('POST', `/api/clone-me/content/${contentId}/feedback`, {
        rating,
        feedback
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit feedback');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Feedback Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setEssayContent(content);
      
      // Extract title from filename
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setEssayTitle(fileName);
    };
    
    // Handle different file types
    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
      // For PDFs, we'd ideally use a PDF parser library
      // For this demo, just use the filename as title and prompt user
      setEssayTitle(file.name.replace(/\.[^/.]+$/, ""));
      setEssayContent(""); // Clear content as we need PDF parsing library
      toast({
        title: "PDF Upload",
        description: "Please copy and paste the content from your PDF.",
        variant: "default",
      });
    } else if (file.type.includes('word')) {
      // For Word docs, we'd ideally use a Word parser library
      // For this demo, just use the filename as title and prompt user
      setEssayTitle(file.name.replace(/\.[^/.]+$/, ""));
      setEssayContent(""); // Clear content as we need Word parsing library
      toast({
        title: "Word Document Upload",
        description: "Please copy and paste the content from your document.",
        variant: "default",
      });
    }
  };

  // Reset file upload
  const resetFileUpload = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle essay submission
  const handleSubmitEssay = () => {
    if (!essayTitle || !essayContent) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for your essay.",
        variant: "destructive",
      });
      return;
    }
    
    submitEssayMutation.mutate({
      title: essayTitle,
      content: essayContent,
      tone: essayTone
    });
  };

  // Handle style generation
  const handleGenerateStyle = () => {
    if (essays.length === 0) {
      toast({
        title: "No Essays",
        description: "Please submit at least one essay before generating your writing style.",
        variant: "destructive",
      });
      return;
    }
    
    generateStyleMutation.mutate();
  };

  // Handle content generation
  const handleGenerateContent = () => {
    if (!generationPrompt) {
      toast({
        title: "Missing Prompt",
        description: "Please provide a prompt for content generation.",
        variant: "destructive",
      });
      return;
    }
    
    if (!writingStyle) {
      toast({
        title: "No Writing Style",
        description: "Please generate your writing style before generating content.",
        variant: "destructive",
      });
      return;
    }
    
    generateContentMutation.mutate({
      prompt: generationPrompt,
      tone: generationTone,
      wordCount,
      typosPercentage,
      grammarMistakesPercentage,
      humanMisErrorsPercentage
    });
  };

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
  
  // Copy functions
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

  // Render
  return (
    <div className="space-y-8">
      <Tabs defaultValue="process" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="process">Step-by-Step Process</TabsTrigger>
          <TabsTrigger value="essays">My Essays</TabsTrigger>
        </TabsList>
        
        <TabsContent value="process" className="space-y-4 mt-4">
          {/* Step 1: Essay Submission */}
          <div className={currentStep === 1 ? "" : "hidden"}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full inline-flex items-center justify-center mr-2 text-sm">1</span>
                  Submit Essay for Style Analysis
                </CardTitle>
                <CardDescription>
                  Provide an essay sample (500-1000 words) to analyze your writing style. Submit 3-5 samples for best results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="essay-title">Essay Title</Label>
                  <Input 
                    id="essay-title" 
                    placeholder="Enter a title for your essay" 
                    value={essayTitle}
                    onChange={(e) => setEssayTitle(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="essay-content">Essay Content</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="file-upload" className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm cursor-pointer hover:bg-secondary/80">
                        <Upload className="h-4 w-4" />
                        <span>Upload File</span>
                      </Label>
                      <input
                        type="file"
                        id="file-upload"
                        accept=".txt,.pdf,.docx,.doc"
                        className="hidden"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        disabled={isAnalyzing}
                      />
                      {uploadedFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetFileUpload}
                          disabled={isAnalyzing}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {uploadedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <File className="h-4 w-4" />
                      <span>{uploadedFile.name}</span>
                    </div>
                  )}
                  
                  <Textarea 
                    id="essay-content" 
                    placeholder="Paste or type your essay content here (500-1000 words)" 
                    className="min-h-[300px]"
                    value={essayContent}
                    onChange={(e) => setEssayContent(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="essay-tone">Essay Tone</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the tone that best matches this essay.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select 
                    value={essayTone} 
                    onValueChange={setEssayTone}
                    disabled={isAnalyzing}
                  >
                    <SelectTrigger id="essay-tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                      <SelectItem value="informative">Informative</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="polite">Polite</SelectItem>
                      <SelectItem value="firm">Firm</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="compassionate">Compassionate</SelectItem>
                      <SelectItem value="inspiring">Inspiring</SelectItem>
                      <SelectItem value="placatory">Placatory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Analyzing your writing style...</span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {essays.length} {essays.length === 1 ? 'essay' : 'essays'} submitted
                </div>
                <Button 
                  onClick={handleSubmitEssay} 
                  disabled={(!essayTitle || !essayContent) || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Submit Essay"
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generate Writing Style</CardTitle>
                  <CardDescription>
                    Once you've submitted enough essays, generate your unique writing style profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-1">Essays submitted: <Badge variant={essays.length > 0 ? "default" : "outline"}>{essays.length}</Badge></p>
                      <p className="text-sm text-muted-foreground">We recommend submitting 3-5 essays for best results</p>
                    </div>
                    <Button 
                      onClick={handleGenerateStyle} 
                      disabled={essays.length === 0 || generateStyleMutation.isPending}
                    >
                      {generateStyleMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : writingStyle ? "Update Style" : "Generate Style"}
                    </Button>
                  </div>
                  
                  {writingStyle && (
                    <div className="mt-4 p-3 bg-secondary/30 rounded-md">
                      <p className="text-sm font-medium">Your writing style is ready!</p>
                      <p className="text-xs text-muted-foreground mt-1">Last updated: {new Date(writingStyle.lastUpdated).toLocaleDateString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Step 2: Style Settings */}
          <div className={currentStep === 2 ? "" : "hidden"}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full inline-flex items-center justify-center mr-2 text-sm">2</span>
                  Adjust Style Settings
                </CardTitle>
                <CardDescription>
                  Customize the generation parameters to control the output content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="generation-prompt">What would you like to write about?</Label>
                  <Textarea 
                    id="generation-prompt" 
                    placeholder="Enter a detailed prompt describing what you want to write about" 
                    className="min-h-[100px]"
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="generation-tone">Tone</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select the tone for the generated content.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select 
                      value={generationTone} 
                      onValueChange={setGenerationTone}
                    >
                      <SelectTrigger id="generation-tone">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="persuasive">Persuasive</SelectItem>
                        <SelectItem value="informative">Informative</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="polite">Polite</SelectItem>
                        <SelectItem value="firm">Firm</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="compassionate">Compassionate</SelectItem>
                        <SelectItem value="inspiring">Inspiring</SelectItem>
                        <SelectItem value="placatory">Placatory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="word-count">Word Count: {wordCount}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Set the approximate word count for the generated content.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Slider
                      id="word-count"
                      min={100}
                      max={5000}
                      step={100}
                      value={[wordCount]}
                      onValueChange={(value) => setWordCount(value[0])}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>100</span>
                      <span>2500</span>
                      <span>5000</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-medium">Humanization Parameters</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>These settings control how "human-like" your content will appear. Higher values may help content appear less AI-generated but could reduce quality.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="typos">Typos: {typosPercentage}%</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Percentage of words that may contain typographical errors.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Slider
                        id="typos"
                        min={0}
                        max={15}
                        step={0.5}
                        value={[typosPercentage]}
                        onValueChange={(value) => setTyposPercentage(value[0])}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="grammar-mistakes">Grammar Mistakes: {grammarMistakesPercentage}%</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Percentage of sentences that may contain grammar errors.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Slider
                        id="grammar-mistakes"
                        min={0}
                        max={15}
                        step={0.5}
                        value={[grammarMistakesPercentage]}
                        onValueChange={(value) => setGrammarMistakesPercentage(value[0])}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="human-errors">Human Mis-errors: {humanMisErrorsPercentage}%</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Percentage of typical human errors like missing punctuation or incorrect word choices.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Slider
                        id="human-errors"
                        min={0}
                        max={15}
                        step={0.5}
                        value={[humanMisErrorsPercentage]}
                        onValueChange={(value) => setHumanMisErrorsPercentage(value[0])}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={handleGenerateContent}
                  disabled={!generationPrompt || !writingStyle || generateContentMutation.isPending}
                >
                  {generateContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    "Generate Content in My Style"
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {generateContentMutation.isPending && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating content in your writing style...</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
              </div>
            )}
          </div>
          
          {/* Step 3: Output Display */}
          <div className={currentStep === 3 ? "" : "hidden"}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full inline-flex items-center justify-center mr-2 text-sm">3</span>
                  Review Generated Content
                </CardTitle>
                <CardDescription>
                  Your content has been generated in your personal writing style. Review, edit, and download as needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {generatedContent ? (
                  <>
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                      <div 
                        ref={contentRef}
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, '<br />') }}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Text
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyFormattedText}
                        className="flex items-center gap-1"
                        disabled={exportLoading === 'formatted'}
                      >
                        {exportLoading === 'formatted' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        Copy Formatted
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAsPDF}
                        className="flex items-center gap-1"
                        disabled={exportLoading === 'pdf'}
                      >
                        {exportLoading === 'pdf' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAsWord}
                        className="flex items-center gap-1"
                        disabled={exportLoading === 'word'}
                      >
                        {exportLoading === 'word' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Word
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAsHTML}
                        className="flex items-center gap-1"
                        disabled={exportLoading === 'html'}
                      >
                        {exportLoading === 'html' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        HTML
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-md font-medium">Provide Feedback</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Rate the quality of the generated content to help improve future generations.
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              variant="ghost"
                              size="sm"
                              className={contentRating === rating ? "text-yellow-500" : "text-muted-foreground"}
                              onClick={() => setContentRating(rating)}
                            >
                              <Star className="h-6 w-6 fill-current" />
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
                        <Textarea 
                          id="feedback" 
                          placeholder="What did you like or dislike about the generated content?" 
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Content Generated Yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Go back to step 2 to generate content in your writing style.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setCurrentStep(2)}
                    >
                      Go to Content Generation
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {generatedContent && contentRating > 0 && (
                  <Button 
                    onClick={() => {
                      submitFeedbackMutation.mutate({
                        contentId: 1, // This would be the actual content ID in a real implementation
                        rating: contentRating,
                        feedback: feedbackText
                      });
                    }}
                    disabled={submitFeedbackMutation.isPending}
                    className="w-full"
                  >
                    {submitFeedbackMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
          
          {/* Step Navigation */}
          <StepNavigation
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            totalSteps={3}
            isNextDisabled={
              (currentStep === 1 && (!writingStyle || generateStyleMutation.isPending)) || 
              (currentStep === 2 && (!generationPrompt || generateContentMutation.isPending))
            }
          />
        </TabsContent>
        
        <TabsContent value="essays" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Essay Samples</CardTitle>
              <CardDescription>
                Essays you've submitted for writing style analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEssays ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : essays.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Essays Submitted Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Go to the Step-by-Step Process tab to submit your first essay for analysis.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setCurrentStep(1);
                      document.querySelector('[data-value="process"]')?.click();
                    }}
                  >
                    Submit an Essay
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {essays.map((essay) => (
                    <Card key={essay.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{essay.title}</h3>
                          <Badge>{essay.tone}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(essay.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {essay.wordCount} words
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Analyzed</span>
                        </div>
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Are you sure you want to re-analyze this essay? This will update the writing style assessment.")) {
                                    reanalyzeEssayMutation.mutate(essay.id);
                                  }
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Re-analyze
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this essay? This action cannot be undone.")) {
                                    deleteEssayMutation.mutate(essay.id);
                                  }
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                View Essay
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                              <DialogHeader>
                                <DialogTitle>{essay.title}</DialogTitle>
                              </DialogHeader>
                              <div className="flex-1 overflow-y-auto mt-4">
                                <EssayViewerContent essayId={essay.id} />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {essays.length} {essays.length === 1 ? 'essay' : 'essays'} submitted
                </span>
                {writingStyle && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Writing style analyzed</span>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}