import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminRegisterPage from "@/pages/admin-register";
import SupergodRegisterPage from "@/pages/supergod-register";
import SupergodDashboard from "@/pages/supergod-dashboard";
import GodModeAdmin from "@/pages/god-mode-admin";
import EmergencyLoginPage from "@/pages/emergency-login-page";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminCommunications from "@/pages/admin-communications";
import LogsDashboard from "@/pages/admin/logs-dashboard";
import UnifiedDashboard from "@/pages/unified-dashboard";
import SubscriptionPage from "./pages/subscription-page";
import SubscriptionManager from "@/pages/subscription-manager";
import SubscriptionFeatures from "@/pages/subscription-features";
import SubscriptionManagement from "@/pages/subscription-management";
import FeatureFlagsManagerPage from "@/pages/feature-flags-manager";
import ContentGeneratorNewPage from "./pages/content-generator-new";
import CloneMePage from "./pages/clone-me";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { MainLayout } from "@/components/main-layout";
import { AdminProvider } from "@/contexts/admin-context";
import SubscriptionPlans from "@/pages/subscription-plans";
import CryptoDashboard from "@/pages/crypto-dashboard";

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "supergod")) {
    return <AuthPage />;
  }
  
  // Log role information
  console.log("[DEBUG] Current user role:", user.role);
  if (user.role === "supergod") {
    console.log("[DEBUG] Super-God privileges unlocked");
  }

  return <Component />;
}

function ProtectedSupergodRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useUser();
  const { toast } = useToast();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user || user.role !== "supergod") {
    // For security, don't even show this route exists to non-supergods
    toast({
      title: "Access Denied",
      description: "This area requires Super-God privileges.",
      variant: "destructive"
    });
    
    return <NotFound />;
  }
  
  console.log("[DEBUG] Super-God exclusive route accessed");
  
  return <Component />;
}

function Router() {
  const { user, isLoading, logout } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.ok) {
        throw new Error(result.message);
      }
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (!user) {
    return (
      <Switch>
        <Route path="/admin-register" component={AdminRegisterPage} />
        <Route path="/supergod-register" component={SupergodRegisterPage} />
        <Route path="/emergency-login" component={EmergencyLoginPage} />
        <Route path="/god-mode-admin" component={GodModeAdmin} />
        <Route path="*" component={AuthPage} />
      </Switch>
    );
  }

  return (
    <MainLayout>
      <Switch>
        {/* Admin routes - hidden from main navigation */}
        <Route path="/admin" component={() => <ProtectedAdminRoute component={AdminDashboard} />} />
        <Route path="/admin/logs" component={() => <ProtectedAdminRoute component={LogsDashboard} />} />
        <Route path="/admin/subscription-manager" component={() => <ProtectedAdminRoute component={SubscriptionManager} />} />
        <Route path="/admin/communications" component={() => <ProtectedAdminRoute component={AdminCommunications} />} />
        <Route path="/admin/feature-flags" component={() => <ProtectedAdminRoute component={FeatureFlagsManagerPage} />} />
        
        {/* Supergod exclusive routes (high-security) - hidden from main navigation */}
        <Route path="/supergod" component={() => <ProtectedSupergodRoute component={SupergodDashboard} />} />
        <Route path="/supergod-dashboard" component={() => <ProtectedSupergodRoute component={SupergodDashboard} />} />
        <Route path="/god-mode" component={GodModeAdmin} />
        
        {/* Main public routes with unified dashboard */}
        <Route path="/" component={UnifiedDashboard} />
        <Route path="/dashboard" component={UnifiedDashboard} />
        <Route path="/content-generator-new" component={ContentGeneratorNewPage} />
        <Route path="/clone-me" component={CloneMePage} />
        <Route path="/subscription" component={SubscriptionManagement} />
        <Route path="/subscription/plans" component={SubscriptionPlans} />
        <Route path="/subscription/features" component={SubscriptionFeatures} />
        <Route path="/subscription/pro" component={SubscriptionPage} />
        <Route path="/crypto-dashboard" component={CryptoDashboard} />
        
        {/* Placeholder routes for new features */}
        <Route path="/analytics" component={() => <div className="container mx-auto p-6"><h1 className="text-2xl font-bold">Performance Analytics</h1><p>Coming soon...</p></div>} />
        <Route path="/ai-shield" component={() => <div className="container mx-auto p-6"><h1 className="text-2xl font-bold">AI Detection Shield</h1><p>Coming soon...</p></div>} />
        <Route path="/export" component={() => <div className="container mx-auto p-6"><h1 className="text-2xl font-bold">Output & Export</h1><p>Coming soon...</p></div>} />
        <Route path="/settings" component={() => <div className="container mx-auto p-6"><h1 className="text-2xl font-bold">Settings</h1><p>Coming soon...</p></div>} />
        <Route path="/profile" component={() => <div className="container mx-auto p-6"><h1 className="text-2xl font-bold">Profile</h1><p>Coming soon...</p></div>} />
        
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <AdminProvider>
          <Router />
          <Toaster />
        </AdminProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;