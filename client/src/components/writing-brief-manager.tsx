import React from "react";
import { WritingBriefToggle } from "./writing-brief-toggle";

interface WritingBriefManagerProps {
  onSubmit: (params: any) => void;
  isSubmitting: boolean;
}

export function WritingBriefManager({ onSubmit, isSubmitting }: WritingBriefManagerProps) {
  // Use the toggle component which handles all the logic for showing
  // either Pro or Lite forms based on user access and preference
  return (
    <WritingBriefToggle 
      onSubmit={onSubmit} 
      isSubmitting={isSubmitting} 
    />
  );
}