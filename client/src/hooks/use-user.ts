import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

// Define the shape of user data returned from the API
export interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook for accessing the logged-in user's data
 */
export function useUser() {
  const {
    data: user,
    isLoading,
    error,
    isError,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    error,
    isError,
    isAuthenticated: !!user,
  };
}