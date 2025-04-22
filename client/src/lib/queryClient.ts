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

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  return fetch(endpoint, options);
}

/**
 * Generate a queryFn that can be customized for error handling
 */
export function getQueryFn(options: QueryFnOptions = {}) {
  return async ({ queryKey }: { queryKey: (string | number)[] }) => {
    const endpoint = queryKey[0] as string;
    
    try {
      const res = await fetch(endpoint, {
        credentials: "include",
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

      return res.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes("401") && options.on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
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
