import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ArrowLeft, 
  RefreshCw,
  Clock,
  Eye,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

interface DetectionResult {
  service: string;
  humanPercentage: number;
  aiPercentage: number;
  result: 'PASS' | 'FAIL';
  rawResponse?: any;
}

interface ShieldRun {
  id: number;
  contentText: string;
  overallResult: 'PASS' | 'FAIL';
  createdAt: string;
  detectionMetadata?: {
    results: DetectionResult[];
  };
}

export default function AIShieldPage() {
  const [, navigate] = useLocation();
  const [content, setContent] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get URL parameters for content and runId
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contentParam = urlParams.get('content');
    const runIdParam = urlParams.get('runId');
    
    if (contentParam) {
      setContent(decodeURIComponent(contentParam));
    }
    if (runIdParam) {
      setSelectedRunId(parseInt(runIdParam));
    }
  }, []);

  // Fetch detection history
  const { data: history } = useQuery({
    queryKey: ["/api/ai-detection/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ai-detection/history");
      return await res.json();
    }
  });

  // Fetch specific detection run
  const { data: selectedRun } = useQuery({
    queryKey: ["/api/ai-detection/run", selectedRunId],
    queryFn: async () => {
      if (!selectedRunId) return null;
      const res = await apiRequest("GET", `/api/ai-detection/run/${selectedRunId}`);
      return await res.json();
    },
    enabled: !!selectedRunId
  });

  // Run detection mutation
  const runDetectionMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/ai-detection/run", { content: text });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Detection Complete",
        description: `Shield scan completed with ${data.data.overallResult} result`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-detection/history"] });
      setSelectedRunId(data.data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Detection Failed",
        description: error.message || "Failed to run AI detection",
        variant: "destructive"
      });
    }
  });

  // Re-run detection mutation
  const rerunDetectionMutation = useMutation({
    mutationFn: async (runId: number) => {
      const res = await apiRequest("POST", `/api/ai-detection/rerun/${runId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Re-scan Complete",
        description: `Shield re-scan completed with ${data.data.overallResult} result`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-detection/history"] });
      setSelectedRunId(data.data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Re-scan Failed",
        description: error.message || "Failed to re-run detection",
        variant: "destructive"
      });
    }
  });

  const handleRunDetection = () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please enter content to analyze",
        variant: "destructive"
      });
      return;
    }
    runDetectionMutation.mutate(content);
  };

  const handleRerun = (runId: number) => {
    rerunDetectionMutation.mutate(runId);
  };

  const currentRun = selectedRun?.data || null;
  const detectionResults = currentRun?.detectionMetadata?.results || [];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/content-generator-new")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content Generator
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">AI Detection Shield</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Input & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
              <CardDescription>
                Enter or paste content to check for AI detection across multiple services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your generated content here to run AI detection analysis..."
                className="min-h-[200px]"
              />
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleRunDetection}
                  disabled={runDetectionMutation.isPending || !content.trim()}
                  className="flex items-center gap-2"
                >
                  {runDetectionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Run AI Detection Shield
                </Button>
                {currentRun && (
                  <Button
                    variant="outline"
                    onClick={() => handleRerun(currentRun.id)}
                    disabled={rerunDetectionMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {rerunDetectionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Re-run Shield
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detection Results */}
          {currentRun && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Detection Results
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={currentRun.overallResult === 'PASS' ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      {currentRun.overallResult === 'PASS' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {currentRun.overallResult}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(currentRun.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {detectionResults.map((result: DetectionResult, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{result.service}</h4>
                      <Badge 
                        variant={result.result === 'PASS' ? 'default' : 'destructive'}
                        className="flex items-center gap-1"
                      >
                        {result.result === 'PASS' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {result.result}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Detected as Human:</span>
                        <span className="font-medium text-green-600">
                          {result.humanPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={result.humanPercentage} 
                        className="h-2" 
                      />
                      
                      <div className="flex justify-between text-sm">
                        <span>Detected as AI:</span>
                        <span className="font-medium text-red-600">
                          {result.aiPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={result.aiPercentage} 
                        className="h-2" 
                      />
                    </div>

                    {result.rawResponse?.mock && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                        Mock data - API key not configured for {result.service}
                      </div>
                    )}
                  </div>
                ))}

                {detectionResults.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No detection results available
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detection History Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Shield Runs</CardTitle>
              <CardDescription>
                Previous AI detection scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history?.data?.length > 0 ? (
                <div className="space-y-3">
                  {history.data.slice(0, 10).map((run: ShieldRun) => (
                    <div 
                      key={run.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRunId === run.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedRunId(run.id);
                        setContent(run.contentText);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant={run.overallResult === 'PASS' ? 'default' : 'destructive'}
                        >
                          {run.overallResult}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(run.createdAt), "MMM d")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {run.contentText.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No shield runs yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shield Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How Shield Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>The AI Detection Shield scans your content using multiple detection services:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>GPTZero - Industry standard AI detection</li>
                <li>ZeroGPT - Alternative AI analysis</li>
                <li>Copyleaks - Professional verification</li>
              </ul>
              <p>Results show PASS if AI detection is below 20% threshold.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}