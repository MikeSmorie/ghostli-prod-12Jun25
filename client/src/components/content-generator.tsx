import { useState } from "react";
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

  const { toast } = useToast();

  // Content generation mutation
  const { mutate, isLoading } = useMutation<GenerationResult, Error, GenerationParams>({
    mutationFn: async (params) => {
      try {
        const response = await apiRequest("POST", "/api/generate-content", params);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate content");
        }
        return response.json();
      } catch (error: any) {
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
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
                      <SelectItem value="sage">Sage</SelectItem>
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="outlaw">Outlaw</SelectItem>
                      <SelectItem value="explorer">Explorer</SelectItem>
                      <SelectItem value="creator">Creator</SelectItem>
                      <SelectItem value="ruler">Ruler</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                      <SelectItem value="innocent">Innocent</SelectItem>
                      <SelectItem value="everyman">Everyman</SelectItem>
                      <SelectItem value="jester">Jester</SelectItem>
                      <SelectItem value="lover">Lover</SelectItem>
                      <SelectItem value="magician">Magician</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="wordCount">Word Count: {wordCount}</Label>
                    <span className="text-sm text-gray-500">50-1000</span>
                  </div>
                  <Slider
                    id="wordCount"
                    min={50}
                    max={1000}
                    step={50}
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
                        <div className="whitespace-pre-wrap font-medium">{generatedContent}</div>
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
                        <Button variant="outline" className="justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export as PDF
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export as Word
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export as HTML
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Formatted
                        </Button>
                        <Button variant="outline" className="justify-start">
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