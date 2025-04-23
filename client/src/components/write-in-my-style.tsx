import React from "react";
import { AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WriteInMyStyleProps {
  usePersonalStyle: boolean;
  setUsePersonalStyle: (value: boolean) => void;
}

export function WriteInMyStyle({ usePersonalStyle, setUsePersonalStyle }: WriteInMyStyleProps) {
  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950/50 dark:to-blue-950/50 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mr-2">Write in My Style</h3>
              <span className="bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded-full">Premium Feature</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Clone your unique writing style for truly personalized content generation
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between md:justify-end space-x-3 bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg border border-purple-100 dark:border-purple-900">
          <button 
            type="button"
            onClick={() => {/* Navigate to Clone Me page */}}
            className="text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-md flex items-center"
          >
            <span className="mr-1">?</span> How It Works
          </button>
          
          <div className="flex items-center space-x-2">
            <span className={!usePersonalStyle ? "font-medium" : "text-gray-500"}>Off</span>
            <Switch
              id="usePersonalStyle"
              checked={usePersonalStyle}
              onCheckedChange={setUsePersonalStyle}
              className="data-[state=checked]:bg-purple-700"
            />
            <span className={usePersonalStyle ? "font-medium" : "text-gray-500"}>On</span>
          </div>
        </div>
      </div>
      
      {/* Help Tooltip */}
      <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded border border-purple-100 dark:border-purple-800 text-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4 text-purple-700 dark:text-purple-400" />
          </div>
          <div className="ml-2">
            <p className="font-medium text-purple-900 dark:text-purple-300">How to use "Write in My Style":</p>
            <ol className="list-decimal pl-5 mt-1 space-y-1 text-gray-700 dark:text-gray-300">
              <li>First, go to the <strong>Clone Me</strong> section and submit at least 3 essays (your previous writings)</li>
              <li>Wait for the system to analyze and generate your personal writing style profile</li>
              <li>Return here and toggle this switch to <strong>ON</strong> to write new content in your personal style</li>
            </ol>
            <p className="mt-2 text-xs italic text-gray-600 dark:text-gray-400">Your personal style will influence tone, vocabulary, sentence structure, and other writing characteristics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}