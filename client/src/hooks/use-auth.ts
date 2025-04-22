import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

// Define user interface
interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: {
    mutate: (credentials: LoginCredentials) => Promise<void>;
    isLoading: boolean;
  };
  registerMutation: {
    mutate: (userData: RegisterUserData) => Promise<void>;
    isLoading: boolean;
  };
  logoutMutation: {
    mutate: () => Promise<void>;
    isLoading: boolean;
  };
  updateUserInfo: (userInfo: Partial<User>) => void;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterUserData {
  username: string;
  password: string;
  email?: string;
}

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component that wraps the app
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const [logoutLoading, setLogoutLoading] = useState<boolean>(false);

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
  const login = async (credentials: LoginCredentials) => {
    try {
      setLoginLoading(true);
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
      setLoginLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterUserData) => {
    try {
      setRegisterLoading(true);
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
      setRegisterLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLogoutLoading(true);
      
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
      setLogoutLoading(false);
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
    loginMutation: {
      mutate: login,
      isLoading: loginLoading
    },
    registerMutation: {
      mutate: register,
      isLoading: registerLoading
    },
    logoutMutation: {
      mutate: logout,
      isLoading: logoutLoading
    },
    updateUserInfo
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}