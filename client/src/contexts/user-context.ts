import { createContext } from 'react';

// User interface
export interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: { username: string; password: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInfo: (userInfo: Partial<User>) => void;
}

// Default context value
export const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUserInfo: () => {}
};

// Create the context
export const UserContext = createContext<AuthContextType>(defaultAuthContext);