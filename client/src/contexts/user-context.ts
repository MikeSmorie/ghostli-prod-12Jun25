import { createContext } from 'react';

// User interface
export interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
}

export interface AuthResult {
  ok: boolean;
  message: string;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<AuthResult>;
  register: (userData: { username: string; password: string; email?: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUserInfo: (userInfo: Partial<User>) => void;
}

// Default context value
export const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  login: async () => ({ ok: false, message: "Not implemented" }),
  register: async () => ({ ok: false, message: "Not implemented" }),
  logout: async () => {},
  updateUserInfo: () => {}
};

// Create the context
export const UserContext = createContext<AuthContextType>(defaultAuthContext);