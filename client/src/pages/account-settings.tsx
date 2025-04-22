import { useState, useEffect } from "react";
import { AccountManagement } from "@/components/account-management";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserIcon, LogOutIcon, ShieldIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AccountSettings() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState({
    email: localStorage.getItem('user_email') || "",
    phoneNumber: localStorage.getItem('user_phone') || "",
    isVerified: localStorage.getItem('user_verified') === 'true',
    countryCode: localStorage.getItem('user_country') || ""
  });

  // Check for dark mode
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

  const handleUserDataUpdate = (newData: any) => {
    setUserData(newData);
    
    // Save to localStorage
    localStorage.setItem('user_email', newData.email || "");
    localStorage.setItem('user_phone', newData.phoneNumber || "");
    localStorage.setItem('user_verified', newData.isVerified.toString());
    localStorage.setItem('user_country', newData.countryCode || "");
    
    // In a real app, this would also save to the database via an API call
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      }
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <UserIcon className="h-6 w-6 mr-2" />
        Account Settings
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <AccountManagement 
            userData={userData} 
            onUpdate={handleUserDataUpdate}
            isDarkMode={isDarkMode}
          />
          
          {/* In a real app, we would have more sections here like notification preferences, 
              subscription management, API keys, etc. */}
        </div>
        
        <div className="space-y-6">
          {/* User info card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <UserIcon className="h-12 w-12 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">{user?.username || "User"}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userData.email}</p>
                
                <div className="mt-6 w-full">
                  <Button variant="outline" className="w-full justify-start mb-2">
                    <ShieldIcon className="h-4 w-4 mr-2" />
                    Security Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={handleLogout}
                  >
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account status card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Email verification</span>
                  <span className={`text-sm font-medium ${userData.isVerified ? 'text-green-500' : 'text-yellow-500'}`}>
                    {userData.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Phone verification</span>
                  <span className={`text-sm font-medium ${userData.isVerified ? 'text-green-500' : 'text-yellow-500'}`}>
                    {userData.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Account type</span>
                  <span className="text-sm font-medium">
                    Standard
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}