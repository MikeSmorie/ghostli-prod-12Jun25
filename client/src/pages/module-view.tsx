import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DownloadIcon,
  CopyIcon,
  HelpCircleIcon,
  FileIcon,
  FileTextIcon,
  CheckIcon,
  CheckCircleIcon,
  SettingsIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PencilIcon,
  SaveIcon,
  ClockIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface ModuleViewProps {
  moduleId?: string;
}

// Tone options with descriptions
const TONE_OPTIONS = [
  { value: "professional", label: "Professional", description: "Formal and business-appropriate language suitable for corporate environments." },
  { value: "casual", label: "Casual", description: "Relaxed, conversational language for everyday communication." },
  { value: "academic", label: "Academic", description: "Formal, scholarly language with technical terminology and citations." },
  { value: "enthusiastic", label: "Enthusiastic", description: "Energetic, positive language with excitement and passion." },
  { value: "authoritative", label: "Authoritative", description: "Confident, decisive language that establishes expertise and credibility." },
];

// Brand Archetype options with descriptions
const ARCHETYPE_OPTIONS = [
  { value: "innocent", label: "Innocent", description: "Optimistic and pure. Values simplicity, goodness, and nostalgia." },
  { value: "explorer", label: "Explorer", description: "Independent and adventurous. Values freedom, authenticity, and discovery." },
  { value: "sage", label: "Sage", description: "Thoughtful and analytical. Values knowledge, intelligence, and truth." },
  { value: "hero", label: "Hero", description: "Courageous and determined. Values mastery, strength, and overcoming challenges." },
  { value: "outlaw", label: "Outlaw", description: "Disruptive and revolutionary. Values liberation, counterculture, and rebellion." },
  { value: "magician", label: "Magician", description: "Visionary and transformative. Values power, innovation, and making dreams reality." },
  { value: "ruler", label: "Ruler", description: "Commanding and structured. Values control, stability, and leadership." },
  { value: "caregiver", label: "Caregiver", description: "Nurturing and supportive. Values compassion, generosity, and protection." },
  { value: "creator", label: "Creator", description: "Artistic and inventive. Values imagination, expression, and originality." },
  { value: "lover", label: "Lover", description: "Passionate and emotional. Values relationships, beauty, and sensory experiences." },
  { value: "jester", label: "Jester", description: "Playful and spontaneous. Values humor, joy, and living in the moment." },
  { value: "everyman", label: "Everyman", description: "Relatable and approachable. Values belonging, equality, and common sense." },
];

