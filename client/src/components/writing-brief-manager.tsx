import React from "react";
import { ProWritingBrief } from "./pro-writing-brief";
import { LiteWritingBrief } from "./lite-writing-brief";
import { useFeature } from "@/hooks/use-feature-flags";

interface WritingBriefManagerProps {
  onSubmit: (params: any) => void;
  isSubmitting: boolean;
}

export function WritingBriefManager({ onSubmit, isSubmitting }: WritingBriefManagerProps) {
  const { hasAccess: hasProAccess } = useFeature("proWritingBrief");
  const { hasAccess: hasLiteAccess } = useFeature("liteWritingBrief");
  
  // If neither feature is accessible, don't render anything
  if (!hasProAccess && !hasLiteAccess) {
    return null;
  }
  
  // Pro brief takes precedence if the user has access to both
  if (hasProAccess) {
    return <ProWritingBrief onSubmit={onSubmit} isSubmitting={isSubmitting} />;
  }
  
  // Fall back to Lite brief
  return <LiteWritingBrief onSubmit={onSubmit} isSubmitting={isSubmitting} />;
}