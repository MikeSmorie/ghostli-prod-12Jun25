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
import Footer from "@/components/footer";
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
    if (logout) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header - GhostliAI Navigation */}
      <nav className="border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="container flex h-16 items-center px-4">
          {/* Left Side - Home/Dashboard Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => handleNavigation("/")}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span className="font-bold text-lg">GhostliAI</span>
            </Button>
          </div>

          {/* Right Side - User Controls */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <AIAssistant />
              <span className="text-sm font-medium text-foreground hidden md:inline">AI Assistant</span>
            </div>
            
            {/* Buy Credits Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => handleNavigation("/buy-credits")}
              className="bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 text-white hidden sm:flex"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Buy Credits
            </Button>
            
            <NotificationCenter />
            
            {user && (
              <span className="text-sm font-medium text-foreground">
                {user.username}
              </span>
            )}
            
            {user && user.role === "supergod" && (
              <span className="text-sm font-bold text-red-500">
                👑 Super-God Mode Active
              </span>
            )}
            
            <FontSizeControls />
            <ThemeToggle />
            
            {user && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Sub-Header - Application Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="container flex h-12 items-center px-4">
          <div className="flex items-center gap-2">
            {navigationItems.slice(1).map((item) => (
              <Button
                key={item.id}
                variant={isActive(item.path) ? "default" : "ghost"}
                onClick={() => handleNavigation(item.path)}
                className="flex items-center gap-2 h-8"
                size="sm"
              >
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
              </Button>
            ))}
          </div>
        </div>
      </nav>

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
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}