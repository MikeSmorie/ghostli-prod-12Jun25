import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WriteInMyStyleProps {
  usePersonalStyle: boolean;
  setUsePersonalStyle: (value: boolean) => void;
}

export function WriteInMyStyle({ usePersonalStyle, setUsePersonalStyle }: WriteInMyStyleProps) {
  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30">
      <CardContent className="p-4 flex items-start space-x-4">
        <div className="flex-shrink-0 p-2 mt-1 bg-blue-100 dark:bg-blue-900/50 rounded-full">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Write in My Style</h3>
              <Badge variant="outline" className="font-normal text-xs flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Premium Feature
              </Badge>
            </div>
            <Switch
              checked={usePersonalStyle}
              onCheckedChange={setUsePersonalStyle}
            />
          </div>
          
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
            Let the AI learn your unique writing style and apply it to generated content.
          </p>
          
          {usePersonalStyle && (
            <div className="mt-3 p-3 bg-white/60 dark:bg-gray-900/40 rounded border border-blue-200 dark:border-blue-800 text-sm">
              <p className="mb-2 font-medium flex items-center text-blue-900 dark:text-blue-300">
                <Upload className="h-4 w-4 mr-1" />
                Upload Writing Samples
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                For best results, upload 3+ samples of your writing (essays, articles, blog posts) 
                so the AI can accurately learn your style.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 italic">
                Contact support to enable this feature on your account.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}