export default function ModuleView({ moduleId }: ModuleViewProps) {
  const params = useParams();
  const id = moduleId || params.id;
  const { toast } = useToast();
  
  // User data state
  const [email, setEmail] = useState(localStorage.getItem('user_email') || "");
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('user_phone') || "");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [country, setCountry] = useState<string>(localStorage.getItem('user_country') || "");
  
  // Content parameters
  const [inputValue, setInputValue] = useState("");
  const [tone, setTone] = useState<string>("");
  const [archetype, setArchetype] = useState<string>("");
  const [targetWordCount, setTargetWordCount] = useState<number>(500);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMetadata, setGenerationMetadata] = useState<{
    wordCount: number;
    iterationCount: number;
    processingTimeMs: number;
  } | null>(null);
  
  // Output and verification state
  const [outputResult, setOutputResult] = useState("");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [isVerified, setIsVerified] = useState(localStorage.getItem('user_verified') === 'true');
  const [isCopied, setIsCopied] = useState({
    html: false,
    formatted: false,
    plaintext: false
  });
  
  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Check for dark mode on component mount and whenever it might change
  useEffect(() => {
    // Check if the system prefers dark mode
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Also check if the document has a dark class or data-theme attribute
    const updateTheme = () => {
      const isDark = 
        darkModeMediaQuery.matches || 
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark';
      
      setIsDarkMode(isDark);
    };
    
    // Initial check
    updateTheme();
    
    // Set up listeners
    darkModeMediaQuery.addEventListener('change', updateTheme);
    
    // Clean up
    return () => darkModeMediaQuery.removeEventListener('change', updateTheme);
  }, []);

  // Validation functions
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setEmailError(isValid ? "" : "Please enter a valid email address");
    return isValid;
  };

  const validatePhone = (value: string): boolean => {
    // Only validate the numeric part of the phone number (exclude country code + and spaces)
    const numericPart = value.replace(/[^0-9]/g, '');
    // Check if it has at least 8 digits (common minimum length for most countries)
    const isValid = numericPart.length >= 8;
    setPhoneError(isValid ? "" : "Please enter a valid phone number with at least 8 digits");
    return isValid;
  };

  const validateAndProceed = () => {
    const isEmailValid = validateEmail(email);
    // For phone validation, extract just the numeric part
    const numericPhone = phoneNumber.replace(/[^0-9]/g, '');
    const isPhoneValid = validatePhone(numericPhone);
    
    if (isEmailValid && isPhoneValid) {
      // Show verification dialog
      setShowVerificationDialog(true);
    } else {
      // Show validation failure toast
      if (!isEmailValid) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
      }
      
      if (!isPhoneValid) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid phone number with country code.",
          variant: "destructive"
        });
      }
    }
  };

  // Simulate verification and save to localStorage
  const simulateVerification = () => {
    // Save verification status and user data to localStorage
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_phone', phoneNumber);
    localStorage.setItem('user_verified', 'true');
    localStorage.setItem('user_country', country);
    
    setShowVerificationDialog(false);
    setIsVerified(true);
    toast({
      title: "Verification successful",
      description: "Your account has been verified.",
    });
  };

  // Process input and generate content
  const processInput = async () => {
    if (!isVerified) {
      toast({
        title: "Verification required",
        description: "Please verify your email and phone number first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!inputValue.trim()) {
      toast({
        title: "Content prompt required",
        description: "Please enter a content prompt before generating.",
        variant: "destructive"
      });
      return;
    }
    
    if (!tone) {
      toast({
        title: "Tone selection required",
        description: "Please select a content tone before generating.",
        variant: "destructive"
      });
      return;
    }
    
    if (!archetype) {
      toast({
        title: "Brand archetype required",
        description: "Please select a brand archetype before generating.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Request parameters
      const requestBody = {
        prompt: inputValue,
        tone: tone,
        archetype: archetype,
        targetWordCount: targetWordCount
      };
      
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Set the output result
      setOutputResult(data.content);
      
      // Set metadata
      setGenerationMetadata({
        wordCount: data.metadata.wordCount,
        iterationCount: data.metadata.iterationCount,
        processingTimeMs: data.metadata.processingTimeMs
      });
      
      // Switch to output module
      setActiveModule('output');
      
      toast({
        title: "Content generation successful",
        description: `Generated ${data.metadata.wordCount} words in ${(data.metadata.processingTimeMs / 1000).toFixed(1)}s`,
      });
    } catch (error) {
      toast({
        title: "Content generation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      console.error("Content generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Output format handlers
  const downloadAsPDF = () => {
    toast({
      title: "Download started",
      description: "Your PDF is being prepared for download.",
    });
    // In a real app, this would generate and download a PDF
  };

  const downloadAsDocx = () => {
    toast({
      title: "Download started",
      description: "Your Word document is being prepared for download.",
    });
    // In a real app, this would generate and download a DOCX
  };

  const downloadAsHTML = () => {
    toast({
      title: "Download started",
      description: "Your HTML file is being prepared for download.",
    });
    // In a real app, this would generate and download HTML
  };

  const copyToClipboard = (type: 'html' | 'formatted' | 'plaintext') => {
    navigator.clipboard.writeText(outputResult);
    
    // Show copied state
    setIsCopied({...isCopied, [type]: true});
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsCopied({...isCopied, [type]: false});
    }, 2000);
    
    toast({
      title: "Copied to clipboard",
      description: `Content has been copied as ${type}.`,
    });
  };

  // State to track active module
  const [activeModule, setActiveModule] = useState<string>('verification');

  // Function to switch between modules
  const switchModule = (moduleName: string) => {
    setActiveModule(moduleName);
  };

  // Helper to determine if module section should be shown
  const shouldShowModule = (moduleName: string) => {
    // Allow showing content parameters only after verification
    if (moduleName === 'parameters' && !isVerified) {
      return false;
    }
    // Allow showing generated content only if there's output
    if (moduleName === 'output' && !outputResult) {
      return false;
    }
    return activeModule === moduleName;
  };

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-4">WriteRIGHT-01/OM-7 Content Generator</h2>
      
      <div className="instruction bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-6">
        This advanced content generation tool creates tailored content based on your preferences and brand identity. Follow the steps in the navigation menu to generate your content.
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Navigation Stack */}
        <div className="w-full md:w-64 flex-shrink-0">
          <Card className="sticky top-4">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Navigation</h3>
              <div className="space-y-2">
                <Button 
                  variant={activeModule === 'verification' ? 'default' : 'outline'} 
                  className="w-full justify-start"
                  onClick={() => switchModule('verification')}
                >
                  <CheckCircleIcon className={`h-4 w-4 mr-2 ${isVerified ? 'text-green-500' : ''}`} />
                  User Verification
                  {isVerified && <CheckIcon className="h-4 w-4 ml-2 text-green-500" />}
                </Button>
                
                <Button 
                  variant={activeModule === 'parameters' ? 'default' : 'outline'} 
                  className="w-full justify-start"
                  onClick={() => switchModule('parameters')}
                  disabled={!isVerified}
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Content Parameters
                </Button>
                
                {outputResult && (
                  <Button 
                    variant={activeModule === 'output' ? 'default' : 'outline'} 
                    className="w-full justify-start"
                    onClick={() => switchModule('output')}
                  >
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Generated Content
                  </Button>
                )}
              </div>
              
              {/* Module Info Card */}
              <div className="mt-8 p-4 border border-blue-200 dark:border-blue-800 rounded-md">
                <h4 className="text-sm font-medium mb-2">Module Information</h4>
                <p className="text-xs">
                  <strong>Module ID:</strong> {id}
                </p>
                <p className="text-xs">
                  <strong>Status:</strong> Active
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-grow">
          {/* Module 1: User Verification Section */}
          {shouldShowModule('verification') && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">User Verification</h3>
                
                <div className="space-y-4">
                  {/* Email field with validation */}
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="font-medium">Email Address</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircleIcon className="h-4 w-4 ml-2 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Your email will be used for verification and to receive your generated content.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => validateEmail(email)}
                      className={`w-full ${emailError ? 'border-red-500' : ''}`}
                      placeholder="your.email@example.com"
                    />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </div>
                  
                  {/* Phone field with validation and country code */}
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="font-medium">Phone Number</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircleIcon className="h-4 w-4 ml-2 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Your phone number will be used for verification purposes only. The country code will be automatically populated based on your selection.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className={`${phoneError ? 'border-red-500 rounded-md' : ''}`}>
                      <PhoneInput
                        country={country || 'us'} // Use stored country or default to US
                        value={phoneNumber}
                        onChange={(phone, countryData: any) => {
                          // Always store the full phone number including + sign
                          setPhoneNumber(phone);
                          setPhoneError('');
                          setCountry(countryData?.countryCode || "");
                        }}
                        onBlur={() => validatePhone(phoneNumber.replace(/[^0-9]/g, ''))}
                        inputClass="w-full"
                        containerClass="w-full"
                        buttonStyle={{ 
                          background: isDarkMode ? 'var(--background, #1f2937)' : 'var(--background, #ffffff)', 
                          borderColor: isDarkMode ? 'rgb(75, 85, 99)' : 'rgb(209, 213, 219)'
                        }}
                        inputStyle={{ 
                          width: "100%", 
                          borderRadius: "0.375rem", 
                          border: isDarkMode ? "1px solid rgb(75, 85, 99)" : "1px solid rgb(209, 213, 219)",
                          padding: "0.5rem 0.75rem",
                          fontSize: "0.875rem",
                          backgroundColor: isDarkMode ? 'var(--background, #1f2937)' : 'var(--background, #ffffff)',
                          color: isDarkMode ? 'var(--foreground, #f9fafb)' : 'var(--foreground, #111827)'
                        }}
                        dropdownStyle={{
                          backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                          color: isDarkMode ? '#f9fafb' : '#111827'
                        }}
                        searchClass={isDarkMode ? 'dark-search' : 'light-search'}
                        countryCodeEditable={false}
                        enableSearch={true}
                        disableSearchIcon={false}
                        searchPlaceholder="Search country..."
                        preferredCountries={['us', 'ca', 'gb', 'au']}
                      />
                    </div>
                    {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
                    
                    {/* Phone number format guidance */}
                    <div className="mt-2 p-3 rounded-md bg-blue-50 dark:bg-blue-900 text-sm">
                      <p className="font-medium mb-1">Phone Number Formatting Guide:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Select your country from the dropdown or use the search</li>
                        <li>Country code will be added automatically (e.g., +1 for US)</li>
                        <li><strong>Important:</strong> Do not add leading zeros after the country code</li>
                        <li>Example: For UK number "01234 567890", enter as "1234 567890"</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={validateAndProceed} 
                      className="mt-2"
                      disabled={isVerified}
                    >
                      {isVerified ? "Verified ✓" : "Verify Contact Information"}
                    </Button>
                    
                    {isVerified && (
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => switchModule('parameters')}
                      >
                        <ArrowRightIcon className="h-4 w-4 mr-2" />
                        Continue to Content Parameters
                      </Button>
                    )}
                  </div>
                  
                  {isVerified && (
                    <p className="text-green-600 text-sm">
                      <CheckIcon className="h-4 w-4 inline mr-1" /> 
                      Your contact information has been verified
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Module 2: Content Parameters Section */}
          {shouldShowModule('parameters') && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Content Parameters</h3>
                
                <div className="space-y-6">
                  {/* Tone Selector */}
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="font-medium">Content Tone</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircleIcon className="h-4 w-4 ml-2 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">The tone affects how your content sounds to the reader.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select tone for your content" />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((option) => (
                          <TooltipProvider key={option.value}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SelectItem value={option.value}>{option.label}</SelectItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{option.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Brand Archetype Selector */}
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="font-medium">Brand Archetype</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircleIcon className="h-4 w-4 ml-2 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Brand archetypes define your brand's personality and how it connects with your audience.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select value={archetype} onValueChange={setArchetype}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a brand archetype" />
                      </SelectTrigger>
                      <SelectContent>
                        {ARCHETYPE_OPTIONS.map((option) => (
                          <TooltipProvider key={option.value}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SelectItem value={option.value}>{option.label}</SelectItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{option.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Word Count Input */}
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="font-medium">Target Word Count</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircleIcon className="h-4 w-4 ml-2 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Specify the approximate number of words you want in your generated content (50-5000).</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="number"
                        min={50}
                        max={5000}
                        value={targetWordCount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 50 && value <= 5000) {
                            setTargetWordCount(value);
                          }
                        }}
                        className="w-32"
                      />
                      <div className="flex-1">
                        <input
                          type="range"
                          min={50}
                          max={5000}
                          step={50}
                          value={targetWordCount}
                          onChange={(e) => setTargetWordCount(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                      </div>
                      <div className="w-24 text-sm text-gray-500 dark:text-gray-400">
                        {targetWordCount} words
                      </div>
                    </div>
                  </div>
                  
                  {/* Input Text Area with resizing handle */}
                  <div>
                    <div className="flex items-center mb-1">
                      <label className="font-medium">Content Prompt</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircleIcon className="h-4 w-4 ml-2 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Enter your content requirements here. You can resize this field using the resize handle at the bottom right corner.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="relative">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={`w-full min-h-32 p-3 border rounded-md resize-y ${
                          isDarkMode 
                            ? 'bg-gray-800 text-white border-gray-700' 
                            : 'bg-white text-gray-900 border-gray-300'
                        }`}
                        placeholder="Describe what content you want to generate..."
                        rows={4}
                        style={{
                          backgroundColor: isDarkMode ? 'var(--background, #1f2937)' : 'var(--background, #ffffff)',
                          color: isDarkMode ? 'var(--foreground, #f9fafb)' : 'var(--foreground, #111827)',
                        }}
                      />
                      {/* Custom resize handle with tooltip */}
                      <div className="resize-handle" title="Drag to resize">
                        <svg viewBox="0 0 24 24" className="w-full h-full" fill={isDarkMode ? 'white' : 'black'}>
                          <path d="M22 22H16V20H20V16H22V22ZM22 13H20V15H22V13ZM13 22H15V20H13V22ZM9 22H11V20H9V22Z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button 
                        onClick={processInput}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>Generate Content</>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveModule('verification')}
                        disabled={isGenerating}
                      >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Verification
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Module 3: Output Results Section */}
          {shouldShowModule('output') && outputResult && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Generated Content</h3>
                
                {/* Metadata Display */}
                {generationMetadata && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 mb-4 flex flex-wrap gap-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">
                        Generated in <strong>{(generationMetadata.processingTimeMs / 1000).toFixed(1)}s</strong>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FileTextIcon className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">
                        <strong>{generationMetadata.wordCount}</strong> words
                      </span>
                    </div>
                    <div className="flex items-center">
                      <RefreshCwIcon className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="text-sm">
                        <strong>{generationMetadata.iterationCount}</strong> refinement iterations
                      </span>
                    </div>
                  </div>
                )}
                
                <div className={`border p-4 rounded-md mb-6 min-h-40 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border-gray-700' 
                    : 'bg-gray-50 text-gray-900 border-gray-300'
                }`}>
                  <div className="flex justify-end mb-2">
                    <Button variant="ghost" className="h-8 w-8 p-0" title="Edit Content">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="h-8 w-8 p-0" title="Save Changes">
                      <SaveIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap" style={{
                    color: isDarkMode ? 'var(--foreground, #f9fafb)' : 'var(--foreground, #111827)'
                  }}>{outputResult}</pre>
                </div>
                
                {/* Output Format Options */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Download Options</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button onClick={downloadAsPDF} variant="outline" className="flex items-center">
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button onClick={downloadAsDocx} variant="outline" className="flex items-center">
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      Download Word
                    </Button>
                    <Button onClick={downloadAsHTML} variant="outline" className="flex items-center">
                      <FileIcon className="h-4 w-4 mr-2" />
                      Download HTML
                    </Button>
                    <Button 
                      onClick={() => copyToClipboard('html')} 
                      variant="outline" 
                      className="flex items-center"
                    >
                      <CopyIcon className="h-4 w-4 mr-2" />
                      {isCopied.html ? "Copied!" : "Copy HTML"}
                    </Button>
                    <Button 
                      onClick={() => copyToClipboard('formatted')} 
                      variant="outline" 
                      className="flex items-center"
                    >
                      <CopyIcon className="h-4 w-4 mr-2" />
                      {isCopied.formatted ? "Copied!" : "Copy Formatted"}
                    </Button>
                    <Button 
                      onClick={() => copyToClipboard('plaintext')} 
                      variant="outline" 
                      className="flex items-center"
                    >
                      <CopyIcon className="h-4 w-4 mr-2" />
                      {isCopied.plaintext ? "Copied!" : "Copy Plaintext"}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveModule('parameters')}
                    className="flex items-center"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Content Parameters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Verification Dialog */}
      <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verification Required</AlertDialogTitle>
            <AlertDialogDescription>
              A verification code has been sent to your email address and phone number. 
              Please check your email or messages to complete verification before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className={`mt-4 p-3 rounded-md ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className={`text-center font-medium ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>For demo purposes, click "Verify" below to simulate verification.</div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogAction onClick={simulateVerification}>
              Verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}