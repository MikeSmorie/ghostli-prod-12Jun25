import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  HelpCircle,
  Info as InfoIcon,
  KeySquare,
  X,
  Plus,
  BookMarked,
  Library,
  Globe,
  BookOpen
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Feature tab components
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
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
        <TabsTrigger value="professional">Professional</TabsTrigger>
      </TabsList>
      
      {/* BASIC TAB - Essential features */}
      <TabsContent value="basic" className="mt-4 space-y-6">
        {/* Anti-AI Detection Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="antiAIDetection" className="text-base font-semibold">Anti-AI Detection</Label>
            <Switch
              id="antiAIDetection"
              checked={antiAIDetection}
              onCheckedChange={setAntiAIDetection}
            />
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800 text-sm">
          <p className="font-bold mb-1 text-yellow-800 dark:text-yellow-400">IMPORTANT:</p>
          <p>Our anti-AI detection system ensures your content is completely undetectable by third parties or Google as AI-written. This is a core feature of the GhostliAI system.</p>
          <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800">
            <p className="font-semibold text-yellow-700 dark:text-yellow-500 text-xs">Mode Selection:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
              <li><span className="font-semibold">Speed Mode:</span> Faster generation with standard AI detection evasion (1 pass)</li>
              <li><span className="font-semibold">Undetectable Mode:</span> Maximum humanization with 3 processing passes for complete AI-detection evasion (takes 2-3x longer)</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-1 pb-2 px-2 border rounded-md">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium flex items-center">
                  Mode <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] p-3">
                <p className="mb-2"><strong>Speed vs. Undetectable:</strong></p>
                <p className="mb-2"><strong>Speed:</strong> Faster generation with standard anti-AI detection (good for drafts).</p>
                <p><strong>Undetectable:</strong> Maximum humanization with multiple passes for AI detection evasion (slower but more secure).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center">
            <span className={`text-xs mr-2 ${!prioritizeUndetectable ? 'font-bold' : 'text-gray-500'}`}>Speed</span>
            <Switch
              id="priorityMode"
              checked={prioritizeUndetectable}
              onCheckedChange={setPrioritizeUndetectable}
            />
            <span className={`text-xs ml-2 ${prioritizeUndetectable ? 'font-bold' : 'text-gray-500'}`}>Undetectable</span>
          </div>
        </div>
        
        {/* Language Options */}
        <div className="mt-4 bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800 text-sm">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400">Language Options</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <HelpCircle className="h-3 w-3 text-blue-600 dark:text-blue-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3">
                  <p className="mb-1"><strong>English Variant:</strong></p>
                  <p>Select whether to use American English (US) or British English (UK) spelling, vocabulary, and expressions.</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                    <li><strong>US:</strong> color, center, analyze, program, apartment</li>
                    <li><strong>UK:</strong> colour, centre, analyse, programme, flat</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center">
            <span className={`text-xs mr-2 ${englishVariant === 'us' ? 'font-bold' : 'text-gray-500'}`}>American English</span>
            <Switch
              id="englishVariant"
              checked={englishVariant === 'uk'}
              onCheckedChange={(checked) => setEnglishVariant(checked ? 'uk' : 'us')}
            />
            <span className={`text-xs ml-2 ${englishVariant === 'uk' ? 'font-bold' : 'text-gray-500'}`}>British English</span>
          </div>
        </div>
        
        {/* Humanization Parameters - Only shown when Anti-AI Detection is enabled */}
        {antiAIDetection && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-md border border-purple-200 dark:border-purple-800">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-400">Humanization Parameters</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <AlertTriangle className="h-3 w-3 text-purple-600 dark:text-purple-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3">
                  <p className="mb-1"><strong>Humanization Parameters:</strong></p>
                  <p className="mb-1">These sliders control the percentage of human-like imperfections added to the generated content.</p>
                  <p className="mb-1"><strong>Typos:</strong> Spelling mistakes and typographical errors.</p>
                  <p className="mb-1"><strong>Grammar Mistakes:</strong> Minor grammatical issues like missing commas, wrong tense, etc.</p>
                  <p className="mb-1"><strong>Human Mis-errors:</strong> Natural inconsistencies like punctuation variations or word choice errors.</p>
                  <p className="text-xs italic">Higher percentages make content appear more human-written but may impact readability.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-4 mt-3">
            {/* Typos Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="typos" className="text-xs">Typos: {typosPercentage.toFixed(1)}%</Label>
                <span className="text-xs text-gray-500">0-5%</span>
              </div>
              <Slider
                id="typos"
                min={0}
                max={5}
                step={0.1}
                value={[typosPercentage]}
                onValueChange={(value) => setTyposPercentage(value[0])}
                className="py-1"
              />
            </div>
            
            {/* Grammar Mistakes Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="grammar" className="text-xs">Grammar Mistakes: {grammarMistakesPercentage.toFixed(1)}%</Label>
                <span className="text-xs text-gray-500">0-5%</span>
              </div>
              <Slider
                id="grammar"
                min={0}
                max={5}
                step={0.1}
                value={[grammarMistakesPercentage]}
                onValueChange={(value) => setGrammarMistakesPercentage(value[0])}
                className="py-1"
              />
            </div>
            
            {/* Human Mis-errors Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="humanErrors" className="text-xs">Human Mis-errors: {humanMisErrorsPercentage.toFixed(1)}%</Label>
                <span className="text-xs text-gray-500">0-5%</span>
              </div>
              <Slider
                id="humanErrors"
                min={0}
                max={5}
                step={0.1}
                value={[humanMisErrorsPercentage]}
                onValueChange={(value) => setHumanMisErrorsPercentage(value[0])}
                className="py-1"
              />
            </div>
          </div>
        </div>
        )}
      </TabsContent>
      
      {/* ADVANCED TAB - More sophisticated options */}
      <TabsContent value="advanced" className="mt-4 space-y-6">
        {/* Website Scanning Options */}
        <div className="bg-cyan-50 dark:bg-cyan-950/30 p-3 rounded-md border border-cyan-200 dark:border-cyan-800 text-sm">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-bold text-cyan-800 dark:text-cyan-400">Website Scanning</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <HelpCircle className="h-3 w-3 text-cyan-600 dark:text-cyan-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3">
                  <p className="mb-1"><strong>Website Scanning:</strong></p>
                  <p className="mb-1">Analyze an existing website to generate content similar to it or based on it.</p>
                  <p className="mb-1"><strong>Copy Style:</strong> Mimics the tone and style of the website</p>
                  <p className="mb-1"><strong>Use Content:</strong> Extracts information from the website to use in generation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-3">
            <Input
              id="websiteUrl"
              placeholder="Enter website URL (e.g., https://example.com)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="h-8 text-sm"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="copyWebsiteStyle" 
                  checked={copyWebsiteStyle} 
                  onCheckedChange={(checked) => setCopyWebsiteStyle(checked === true)}
                  disabled={!websiteUrl} 
                />
                <Label htmlFor="copyWebsiteStyle" className={`text-xs ${!websiteUrl ? 'text-gray-400' : ''}`}>
                  Copy website style & tone
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="useWebsiteContent" 
                  checked={useWebsiteContent} 
                  onCheckedChange={(checked) => setUseWebsiteContent(checked === true)}
                  disabled={!websiteUrl} 
                />
                <Label htmlFor="useWebsiteContent" className={`text-xs ${!websiteUrl ? 'text-gray-400' : ''}`}>
                  Use website content
                </Label>
              </div>
            </div>
            
            {websiteUrl && (
              <div className="text-xs text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-md">
                <p className="flex items-center">
                  <InfoIcon className="h-3 w-3 mr-1 inline" />
                  {copyWebsiteStyle && useWebsiteContent 
                    ? "Will analyze and copy both style and content from the website." 
                    : copyWebsiteStyle 
                      ? "Will analyze and copy only the writing style from the website." 
                      : useWebsiteContent 
                        ? "Will extract and use information from the website." 
                        : "Website URL provided but no scanning options selected."}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* FEATURE 1: Keyword Control Options */}
        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-bold text-green-800 dark:text-green-400">Keyword Frequency Controls</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <KeySquare className="h-3 w-3 text-green-600 dark:text-green-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3">
                  <p className="mb-1"><strong>Keyword Frequency Controls:</strong></p>
                  <p className="mb-1">Specify keywords and the minimum number of times they should appear in the generated content.</p>
                  <p className="mb-1">This is particularly useful for SEO content or ensuring specific terms are adequately represented.</p>
                  <p className="text-xs italic">The system will naturally incorporate these keywords while maintaining readability.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Display added keywords */}
          {requiredKeywords.length > 0 ? (
            <div className="mb-3 space-y-2">
              {requiredKeywords.map((kw, index) => (
                <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-md border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <KeySquare className="h-3 w-3 mr-2 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium">{kw.keyword}</span>
                    <Badge variant="outline" className="ml-2 text-xs">Min: {kw.occurrences}x</Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => removeKeyword(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-700 dark:text-green-400 mb-3">No keywords added yet. Add keywords below.</p>
          )}
          
          {/* Add keyword form */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  placeholder="Enter keyword or phrase"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2 h-full">
                  <Label htmlFor="occurrences" className="whitespace-nowrap text-xs">Min occurrences:</Label>
                  <Input
                    id="occurrences"
                    type="number"
                    min={1}
                    max={20}
                    value={newOccurrences}
                    onChange={(e) => setNewOccurrences(parseInt(e.target.value) || 1)}
                    className="h-8 text-sm w-16"
                  />
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs flex items-center justify-center"
              onClick={addKeyword}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Keyword
            </Button>
          </div>
        </div>
        
        {/* FEATURE 4: Regional Focus */}
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-md border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-400">Regional/Geographic Focus</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <Globe className="h-3 w-3 text-indigo-600 dark:text-indigo-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3">
                  <p className="mb-1"><strong>Regional/Geographic Focus:</strong></p>
                  <p className="mb-1">Target your content to a specific geographic region.</p>
                  <p className="mb-1">This setting influences:</p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>Statistics and data chosen from that region</li>
                    <li>Cultural references appropriate to the area</li>
                    <li>Regional trends and market conditions</li>
                    <li>Local terminology and expressions</li>
                  </ul>
                  <p className="text-xs italic mt-1">Particularly useful for localizing content or targeting regional audiences.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-3">
            <Input
              placeholder="Enter region (e.g., North America, Europe, Asia-Pacific, or specific country)"
              value={regionFocus}
              onChange={(e) => setRegionFocus(e.target.value)}
              className="h-8 text-sm"
            />
            
            {regionFocus && (
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-md text-xs text-indigo-800 dark:text-indigo-400">
                <InfoIcon className="h-3 w-3 inline mr-1" />
                Content will be tailored with statistics, examples, and references relevant to <strong>{regionFocus}</strong>.
              </div>
            )}
          </div>
        </div>
      </TabsContent>
      
      {/* PROFESSIONAL TAB - Advanced academic and citation features */}
      <TabsContent value="professional" className="mt-4 space-y-6">
        {/* FEATURE 2: Source Selection */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400">Required Source Selection</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <BookMarked className="h-3 w-3 text-blue-600 dark:text-blue-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3">
                  <p className="mb-1"><strong>Required Source Selection:</strong></p>
                  <p className="mb-1">Specify sources that must be cited or referenced in the generated content.</p>
                  <p className="mb-1">You can specify a priority level (1-5) for each source:</p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>1 = Lowest priority, minimal inclusion</li>
                    <li>3 = Medium priority, moderate inclusion</li>
                    <li>5 = Highest priority, extensive citation</li>
                  </ul>
                  <p className="text-xs italic mt-1">Priority affects how heavily the source will be referenced in the content.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox 
              id="restrictToRequiredSources" 
              checked={restrictToRequiredSources} 
              onCheckedChange={(checked) => setRestrictToRequiredSources(checked === true)}
            />
            <Label htmlFor="restrictToRequiredSources" className="text-xs">
              Only use provided sources (no external references)
            </Label>
          </div>
          
          {/* Display added sources */}
          {requiredSources.length > 0 ? (
            <div className="mb-3 space-y-2">
              {requiredSources.map((src, index) => (
                <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center">
                    <BookOpen className="h-3 w-3 mr-2 text-blue-600 dark:text-blue-400" />
                    <div>
                      <span className="text-sm font-medium">{src.source}</span>
                      {src.url && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[200px]">{src.url}</div>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">Priority: {src.priority}</Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => removeSource(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">No required sources added yet. Add sources below.</p>
          )}
          
          {/* Add source form */}
          <div className="space-y-2">
            <Input
              placeholder="Source name (e.g., Journal name, Book title, Website name)"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              placeholder="URL (optional, e.g., https://example.com)"
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="flex items-center space-x-4">
              <Label htmlFor="priority" className="whitespace-nowrap text-xs">Priority level:</Label>
              <div className="flex-1">
                <Slider
                  id="priority"
                  min={1}
                  max={5}
                  step={1}
                  value={[newPriority]}
                  onValueChange={(value) => setNewPriority(value[0])}
                  className="py-1"
                />
              </div>
              <span className="text-xs font-medium">{newPriority}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs flex items-center justify-center"
              onClick={addSource}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Source
            </Button>
          </div>
        </div>
        
        {/* FEATURE 3: Bibliography Generation */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Bibliography Generation</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help">
                    <Library className="h-3 w-3 text-amber-600 dark:text-amber-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3">
                  <p className="mb-1"><strong>Bibliography Generation:</strong></p>
                  <p className="mb-1">Generate a formal bibliography for academic or professional content.</p>
                  <p className="mb-1">When enabled, citations for all sources will be properly formatted in a references section.</p>
                  <p className="mb-1"><strong>Footnotes Option:</strong> Add numbered references within the text that correspond to the bibliography.</p>
                  <p className="text-xs italic mt-1">This feature adds significant credibility to academic and professional content.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="generateBibliography" 
                checked={generateBibliography} 
                onCheckedChange={(checked) => setGenerateBibliography(checked === true)}
              />
              <Label htmlFor="generateBibliography" className="text-sm">
                Generate bibliography
              </Label>
            </div>
            
            {generateBibliography && (
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox 
                  id="useFootnotes" 
                  checked={useFootnotes} 
                  onCheckedChange={(checked) => setUseFootnotes(checked === true)}
                />
                <Label htmlFor="useFootnotes" className="text-xs">
                  Add footnotes in the content that reference the bibliography
                </Label>
              </div>
            )}
            
            {generateBibliography && (
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-md text-xs text-amber-800 dark:text-amber-400">
                <InfoIcon className="h-3 w-3 inline mr-1" />
                {useFootnotes 
                  ? "Content will include numbered footnotes with a full bibliography at the end."
                  : "A bibliography will be generated but without in-text citations."}
              </div>
            )}
          </div>
        </div>
        
        {/* Additional advanced options */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
          <h3 className="text-sm font-bold mb-2">Professional Content Options</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="technicalAccuracy" 
                checked={technicalAccuracy} 
                onCheckedChange={(checked) => setTechnicalAccuracy(checked === true)}
              />
              <Label htmlFor="technicalAccuracy" className="text-sm">
                Prioritize technical accuracy
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeCitations" 
                checked={includeCitations} 
                onCheckedChange={(checked) => setIncludeCitations(checked === true)}
              />
              <Label htmlFor="includeCitations" className="text-sm">
                Include in-text citations
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="legalCompliance" 
                checked={legalCompliance} 
                onCheckedChange={(checked) => setLegalCompliance(checked === true)}
              />
              <Label htmlFor="legalCompliance" className="text-sm">
                Ensure legal/regulatory compliance
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="checkDuplication" 
                checked={checkDuplication} 
                onCheckedChange={(checked) => setCheckDuplication(checked === true)}
              />
              <Label htmlFor="checkDuplication" className="text-sm">
                Check for duplicate content
              </Label>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}