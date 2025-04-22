import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "../hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { User } from "../contexts/user-context";

export default function AccountSettings() {
  const { user, updateUserInfo } = useUser();
  const { toast } = useToast();
  
  // Load saved values from localStorage if available
  const [email, setEmail] = useState(localStorage.getItem('user_email') || "");
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('user_phone') || "");
  const [country, setCountry] = useState<string>(localStorage.getItem('user_country') || "");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isVerified, setIsVerified] = useState(localStorage.getItem('user_verified') === 'true');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Check for dark mode when component mounts
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      const isDark = 
        darkModeMediaQuery.matches || 
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark';
      
      setIsDarkMode(isDark);
    };
    
    updateTheme();
    darkModeMediaQuery.addEventListener('change', updateTheme);
    
    return () => darkModeMediaQuery.removeEventListener('change', updateTheme);
  }, []);

  // Email validation
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setEmailError(isValid ? "" : "Please enter a valid email address");
    return isValid;
  };

  // Phone validation
  const validatePhone = (value: string): boolean => {
    const numericPart = value.replace(/[^0-9]/g, '');
    const isValid = numericPart.length >= 8;
    setPhoneError(isValid ? "" : "Please enter a valid phone number with at least 8 digits");
    return isValid;
  };

  // Save account information
  const saveAccountInfo = () => {
    const isEmailValid = validateEmail(email);
    const numericPhone = phoneNumber.replace(/[^0-9]/g, '');
    const isPhoneValid = validatePhone(numericPhone);
    
    if (isEmailValid && isPhoneValid) {
      // Save to localStorage
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_phone', phoneNumber);
      localStorage.setItem('user_country', country);
      localStorage.setItem('user_verified', isVerified ? 'true' : 'false');
      
      // If there's an authenticated user, update their information
      if (user) {
        const updatedUser: Partial<User> = {
          email
        };
        updateUserInfo(updatedUser);
      }
      
      toast({
        title: "Account updated",
        description: "Your account information has been saved.",
      });
    } else {
      toast({
        title: "Validation Error",
        description: "Please correct the errors before saving.",
        variant: "destructive"
      });
    }
  };

  // Reset verification status
  const resetVerification = () => {
    localStorage.removeItem('user_verified');
    setIsVerified(false);
    
    toast({
      title: "Verification reset",
      description: "You will need to verify your contact information again.",
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
      
      <div className="grid gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Update your email and phone number settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                className={`w-full ${emailError ? 'border-red-500' : ''}`}
                placeholder="your.email@example.com"
              />
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
            </div>
            
            {/* Phone field with country code */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className={`${phoneError ? 'border-red-500 rounded-md' : ''}`}>
                <PhoneInput
                  country={country || 'us'} // Use stored country or default to US
                  value={phoneNumber}
                  onChange={(phone, countryData: any) => {
                    setPhoneNumber(phone);
                    setPhoneError('');
                    setCountry(countryData?.countryCode || "");
                  }}
                  onBlur={() => validatePhone(phoneNumber.replace(/[^0-9]/g, ''))}
                  inputProps={{
                    id: 'phone',
                    name: 'phone',
                  }}
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
              {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
            </div>
            
            {/* Phone number guidance */}
            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900 text-sm">
              <p className="font-medium mb-1">Phone Number Formatting Guide:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Select your country from the dropdown or use the search</li>
                <li>Country code will be added automatically (e.g., +1 for US)</li>
                <li><strong>Important:</strong> Do not add leading zeros after the country code</li>
                <li>Example: For UK number "01234 567890", enter as "1234 567890"</li>
              </ul>
            </div>
            
            {/* Verification Status */}
            <div className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Verification Status</h3>
                  <p className={`text-sm ${isVerified ? 'text-green-600' : 'text-red-500'}`}>
                    {isVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetVerification}
                  disabled={!isVerified}
                >
                  Reset Verification
                </Button>
              </div>
            </div>
            
            <Button onClick={saveAccountInfo} className="w-full">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}