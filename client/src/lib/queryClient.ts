import { QueryClient } from "@tanstack/react-query";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface QueryFnOptions {
  on401?: "throw" | "returnNull";
}

/**
 * Generic API request function
 */
export async function apiRequest(
  method: HttpMethod, 
  endpoint: string,
  body?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  // Get JWT token from localStorage if available
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  if (token) {
    options.headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    };
  }

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  return fetch(endpoint, options);
}

/**
 * Generate a queryFn that can be customized for error handling
 */
export function getQueryFn(options: QueryFnOptions = {}) {
  return async ({ queryKey }: any) => {
    const endpoint = queryKey[0] as string;
    
    try {
      const headers: HeadersInit = {};
      
      // Get JWT token from localStorage if available
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch(endpoint, {
        credentials: "include",
        headers
      });

      if (!res.ok) {
        // Handle authentication errors based on options
        if (res.status === 401 && options.on401 === "returnNull") {
          return null;
        }
        
        if (res.status >= 500) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }

        throw new Error(`${res.status}: ${await res.text()}`);
      }

      try {
        // First try to parse as JSON directly
        return await res.json();
      } catch (jsonError) {
        console.error("JSON parse error in queryClient:", jsonError);
        
        // If JSON parsing fails, try to read as text and then parse
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (secondError) {
          console.error("Secondary JSON parse error:", secondError);
          console.log("Raw response text:", text);
          
          // Return a placeholder object if we can't parse the response
          if (text.includes('"content"')) {
            // Try to extract content if it exists in the response
            const contentMatch = text.match(/"content"\s*:\s*"([^"]+)"/);
            if (contentMatch && contentMatch[1]) {
              return { content: contentMatch[1] };
            }
          }
          
          // If all parsing fails, throw an error
          throw new Error(`Failed to parse response: ${text.slice(0, 100)}...`);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("401") && options.on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };
}

// Extend window interface to include queryClient
declare global {
  interface Window {
    queryClient: QueryClient;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});

// Make queryClient globally available
window.queryClient = queryClient;
