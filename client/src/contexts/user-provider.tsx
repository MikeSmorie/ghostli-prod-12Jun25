import { useState, useEffect, ReactNode } from "react";
import { UserContext, User, AuthContextType, defaultAuthContext } from "./user-context";
import { useToast } from "@/hooks/use-toast";

// Provider component that wraps the app
export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if user is logged in
  useEffect(() => {
    async function loadUser() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user');
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Not logged in, that's OK
          setUser(null);
        }
      } catch (err) {
        setError(err as Error);
        console.error("Auth error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUser();
  }, []);

  // Login function
  const login = async (credentials: { username: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`
      });
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Login failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: { username: string; password: string; email?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const newUser = await response.json();
      setUser(newUser);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${newUser.username}!`
      });
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Registration failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/logout', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Logout failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update user info (for account management)
  const updateUserInfo = (userInfo: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userInfo });
    }
  };

  // Create the auth value object
  const authValue: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUserInfo
  };

  return (
    <UserContext.Provider value={authValue}>
      {children}
    </UserContext.Provider>
  );
}