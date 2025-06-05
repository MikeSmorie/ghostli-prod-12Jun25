import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Sparkles, 
  LineChart,
  Shield,
  Download,
  CreditCard,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description?: string;
  badge?: string;
  premium?: boolean;
}

export function SidebarNavigation() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      id: "home",
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      path: "/",
      description: "Overview and quick actions"
    },
    {
      id: "create-content",
      label: "Create Content",
      icon: <FileText className="h-5 w-5" />,
      path: "/content-generator-new",
      description: "Generate AI-powered content",
      badge: "Primary"
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
      icon: <LineChart className="h-5 w-5" />,
      path: "/analytics",
      description: "Content performance insights"
    },
    {
      id: "ai-shield",
      label: "AI Detection Shield",
      icon: <Shield className="h-5 w-5" />,
      path: "/ai-shield",
      description: "Anti-detection analysis"
    },
    {
      id: "export",
      label: "Output & Export",
      icon: <Download className="h-5 w-5" />,
      path: "/export",
      description: "Download and share content"
    }
  ];

  const accountItems: NavigationItem[] = [
    {
      id: "subscription",
      label: "Subscription",
      icon: <CreditCard className="h-5 w-5" />,
      path: "/subscription",
      description: "Manage your plan"
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
      path: "/profile",
      description: "Account settings"
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings",
      description: "App preferences"
    }
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Card className={cn(
      "h-full transition-all duration-300 ease-in-out border-r",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <CardContent className="p-0 h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">GhostliAI</h2>
                  <p className="text-xs text-muted-foreground">Content Generation</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="p-2 space-y-1">
          {!isCollapsed && (
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Content Creation
            </p>
          )}
          
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3",
                isCollapsed && "justify-center",
                isActive(item.path) && "bg-primary/10 text-primary"
              )}
              onClick={() => handleNavigation(item.path)}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      <div className="flex items-center space-x-1">
                        {item.badge && (
                          <Badge variant="outline" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        {item.premium && (
                          <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                            Premium
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
                )}
              </div>
            </Button>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Account Section */}
        <div className="p-2 space-y-1">
          {!isCollapsed && (
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Account
            </p>
          )}
          
          {accountItems.map((item) => (
            <Button
              key={item.id}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3",
                isCollapsed && "justify-center",
                isActive(item.path) && "bg-primary/10 text-primary"
              )}
              onClick={() => handleNavigation(item.path)}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role} Plan</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}