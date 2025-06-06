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
        console.log("Checking for existing authentication...");
        
        // Get JWT token from localStorage if available
        const token = localStorage.getItem('auth_token');
        console.log("Token exists in localStorage:", !!token);
        
        const headers: HeadersInit = {};
        
        if (token) {
          console.log("Adding auth token to request headers");
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        console.log("Fetching user data...");
        const response = await fetch('/api/user', {
          headers,
          credentials: 'include'
        });
        
        console.log("User fetch response status:", response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log("User data fetched successfully:", userData);
          setUser(userData);
        } else {
          console.log("Failed to fetch user data. Status:", response.status);
          // Not logged in or invalid token, clear it
          if (token) {
            console.log("Removing invalid token from localStorage");
            localStorage.removeItem('auth_token');
          }
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
      
      console.log("Attempting login with:", credentials.username);
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      console.log("Login response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Login failed:", errorData);
        return { ok: false, message: errorData.message || 'Login failed' };
      }
      
      const responseData = await response.json();
      console.log("Login response data:", responseData);
      
      // Store the JWT token in localStorage for future API requests
      if (responseData.token) {
        console.log("Storing auth token in localStorage");
        localStorage.setItem('auth_token', responseData.token);
        
        // Invalidate any existing cached data to force a refetch with the new token
        if (window.queryClient) {
          window.queryClient.invalidateQueries({
            queryKey: ["/api/user"],
          });
        }
      } else {
        console.warn("No auth token found in login response");
      }
      
      const userData = responseData.user || responseData;
      console.log("Setting user data:", userData);
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`
      });
      
      return { ok: true, message: 'Login successful', user: userData };
    } catch (err) {
      setError(err as Error);
      console.error("Login error:", err);
      return { ok: false, message: (err as Error).message || 'Login failed due to an unexpected error' };
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
        return { ok: false, message: errorData.message || 'Registration failed' };
      }
      
      const responseData = await response.json();
      
      // Store the JWT token in localStorage for future API requests
      if (responseData.token) {
        localStorage.setItem('auth_token', responseData.token);
        
        // Invalidate any existing cached data to force a refetch with the new token
        if (window.queryClient) {
          window.queryClient.invalidateQueries({
            queryKey: ["/api/user"],
          });
        }
      }
      
      setUser(responseData.user || responseData);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${responseData.user?.username || responseData.username}!`
      });
      
      return { ok: true, message: 'Registration successful', user: responseData.user || responseData };
    } catch (err) {
      setError(err as Error);
      console.error("Registration error:", err);
      return { ok: false, message: (err as Error).message || 'Registration failed due to an unexpected error' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear the JWT token from localStorage FIRST to prevent race conditions
      localStorage.removeItem('auth_token');
      
      // Clear user state immediately
      setUser(null);
      
      // Clear all query cache data
      if (window.queryClient) {
        window.queryClient.clear();
      }
      
      // Call backend logout endpoint
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('Backend logout failed, but user was logged out locally');
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      
      // Force a page reload to ensure clean state
      window.location.href = '/auth';
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