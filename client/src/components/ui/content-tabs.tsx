import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Card, CardContent } from "./card";
import { Label } from "./label";
import { Switch } from "./switch";
import { Input } from "./input";
import { Slider } from "./slider";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { HelpCircle, KeySquare, X, Plus, BookMarked, Library, Globe } from "lucide-react";
import { Badge } from "./badge";

interface FeatureTabsProps {
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

export function FeatureTabs({
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
}: FeatureTabsProps) {
  return (
    <Tabs defaultValue="basic">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
        <TabsTrigger value="professional">Professional</TabsTrigger>
      </TabsList>
      
      {/* BASIC TAB */}
      <TabsContent value="basic">
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Anti-AI Detection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="antiAIDetection" className="font-medium">Anti-AI Detection</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          <HelpCircle className="h-3 w-3 text-gray-500" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Makes the generated content undetectable by AI detection systems</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="antiAIDetection"
                  checked={antiAIDetection}
                  onCheckedChange={setAntiAIDetection}
                />
              </div>
              
              {antiAIDetection && (
                <div className="ml-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="prioritizeUndetectable" className="text-sm">Prioritize undetectability</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <HelpCircle className="h-3 w-3 text-gray-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Prioritize undetectability over generation speed. This may increase generation time but will produce more human-like content.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      id="prioritizeUndetectable"
                      checked={prioritizeUndetectable}
                      onCheckedChange={setPrioritizeUndetectable}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* English Variant */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="englishVariant" className="font-medium">English Variant</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choose between American or British English</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="us-english"
                    name="englishVariant"
                    checked={englishVariant === 'us'}
                    onChange={() => setEnglishVariant('us')}
                    className="text-primary"
                  />
                  <Label htmlFor="us-english">US English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="uk-english"
                    name="englishVariant"
                    checked={englishVariant === 'uk'}
                    onChange={() => setEnglishVariant('uk')}
                    className="text-primary"
                  />
                  <Label htmlFor="uk-english">UK English</Label>
                </div>
              </div>
            </div>
            
            {/* Humanization Parameters */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Label className="font-medium">Humanization Parameters</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Adjust parameters to make content appear more human-written</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-4 ml-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="typosPercentage">Typos: {typosPercentage.toFixed(1)}%</Label>
                    <span className="text-xs text-gray-500">0-15%</span>
                  </div>
                  <Slider
                    id="typosPercentage"
                    min={0}
                    max={15}
                    step={0.1}
                    value={[typosPercentage]}
                    onValueChange={(value) => setTyposPercentage(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="grammarMistakesPercentage">Grammar Mistakes: {grammarMistakesPercentage.toFixed(1)}%</Label>
                    <span className="text-xs text-gray-500">0-15%</span>
                  </div>
                  <Slider
                    id="grammarMistakesPercentage"
                    min={0}
                    max={15}
                    step={0.1}
                    value={[grammarMistakesPercentage]}
                    onValueChange={(value) => setGrammarMistakesPercentage(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="humanMisErrorsPercentage">Human Mis-errors: {humanMisErrorsPercentage.toFixed(1)}%</Label>
                    <span className="text-xs text-gray-500">0-15%</span>
                  </div>
                  <Slider
                    id="humanMisErrorsPercentage"
                    min={0}
                    max={15}
                    step={0.1}
                    value={[humanMisErrorsPercentage]}
                    onValueChange={(value) => setHumanMisErrorsPercentage(value[0])}
                  />
                </div>
              </div>
            </div>
            
            {/* Website Scanning */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Label className="font-medium">Website Scanning</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Scan a website to extract content or copy its style</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-3 ml-2">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="websiteUrl"
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="copyWebsiteStyle">Copy Website Style/Tone</Label>
                  <Switch
                    id="copyWebsiteStyle"
                    checked={copyWebsiteStyle}
                    onCheckedChange={setCopyWebsiteStyle}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="useWebsiteContent">Extract Website Content</Label>
                  <Switch
                    id="useWebsiteContent"
                    checked={useWebsiteContent}
                    onCheckedChange={setUseWebsiteContent}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* ADVANCED TAB */}
      <TabsContent value="advanced">
        <Card>
          <CardContent className="p-4 space-y-6">
            {/* Keyword Frequency Control - FEATURE 1 */}
            <div className="border-b pb-4">
              <div className="flex items-center space-x-2 mb-3">
                <KeySquare className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-400">Keyword Frequency Control</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Set minimum occurrence requirements for specific keywords in your content</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {requiredKeywords.map((item, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                      {item.keyword} ({item.occurrences}x)
                      <button 
                        onClick={() => removeKeyword(index)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {requiredKeywords.length === 0 && (
                    <span className="text-gray-500 text-sm italic">No keywords added yet</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 w-40">
                    <Label htmlFor="newOccurrences" className="whitespace-nowrap">Min. occurrences:</Label>
                    <Input
                      id="newOccurrences"
                      type="number"
                      min={1}
                      max={100}
                      value={newOccurrences}
                      onChange={(e) => setNewOccurrences(parseInt(e.target.value) || 1)}
                      className="w-16"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={addKeyword}
                    disabled={!newKeyword.trim()}
                    className="whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Source Selection Control - FEATURE 2 */}
            <div className="border-b pb-4">
              <div className="flex items-center space-x-2 mb-3">
                <Library className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-400">Required Source Selection</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Specify sources that must be used in content generation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {requiredSources.map((item, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                      {item.source} (Priority: {item.priority})
                      <button 
                        onClick={() => removeSource(index)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {requiredSources.length === 0 && (
                    <span className="text-gray-500 text-sm italic">No sources added yet</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Source name"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2 w-40">
                      <Label htmlFor="newPriority" className="whitespace-nowrap">Priority (1-5):</Label>
                      <Input
                        id="newPriority"
                        type="number"
                        min={1}
                        max={5}
                        value={newPriority}
                        onChange={(e) => setNewPriority(parseInt(e.target.value) || 1)}
                        className="w-16"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Source URL (optional)"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      size="sm" 
                      onClick={addSource}
                      disabled={!newSource.trim()}
                      className="whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Source
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="restrictToRequiredSources" className="text-sm">
                    Use only specified sources
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help">
                            <HelpCircle className="h-3 w-3 text-gray-500 inline" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">When enabled, content will only use information from the sources you've specified</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Switch
                    id="restrictToRequiredSources"
                    checked={restrictToRequiredSources}
                    onCheckedChange={setRestrictToRequiredSources}
                  />
                </div>
              </div>
            </div>
            
            {/* Bibliography Generation - FEATURE 3 */}
            <div className="border-b pb-4">
              <div className="flex items-center space-x-2 mb-3">
                <BookMarked className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-400">Bibliography Generation</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Generate a bibliography for your content</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="generateBibliography">Generate Bibliography</Label>
                  <Switch
                    id="generateBibliography"
                    checked={generateBibliography}
                    onCheckedChange={setGenerateBibliography}
                  />
                </div>
                
                {generateBibliography && (
                  <div className="flex items-center justify-between ml-6">
                    <Label htmlFor="useFootnotes">Use Footnotes</Label>
                    <Switch
                      id="useFootnotes"
                      checked={useFootnotes}
                      onCheckedChange={setUseFootnotes}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Regional Focus - FEATURE 4 */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-400">Regional/Geographic Focus</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Focus your content on a specific region or country</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-3">
                <Select value={regionFocus} onValueChange={setRegionFocus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific region</SelectItem>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="eu">European Union</SelectItem>
                    <SelectItem value="australia">Australia</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="africa">Africa</SelectItem>
                    <SelectItem value="latam">Latin America</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
                
                <p className="text-sm text-gray-500">
                  The system will include relevant regional data, statistics, references, and cultural context for your selected region.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* PROFESSIONAL TAB */}
      <TabsContent value="professional">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">Scientific & Academic Options</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Advanced options for scientific and academic content</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-3 ml-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeCitations">Include Citations</Label>
                  <Switch
                    id="includeCitations"
                    checked={includeCitations}
                    onCheckedChange={setIncludeCitations}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="technicalAccuracy">Technical Accuracy</Label>
                  <Switch
                    id="technicalAccuracy"
                    checked={technicalAccuracy}
                    onCheckedChange={setTechnicalAccuracy}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">Legal & Compliance</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <HelpCircle className="h-3 w-3 text-gray-500" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Options for legal compliance and content checking</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-3 ml-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="legalCompliance">Legal Compliance</Label>
                  <Switch
                    id="legalCompliance"
                    checked={legalCompliance}
                    onCheckedChange={setLegalCompliance}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="checkDuplication">Check for Duplication</Label>
                  <Switch
                    id="checkDuplication"
                    checked={checkDuplication}
                    onCheckedChange={setCheckDuplication}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}