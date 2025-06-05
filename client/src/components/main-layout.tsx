import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AIAssistant } from "@/components/ai-assistant";
import { NotificationCenter } from "@/components/notification-center";
import { FontSizeControls } from "@/components/font-size-controls";
import CreditsDisplay from "@/components/credits-display";
import { 
  FileText, 
  Sparkles, 
  LineChart,
  Shield,
  Download,
  CreditCard,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  BarChart3,
  Bell
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description?: string;
  badge?: string;
  premium?: boolean;
}

export function MainLayout({ children }: LayoutProps) {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      path: "/",
      description: "Overview and quick start"
    },
    {
      id: "create-content",
      label: "Create Content",
      icon: <FileText className="h-5 w-5" />,
      path: "/content-generator-new",
      description: "Generate AI-powered content",
      badge: "Start Here"
    },
    {
      id: "clone-me",
      label: "Clone Me",
      icon: <Sparkles className="h-5 w-5" />,
      path: "/clone-me",
      description: "Use your writing style",
      premium: true
    },
    {
      id: "analytics",
      label: "Performance Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/analytics",
      description: "Content insights"
    },
    {
      id: "ai-shield",
      label: "AI Detection Shield",
      icon: <Shield className="h-5 w-5" />,
      path: "/ai-shield",
      description: "Anti-detection analysis"
    }
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account.",
        });
        window.location.href = "/auth";
      } else {
        throw new Error("Logout failed");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to logout",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold">GhostliAI</h1>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={isActive(item.path) ? "default" : "ghost"}
                className="relative"
                onClick={() => handleNavigation(item.path)}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {item.premium && (
                    <Badge className="ml-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                      Pro
                    </Badge>
                  )}
                </span>
              </Button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <CreditsDisplay />
            </div>
            
            <NotificationCenter />
            
            <div className="flex items-center gap-1">
              <AIAssistant />
              <span className="text-sm font-medium hidden sm:inline">AI Assistant</span>
            </div>
            
            <FontSizeControls />
            <ThemeToggle />
            
            {/* User Display and Controls */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
                  <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user.username}</span>
                  {user.role === "supergod" && (
                    <span className="text-xs font-bold text-red-500">👑 Super-God</span>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation("/subscription")}
                  className="hidden md:flex items-center gap-2"
                  title="Subscription"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="capitalize">{user.role}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container py-4 space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="flex items-center gap-3 w-full">
                    {item.icon}
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {item.badge && (
                            <Badge variant="outline" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          {item.premium && (
                            <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                              Pro
                            </Badge>
                          )}
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </span>
                </Button>
              ))}
              
              <div className="pt-4 border-t">
                <div className="lg:hidden mb-3">
                  <CreditsDisplay />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation("/subscription")}
                    className="justify-start"
                  >
                    <CreditCard className="h-4 w-4 mr-3" />
                    Subscription ({user?.role})
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation("/settings")}
                    className="justify-start"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}