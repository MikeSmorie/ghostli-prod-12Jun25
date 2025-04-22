import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { 
  UserIcon, 
  MailIcon, 
  PhoneIcon,
  SaveIcon,
  CheckCircleIcon,
  InfoIcon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserData {
  email: string;
  phoneNumber: string;
  username?: string;
  isVerified: boolean;
  countryCode?: string;
}

interface AccountManagementProps {
  userData: UserData;
  onUpdate: (userData: UserData) => void;
  isDarkMode: boolean;
}

export function AccountManagement({ userData, onUpdate, isDarkMode }: AccountManagementProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(userData.email || "");
  const [phoneNumber, setPhoneNumber] = useState(userData.phoneNumber || "");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [country, setCountry] = useState<string>(userData.countryCode || "");
  
  // Update local state when props change
  useEffect(() => {
    setEmail(userData.email || "");
    setPhoneNumber(userData.phoneNumber || "");
    setCountry(userData.countryCode || "");
  }, [userData]);

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

  const handleSave = () => {
    const isEmailValid = validateEmail(email);
    const numericPhone = phoneNumber.replace(/[^0-9]/g, '');
    const isPhoneValid = validatePhone(numericPhone);
    
    if (isEmailValid && isPhoneValid) {
      onUpdate({
        ...userData,
        email,
        phoneNumber,
        countryCode: country
      });
      
      setIsEditing(false);
      
      toast({
        title: "Account updated",
        description: "Your account information has been updated successfully.",
      });
    } else {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Account Information
          {userData.isVerified && (
            <CheckCircleIcon className="h-5 w-5 ml-2 text-green-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <div className="flex items-center mb-1">
              <label className="font-medium flex items-center">
                <MailIcon className="h-4 w-4 mr-2" />
                Email Address
              </label>
              {userData.isVerified && (
                <span className="ml-2 text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                  Verified
                </span>
              )}
            </div>
            {isEditing ? (
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                className={`w-full ${emailError ? 'border-red-500' : ''}`}
                placeholder="your.email@example.com"
              />
            ) : (
              <div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
                {email || "No email set"}
              </div>
            )}
            {emailError && isEditing && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>
          
          {/* Phone field with country code */}
          <div>
            <div className="flex items-center mb-1">
              <label className="font-medium flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2" />
                Phone Number
              </label>
              {userData.isVerified && (
                <span className="ml-2 text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                  Verified
                </span>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      When entering your phone number, do not include the leading '0' 
                      after the country code. For example, if your number is 
                      "01234567890" in the UK (+44), enter it as "+44 1234567890".
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isEditing ? (
              <div className={`${phoneError ? 'border-red-500 rounded-md' : ''}`}>
                <PhoneInput
                  country={country || undefined}
                  value={phoneNumber}
                  onChange={(phone, countryData: any) => {
                    setPhoneNumber(phone);
                    setCountry(countryData?.countryCode || "");
                    // Clear error on change
                    setPhoneError('');
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
                  preferredCountries={['us', 'gb', 'ca', 'au']}
                />
              </div>
            ) : (
              <div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
                {phoneNumber || "No phone number set"}
              </div>
            )}
            {phoneError && isEditing && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
            {isEditing && (
              <p className="text-sm text-gray-500 mt-1">
                Remove the leading '0' after the country code. Example: For +44 01234567890, enter as +44 1234567890
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEmail(userData.email || "");
                    setPhoneNumber(userData.phoneNumber || "");
                    setEmailError("");
                    setPhoneError("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Information
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}