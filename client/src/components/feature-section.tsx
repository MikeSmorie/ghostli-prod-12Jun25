import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureTabs } from "./ui/content-tabs";

interface FeatureSectionProps {
  // Anti-AI Detection props
  antiAIDetection: boolean;
  setAntiAIDetection: (value: boolean) => void;
  prioritizeUndetectable: boolean;
  setPrioritizeUndetectable: (value: boolean) => void;
  
  // Language options
  englishVariant: 'us' | 'uk';
  setEnglishVariant: (value: 'us' | 'uk') => void;
  
  // Humanization parameters
  typosPercentage: number;
  setTyposPercentage: (value: number) => void;
  grammarMistakesPercentage: number;
  setGrammarMistakesPercentage: (value: number) => void;
  humanMisErrorsPercentage: number;
  setHumanMisErrorsPercentage: (value: number) => void;
  
  // Website scanning options
  websiteUrl: string;
  setWebsiteUrl: (value: string) => void;
  copyWebsiteStyle: boolean;
  setCopyWebsiteStyle: (value: boolean) => void;
  useWebsiteContent: boolean;
  setUseWebsiteContent: (value: boolean) => void;
  
  // Keyword control options
  requiredKeywords: {keyword: string, occurrences: number}[];
  setRequiredKeywords: (value: {keyword: string, occurrences: number}[]) => void;
  newKeyword: string;
  setNewKeyword: (value: string) => void;
  newOccurrences: number;
  setNewOccurrences: (value: number) => void;
  addKeyword: () => void;
  removeKeyword: (index: number) => void;
  
  // Source control options
  requiredSources: {source: string, url: string, priority: number}[];
  setRequiredSources: (value: {source: string, url: string, priority: number}[]) => void;
  newSource: string;
  setNewSource: (value: string) => void;
  newSourceUrl: string;
  setNewSourceUrl: (value: string) => void;
  newPriority: number;
  setNewPriority: (value: number) => void;
  restrictToRequiredSources: boolean;
  setRestrictToRequiredSources: (value: boolean) => void;
  addSource: () => void;
  removeSource: (index: number) => void;
  
  // Bibliography options
  generateBibliography: boolean;
  setGenerateBibliography: (value: boolean) => void;
  useFootnotes: boolean;
  setUseFootnotes: (value: boolean) => void;
  
  // Regional focus
  regionFocus: string;
  setRegionFocus: (value: string) => void;
  
  // Professional options
  includeCitations: boolean;
  setIncludeCitations: (value: boolean) => void;
  technicalAccuracy: boolean;
  setTechnicalAccuracy: (value: boolean) => void;
  legalCompliance: boolean;
  setLegalCompliance: (value: boolean) => void;
  checkDuplication: boolean;
  setCheckDuplication: (value: boolean) => void;
}

export function FeatureSection({
  // Anti-AI Detection props
  antiAIDetection,
  setAntiAIDetection,
  prioritizeUndetectable,
  setPrioritizeUndetectable,
  
  // Language options
  englishVariant,
  setEnglishVariant,
  
  // Humanization parameters
  typosPercentage,
  setTyposPercentage,
  grammarMistakesPercentage,
  setGrammarMistakesPercentage,
  humanMisErrorsPercentage,
  setHumanMisErrorsPercentage,
  
  // Website scanning options
  websiteUrl,
  setWebsiteUrl,
  copyWebsiteStyle,
  setCopyWebsiteStyle,
  useWebsiteContent,
  setUseWebsiteContent,
  
  // Keyword control options
  requiredKeywords,
  setRequiredKeywords,
  newKeyword,
  setNewKeyword,
  newOccurrences,
  setNewOccurrences,
  addKeyword,
  removeKeyword,
  
  // Source control options
  requiredSources,
  setRequiredSources,
  newSource,
  setNewSource,
  newSourceUrl,
  setNewSourceUrl,
  newPriority,
  setNewPriority,
  restrictToRequiredSources,
  setRestrictToRequiredSources,
  addSource,
  removeSource,
  
  // Bibliography options
  generateBibliography,
  setGenerateBibliography,
  useFootnotes,
  setUseFootnotes,
  
  // Regional focus
  regionFocus,
  setRegionFocus,
  
  // Professional options
  includeCitations,
  setIncludeCitations,
  technicalAccuracy,
  setTechnicalAccuracy,
  legalCompliance,
  setLegalCompliance,
  checkDuplication,
  setCheckDuplication,
}: FeatureSectionProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-bold mb-4">Content Generation Options</h3>
        <FeatureTabs
          // Anti-AI Detection props
          antiAIDetection={antiAIDetection}
          setAntiAIDetection={setAntiAIDetection}
          prioritizeUndetectable={prioritizeUndetectable}
          setPrioritizeUndetectable={setPrioritizeUndetectable}
          
          // Language options
          englishVariant={englishVariant}
          setEnglishVariant={setEnglishVariant}
          
          // Humanization parameters
          typosPercentage={typosPercentage}
          setTyposPercentage={setTyposPercentage}
          grammarMistakesPercentage={grammarMistakesPercentage}
          setGrammarMistakesPercentage={setGrammarMistakesPercentage}
          humanMisErrorsPercentage={humanMisErrorsPercentage}
          setHumanMisErrorsPercentage={setHumanMisErrorsPercentage}
          
          // Website scanning options
          websiteUrl={websiteUrl}
          setWebsiteUrl={setWebsiteUrl}
          copyWebsiteStyle={copyWebsiteStyle}
          setCopyWebsiteStyle={setCopyWebsiteStyle}
          useWebsiteContent={useWebsiteContent}
          setUseWebsiteContent={setUseWebsiteContent}
          
          // Keyword control options
          requiredKeywords={requiredKeywords}
          setRequiredKeywords={setRequiredKeywords}
          newKeyword={newKeyword}
          setNewKeyword={setNewKeyword}
          newOccurrences={newOccurrences}
          setNewOccurrences={setNewOccurrences}
          addKeyword={addKeyword}
          removeKeyword={removeKeyword}
          
          // Source control options
          requiredSources={requiredSources}
          setRequiredSources={setRequiredSources}
          newSource={newSource}
          setNewSource={setNewSource}
          newSourceUrl={newSourceUrl}
          setNewSourceUrl={setNewSourceUrl}
          newPriority={newPriority}
          setNewPriority={setNewPriority}
          restrictToRequiredSources={restrictToRequiredSources}
          setRestrictToRequiredSources={setRestrictToRequiredSources}
          addSource={addSource}
          removeSource={removeSource}
          
          // Bibliography options
          generateBibliography={generateBibliography}
          setGenerateBibliography={setGenerateBibliography}
          useFootnotes={useFootnotes}
          setUseFootnotes={setUseFootnotes}
          
          // Regional focus
          regionFocus={regionFocus}
          setRegionFocus={setRegionFocus}
          
          // Professional options
          includeCitations={includeCitations}
          setIncludeCitations={setIncludeCitations}
          technicalAccuracy={technicalAccuracy}
          setTechnicalAccuracy={setTechnicalAccuracy}
          legalCompliance={legalCompliance}
          setLegalCompliance={setLegalCompliance}
          checkDuplication={checkDuplication}
          setCheckDuplication={setCheckDuplication}
        />
      </CardContent>
    </Card>
  );
}