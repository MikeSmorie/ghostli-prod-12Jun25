import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Info, ExternalLink, RefreshCw, Shield, BookOpen, Edit, Quote } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Simplify and avoid date-fns dependency for now
const formatTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  } catch (e) {
    return "recently";
  }
};

interface MatchedSource {
  source: string | null;
  url: string | null;
  matchedText: string;
  matchPercentage: number;
  startPosition: number;
  endPosition: number;
  suggestedCitation?: string;
  suggestedRephrase?: string;
}

interface PlagiarismReportProps {
  isPlagiarized: boolean;
  score: number;
  checkedTimestamp: string;
  matchedSources: MatchedSource[];
  onRephrase?: (source: MatchedSource) => void;
  onAddCitation?: (source: MatchedSource) => void;
  onRerunCheck?: () => void;
}

export function PlagiarismReport({
  isPlagiarized,
  score,
  checkedTimestamp,
  matchedSources,
  onRephrase,
  onAddCitation,
  onRerunCheck
}: PlagiarismReportProps) {
  // Format the timestamp to show how long ago it was checked
  const timeAgo = formatTimeAgo(checkedTimestamp);
  
  return (
    <Card className={isPlagiarized ? "border-amber-500" : "border-green-500"}>
      <CardHeader className={isPlagiarized ? "bg-amber-50 dark:bg-amber-950/20" : "bg-green-50 dark:bg-green-950/20"}>
        <div className="flex items-center gap-2">
          {isPlagiarized ? (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          ) : (
            <Check className="h-5 w-5 text-green-500" />
          )}
          <CardTitle className="text-lg">
            {isPlagiarized ? "Potential Plagiarism Detected" : "Plagiarism Check: Passed"}
          </CardTitle>
        </div>
        <CardDescription>
          Plagiarism score: {score.toFixed(1)}% - Checked {timeAgo}
        </CardDescription>
        
        {/* Progress bar showing plagiarism score */}
        <div className="mt-2">
          <div className="flex justify-between mb-1 text-xs">
            <span>Original</span>
            <span>Potentially Plagiarized</span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="w-full">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className={`h-2.5 rounded-full ${score > 50 ? 'bg-red-600' : score > 30 ? 'bg-amber-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {isPlagiarized && matchedSources.length > 0 ? (
          <>
            <h3 className="text-md font-medium mb-4 flex items-center gap-2">
              <Info className="h-4 w-4" />
              {matchedSources.length} {matchedSources.length === 1 ? 'source' : 'sources'} flagged for review
            </h3>
            
            <Accordion type="single" collapsible className="border rounded-lg">
              {matchedSources.map((source, index) => (
                <AccordionItem key={index} value={`source-${index}`}>
                  <AccordionTrigger className="hover:bg-muted/50 px-4">
                    <div className="flex items-center gap-2 text-left">
                      <span className="font-medium">
                        {source.source || "Unknown Source"} 
                      </span>
                      <Badge variant="outline" className="ml-2">
                        {source.matchPercentage.toFixed(1)}% match
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Matched text */}
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Matched Text:</p>
                        <p className="italic border-l-2 border-primary/30 pl-3 py-1">"{source.matchedText}"</p>
                      </div>
                      
                      {/* Source info */}
                      {source.url && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {source.url}
                          </a>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        {onRephrase && (
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => onRephrase(source)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Rephrase Content
                          </Button>
                        )}
                        
                        {onAddCitation && (
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => onAddCitation(source)}
                          >
                            <Quote className="h-4 w-4 mr-2" />
                            Add Citation
                          </Button>
                        )}
                      </div>
                      
                      {/* Suggestions */}
                      {(source.suggestedRephrase || source.suggestedCitation) && (
                        <div className="mt-4 space-y-3">
                          {source.suggestedRephrase && (
                            <div>
                              <p className="font-medium text-sm mb-1">Suggested Rephrasing:</p>
                              <p className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-900">
                                {source.suggestedRephrase}
                              </p>
                            </div>
                          )}
                          
                          {source.suggestedCitation && (
                            <div>
                              <p className="font-medium text-sm mb-1">Suggested Citation:</p>
                              <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-900">
                                {source.suggestedCitation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        ) : isPlagiarized ? (
          <div className="text-center py-4">
            <div className="mb-4">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            </div>
            <h3 className="text-lg font-medium">Potential plagiarism detected</h3>
            <p className="text-muted-foreground mt-2">
              Our system detected similarities to existing content, but no specific sources could be identified.
              Consider reviewing and revising your content to ensure originality.
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="mb-4">
              <Shield className="h-12 w-12 text-green-500 mx-auto" />
            </div>
            <h3 className="text-lg font-medium">No plagiarism detected</h3>
            <p className="text-muted-foreground mt-2">
              Your content appears to be original and doesn't contain any significant matches to existing content.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3 bg-muted/50 border-t">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={onRerunCheck}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Check Again
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Run another plagiarism check on the content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          <span>
            Pro feature: Plagiarism detection uses advanced AI to analyze content against online sources.
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}