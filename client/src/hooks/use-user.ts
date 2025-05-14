import { useContext } from "react";
import { UserContext } from "@/contexts/user-context";

// Export the user interface for compatibility with existing code
export interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Hook for accessing the logged-in user's data and auth operations
 */
export function useUser() {
  const authContext = useContext(UserContext);
  
  // Throw an error if the hook is used outside of a UserProvider
  if (!authContext) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return authContext;
}