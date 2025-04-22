import { useState } from "react";
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
  FileTypeIcon,
  CheckIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  
  // Content parameters
  const [inputValue, setInputValue] = useState("");
  const [tone, setTone] = useState<string>("");
  const [archetype, setArchetype] = useState<string>("");
  
  // Output and verification state
  const [outputResult, setOutputResult] = useState("");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isCopied, setIsCopied] = useState({
    html: false,
    formatted: false,
    plaintext: false
  });

  // Validation functions
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setEmailError(isValid ? "" : "Please enter a valid email address");
    return isValid;
  };

  const validatePhone = (value: string): boolean => {
    const phoneRegex = /^\d+$/;
    const isValid = phoneRegex.test(value);
    setPhoneError(isValid ? "" : "Please enter numbers only");
    return isValid;
  };

  const validateAndProceed = () => {
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phoneNumber);
    
    if (isEmailValid && isPhoneValid) {
      // Show verification dialog
      setShowVerificationDialog(true);
    }
  };

  // Simulate verification (in a real app, this would involve email/SMS verification)
  const simulateVerification = () => {
    setShowVerificationDialog(false);
    setIsVerified(true);
    toast({
      title: "Verification successful",
      description: "Your account has been verified.",
    });
  };

  // Process input and generate content
  const processInput = () => {
    if (!isVerified) {
      toast({
        title: "Verification required",
        description: "Please verify your email and phone number first.",
        variant: "destructive"
      });
      return;
    }
    
    if (inputValue.trim()) {
      let result = `Processed input: ${inputValue}`;
      
      if (tone) {
        result += `\nTone: ${tone}`;
      }
      
      if (archetype) {
        result += `\nBrand Archetype: ${archetype}`;
      }
      
      setOutputResult(result);
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

  return (
    <div className="container mx-auto py-6">
      <div className="section">
        <h2 className="text-2xl font-bold mb-4">WriteRIGHT-01/OM-7 Content Generator</h2>
        
        <div className="instruction bg-gray-100 p-4 rounded-md mb-6">
          This advanced content generation tool creates tailored content based on your preferences and brand identity. Please provide your contact information for verification before proceeding.
        </div>
        
        {/* User Information Section */}
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
              
              {/* Phone field with validation */}
              <div>
                <div className="flex items-center mb-1">
                  <label className="font-medium">Phone Number</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircleIcon className="h-4 w-4 ml-2 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Your phone number will be used for verification purposes only.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onBlur={() => validatePhone(phoneNumber)}
                  className={`w-full ${phoneError ? 'border-red-500' : ''}`}
                  placeholder="1234567890"
                />
                {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
              </div>
              
              <Button 
                onClick={validateAndProceed} 
                className="mt-2"
                disabled={isVerified}
              >
                {isVerified ? "Verified ✓" : "Verify Contact Information"}
              </Button>
              
              {isVerified && (
                <p className="text-green-600 text-sm">
                  <CheckIcon className="h-4 w-4 inline mr-1" /> 
                  Your contact information has been verified
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Generation Section */}
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
              
              {/* Input Text Area */}
              <div>
                <label className="block mb-2 font-medium">Content Prompt:</label>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full min-h-24 p-3 border rounded-md"
                  placeholder="Describe what content you want to generate..."
                  rows={4}
                />
                <div className="mt-4">
                  <Button 
                    onClick={processInput} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!isVerified}
                  >
                    Generate Content
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output Results Section */}
        {outputResult && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Generated Content</h3>
              
              <div className="bg-gray-50 border p-4 rounded-md mb-6 min-h-40">
                <pre className="whitespace-pre-wrap">{outputResult}</pre>
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
            </CardContent>
          </Card>
        )}

        {/* Module Information Card */}
        <Card className="mt-8 border border-blue-200">
          <CardContent className="pt-6">
            <h4 className="text-lg font-medium mb-2">Module Information</h4>
            <p>
              <strong>Module ID:</strong> {id}
            </p>
            <p>
              <strong>Module Type:</strong> Content Generator
            </p>
            <p>
              <strong>Status:</strong> Active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Verification Dialog */}
      <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verification Required</AlertDialogTitle>
            <AlertDialogDescription>
              A verification code has been sent to your email address and phone number. 
              Please check your email or messages to complete verification before proceeding.
              
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-center font-medium">For demo purposes, click "Verify" below to simulate verification.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
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