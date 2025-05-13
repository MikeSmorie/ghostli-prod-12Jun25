import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WritingBriefForm } from './writing-brief-form';
import { ProWritingBrief } from './pro-writing-brief';
import { FeatureGuard } from './feature-guard';
import { FEATURES } from '@/hooks/use-feature-flags';

interface WritingBriefToggleProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

/**
 * Component for toggling between Lite and Pro writing brief interfaces
 */
export function WritingBriefToggle({ onSubmit, isSubmitting }: WritingBriefToggleProps) {
  const [activeTab, setActiveTab] = useState("lite");
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="w-full">
      <Tabs
        defaultValue="lite"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="lite">Lite Brief</TabsTrigger>
            <TabsTrigger value="pro">Pro Brief</TabsTrigger>
          </TabsList>
        </div>
        
        {activeTab === "lite" ? (
          <WritingBriefForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
        ) : (
          <FeatureGuard 
            feature={FEATURES.ADVANCED_HUMANIZATION}
            showUpgradeInfo
            fallback={
              <div className="mb-6">
                <WritingBriefForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
              </div>
            }
          >
            <ProWritingBrief onSubmit={onSubmit} isSubmitting={isSubmitting} />
          </FeatureGuard>
        )}
      </Tabs>
    </div>
  );
}