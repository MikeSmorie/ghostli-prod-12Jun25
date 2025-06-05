import React, { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Upload, 
  FileText,
  Pencil,
  Trash,
  Eye,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  User
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

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

export default function CloneMe() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Essay submission state
  const [essayTitle, setEssayTitle] = useState("");
  const [essayContent, setEssayContent] = useState("");
  const [essayTone, setEssayTone] = useState("professional");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Writing style generation state
  const [styleGenerated, setStyleGenerated] = useState(false);
  const [lastStyleUpdate, setLastStyleUpdate] = useState<string | null>(null);

  // Fetch essays query
  const { data: essays = [], isLoading: essaysLoading } = useQuery({
    queryKey: ["/api/essays"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/essays");
      return response.json();
    },
  });

  // Fetch writing style query
  const { data: writingStyle } = useQuery({
    queryKey: ["/api/writing-style"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/writing-style");
      return response.json();
    },
  });

  // Submit essay mutation
  const submitEssayMutation = useMutation({
    mutationFn: async (essay: EssaySubmission) => {
      setIsAnalyzing(true);
      setAnalysisProgress(10);
      
      const response = await apiRequest("POST", "/api/essays", essay);
      setAnalysisProgress(50);
      
      const result = await response.json();
      setAnalysisProgress(100);
      
      return result;
    },
    onSuccess: () => {
      setAnalysisProgress(0);
      setIsAnalyzing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/essays"] });
      
      // Reset form
      setEssayTitle("");
      setEssayContent("");
      setEssayTone("professional");
      setUploadedFile(null);
      
      toast({
        title: "Essay Submitted Successfully",
        description: "Your writing sample has been analyzed and added to your profile.",
      });
    },
    onError: (error: any) => {
      setAnalysisProgress(0);
      setIsAnalyzing(false);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit essay. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate writing style mutation
  const generateStyleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/writing-style/generate");
      return response.json();
    },
    onSuccess: () => {
      setStyleGenerated(true);
      setLastStyleUpdate(new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: ["/api/writing-style"] });
      
      toast({
        title: "Writing Style Profile Updated",
        description: "Your personalized writing style has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Style Generation Failed",
        description: error.message || "Failed to generate writing style. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete essay mutation
  const deleteEssayMutation = useMutation({
    mutationFn: async (essayId: number) => {
      await apiRequest("DELETE", `/api/essays/${essayId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/essays"] });
      toast({
        title: "Essay Deleted",
        description: "The essay has been removed from your profile.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete essay. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setEssayContent(content);
        setEssayTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension
      };
      reader.readAsText(file);
    }
  };

  const handleSubmitEssay = () => {
    if (!essayTitle.trim() || !essayContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for your essay.",
        variant: "destructive",
      });
      return;
    }

    submitEssayMutation.mutate({
      title: essayTitle.trim(),
      content: essayContent.trim(),
      tone: essayTone,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Clone Me — Personalized Writing Style Generator</h1>
            <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
              Submit writing samples to create a personalized writing profile. Use your unique style for all AI-generated content.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Submit Essay Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Upload className="h-5 w-5 mr-2" />
                  Submit Writing Sample
                </CardTitle>
                <CardDescription>
                  Upload or paste your writing to build your personalized style profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Upload File (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                    {uploadedFile && (
                      <span className="text-sm text-foreground/70">
                        {uploadedFile.name}
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Essay Title */}
                <div className="space-y-2">
                  <Label htmlFor="essay-title">Title</Label>
                  <Input
                    id="essay-title"
                    placeholder="Enter essay title..."
                    value={essayTitle}
                    onChange={(e) => setEssayTitle(e.target.value)}
                  />
                </div>

                {/* Essay Content */}
                <div className="space-y-2">
                  <Label htmlFor="essay-content">Content</Label>
                  <Textarea
                    id="essay-content"
                    placeholder="Paste or type your writing sample here..."
                    value={essayContent}
                    onChange={(e) => setEssayContent(e.target.value)}
                    className="min-h-[200px]"
                  />
                  {essayContent && (
                    <p className="text-xs text-foreground/70">
                      Word count: {essayContent.split(/\s+/).filter(word => word.length > 0).length}
                    </p>
                  )}
                </div>

                {/* Essay Tone */}
                <div className="space-y-2">
                  <Label>Writing Tone</Label>
                  <Select value={essayTone} onValueChange={setEssayTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitEssay}
                  disabled={isAnalyzing || !essayTitle.trim() || !essayContent.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Writing Style...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Writing Sample
                    </>
                  )}
                </Button>

                {/* Analysis Progress */}
                {isAnalyzing && analysisProgress > 0 && (
                  <div className="space-y-2">
                    <Progress value={analysisProgress} className="h-2" />
                    <p className="text-xs text-center text-foreground/70">
                      {analysisProgress < 100 ? "Analyzing your writing style..." : "Finalizing analysis..."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Writing Style */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Writing Style Profile
                </CardTitle>
                <CardDescription>
                  Create your personalized writing style from submitted samples
                </CardDescription>
              </CardHeader>
              <CardContent>
                {writingStyle && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Writing Style Profile Active
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Last updated: {formatDate(writingStyle.lastUpdated)}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Based on {writingStyle.essayCount} writing samples
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => generateStyleMutation.mutate()}
                  disabled={generateStyleMutation.isPending || essays.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {generateStyleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Style...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {writingStyle ? "Update Writing Style" : "Generate Writing Style"}
                    </>
                  )}
                </Button>

                {essays.length === 0 && (
                  <p className="text-sm text-foreground/70 mt-2 text-center">
                    Submit at least one writing sample to generate your style profile
                  </p>
                )}

                {writingStyle && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/content-generator-new")}
                      className="w-full"
                    >
                      Test Style in Content Generator
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* My Essays Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <User className="h-5 w-5 mr-2" />
                  My Writing Samples
                </CardTitle>
                <CardDescription>
                  Manage your submitted writing samples ({essays.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {essaysLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-foreground/70">Loading essays...</p>
                  </div>
                ) : essays.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
                    <p className="text-foreground/70 mb-2">No writing samples yet</p>
                    <p className="text-sm text-foreground/60">
                      Submit your first writing sample to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {essays.map((essay: Essay) => (
                      <Card key={essay.id} className="border border-gray-200 dark:border-gray-700">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground mb-1">
                                {essay.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-foreground/70">
                                <span>{essay.wordCount} words</span>
                                <Badge variant="outline">{essay.tone}</Badge>
                                <span>{formatDate(essay.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // View essay logic would go here
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Edit essay logic would go here
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEssayMutation.mutate(essay.id)}
                                disabled={deleteEssayMutation.isPending}
                              >
                                {deleteEssayMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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
      </div>
    </div>
  );
}