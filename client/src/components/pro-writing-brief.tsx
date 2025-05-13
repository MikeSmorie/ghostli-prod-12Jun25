import React from "react";
import { EnhancedWritingBrief } from "./enhanced-writing-brief";

interface ProWritingBriefProps {
  onSubmit: (params: any) => void;
  isSubmitting: boolean;
}

export function ProWritingBrief({ onSubmit, isSubmitting }: ProWritingBriefProps) {
  return (
    <EnhancedWritingBrief
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  );
}