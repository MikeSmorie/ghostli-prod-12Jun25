import React, { useState } from "react";
import { ProWritingBrief } from "./pro-writing-brief";
import { LiteWritingBrief } from "./lite-writing-brief";
import { useFeature } from "@/hooks/use-feature-flags";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";

interface WritingBriefToggleProps {
  onSubmit: (params: any) => void;
  isSubmitting: boolean;
}

export function WritingBriefToggle({ onSubmit, isSubmitting }: WritingBriefToggleProps) {
  const { hasAccess: hasProAccess } = useFeature("proWritingBrief");
  const { hasAccess: hasLiteAccess } = useFeature("liteWritingBrief");
  
  // Default to Lite mode if user doesn't have Pro access
  // or Pro mode if user has Pro access but not Lite access
  const [usePro, setUsePro] = useState(hasProAccess && !hasLiteAccess);
  
  // If neither feature is accessible, don't render anything
  if (!hasProAccess && !hasLiteAccess) {
    return null;
  }
  
  // If user only has access to one form type, show that with an inactive toggle
  if (hasProAccess && !hasLiteAccess) {
    return (
      <>
        <Card className="mb-2 p-2 flex items-center justify-end bg-gray-50 dark:bg-gray-900 border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-4">
            <Label 
              htmlFor="form-toggle-disabled" 
              className="text-muted-foreground cursor-not-allowed"
            >
              Quick Brief
            </Label>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex items-center">
                    <Switch
                      id="form-toggle-disabled"
                      checked={true}
                      disabled
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your current subscription only includes Detailed Brief</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Label 
              htmlFor="form-toggle-disabled" 
              className="font-medium text-blue-600 dark:text-blue-400"
            >
              Detailed Brief
            </Label>
          </div>
        </Card>
        <ProWritingBrief onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </>
    );
  }
  
  if (!hasProAccess && hasLiteAccess) {
    return (
      <>
        <Card className="mb-2 p-2 flex items-center justify-end bg-gray-50 dark:bg-gray-900 border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-4">
            <Label 
              htmlFor="form-toggle-disabled" 
              className="font-medium text-blue-600 dark:text-blue-400"
            >
              Quick Brief
            </Label>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex items-center">
                    <Switch
                      id="form-toggle-disabled"
                      checked={false}
                      disabled
                    />
                    <Lock className="absolute -right-6 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upgrade to Pro to access Detailed Brief</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Label 
              htmlFor="form-toggle-disabled" 
              className="text-muted-foreground cursor-not-allowed"
            >
              Detailed Brief
            </Label>
          </div>
        </Card>
        <LiteWritingBrief onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </>
    );
  }
  
  // User has access to both, show the toggle
  return (
    <>
      <Card className="mb-2 p-2 flex items-center justify-end bg-gray-50 dark:bg-gray-900 border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-4">
          <Label 
            htmlFor="form-toggle" 
            className={`cursor-pointer ${!usePro ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}
          >
            Quick Brief
          </Label>
          
          <Switch
            id="form-toggle"
            checked={usePro}
            onCheckedChange={setUsePro}
          />
          
          <Label 
            htmlFor="form-toggle" 
            className={`cursor-pointer ${usePro ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}
          >
            Detailed Brief
          </Label>
        </div>
      </Card>
      
      {usePro ? (
        <ProWritingBrief onSubmit={onSubmit} isSubmitting={isSubmitting} />
      ) : (
        <LiteWritingBrief onSubmit={onSubmit} isSubmitting={isSubmitting} />
      )}
    </>
  );
}