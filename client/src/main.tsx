import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from './App';
import "./index.css";
import { UserProvider } from "./contexts/user-provider";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Configure the mount point
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <App/>
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  </StrictMode>,
);