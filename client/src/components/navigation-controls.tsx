import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Home, Settings, Users, Shield, ShieldAlert, FileText, Sparkles } from "@/lib/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { useAdmin } from "@/contexts/admin-context";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function NavigationControls() {
  const [, navigate] = useLocation();
  const { user } = useUser();
  const { godMode, isSupergod } = useAdmin();

  // Check if user is admin with god mode
  const isGodModeAdmin = user?.role === "admin" && godMode;
  
  // Check if user is supergod
  const isSuperGod = user?.role === "supergod";

  return (
    <div className="flex items-center gap-4">
      {/* Basic Navigation Controls */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go back</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="h-8 w-8"
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Home</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.forward()}
                className="h-8 w-8"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go forward</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Supergod Navigation Menu - Highest privileges */}
      {isSuperGod && (
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600">
                <div className="flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4" />
                  Super-God Controls
                </div>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 w-[400px]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className={cn(
                          "flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-red-500/5 to-red-500/10 border border-red-500/20 p-6 no-underline outline-none focus:shadow-md",
                          navigationMenuTriggerStyle()
                        )}
                        onClick={() => navigate("/supergod")}
                      >
                        <ShieldAlert className="h-6 w-6 mb-2 text-red-500" />
                        <div className="mb-2 text-lg font-medium text-red-500">
                          Super-God Dashboard
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Access ultimate system control with unlimited privileges
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                          navigationMenuTriggerStyle()
                        )}
                        onClick={() => navigate("/admin")}
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Admin Dashboard</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Standard admin control panel (lower privileges)
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )}
      
      {/* User Tools Menu */}
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-3 p-4 w-[400px]">
                <li>
                  <NavigationMenuLink asChild>
                    <a
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        navigationMenuTriggerStyle()
                      )}
                      onClick={() => navigate("/content-generation")}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <div className="text-sm font-medium leading-none">Content Generator</div>
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Generate high-quality content with customizable parameters
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <a
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800",
                        navigationMenuTriggerStyle()
                      )}
                      onClick={() => navigate("/content-generator-new")}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <div className="text-sm font-medium leading-none">New Interface</div>
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-semibold">Recommended</span>
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Try our improved content generation interface with all features
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <a
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        navigationMenuTriggerStyle()
                      )}
                      onClick={() => navigate("/clone-me")}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <div className="text-sm font-medium leading-none">Clone Me</div>
                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-semibold">Premium</span>
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Generate content that mimics your unique writing style
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      
      {/* Admin Navigation Menu */}
      {isGodModeAdmin && !isSuperGod && (
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Admin Tools</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 w-[400px]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className={cn(
                          "flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md",
                          navigationMenuTriggerStyle()
                        )}
                        onClick={() => navigate("/admin")}
                      >
                        <Settings className="h-6 w-6 mb-2" />
                        <div className="mb-2 text-lg font-medium">
                          Admin Dashboard
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Access system monitoring and administration tools
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                          navigationMenuTriggerStyle()
                        )}
                        onClick={() => navigate("/admin/subscription-manager")}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Subscription Manager</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Manage subscription plans and feature access
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800",
                          navigationMenuTriggerStyle()
                        )}
                        onClick={() => navigate("/supergod")}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                          <div className="text-sm font-medium leading-none">God Mode Dashboard</div>
                          <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded text-xs font-semibold">Advanced</span>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Access advanced system controls and monitoring tools
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )}
      
      {/* Emergency God Mode Button - Always visible for direct access */}
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Button 
                variant="ghost" 
                className="text-xs gap-1 h-8"
                onClick={() => navigate("/emergency-login")}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                Emergency Access
              </Button>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}