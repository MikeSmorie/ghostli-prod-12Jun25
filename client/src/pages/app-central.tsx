import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Sparkles, 
  Settings, 
  UserCheck, 
  Layers,
  LineChart,
  BadgeCheck,
  RefreshCw,
  PenSquare,
  ShieldAlert,
  Users,
  Activity
} from "lucide-react";

export default function AppCentral() {
  const [, setLocation] = useLocation();

  // Define modules with descriptive names and icons
  const modules = [
    {
      id: 1,
      name: "Content Generator",
      description: "Generate AI content with anti-detection capabilities",
      path: "/module/1",
      icon: <PenSquare className="h-6 w-6 text-blue-600" />,
      primary: true
    },
    {
      id: 2,
      name: "Content Parameters",
      description: "Configure tone, style and humanization settings",
      path: "/module/2",
      icon: <Settings className="h-6 w-6 text-indigo-600" />
    },
    {
      id: 3,
      name: "Account Verification",
      description: "Verify your account details and security settings",
      path: "/module/3",
      icon: <UserCheck className="h-6 w-6 text-green-600" />
    },
    {
      id: 4,
      name: "Performance Analytics",
      description: "Review content generation performance metrics",
      path: "/module/4",
      icon: <LineChart className="h-6 w-6 text-orange-600" />
    },
    {
      id: 5,
      name: "AI Detection Shield",
      description: "Monitor and improve anti-detection capabilities",
      path: "/module/5",
      icon: <ShieldAlert className="h-6 w-6 text-red-600" />
    },
    {
      id: 6,
      name: "Output Formats",
      description: "Export your content in multiple formats",
      path: "/module/6",
      icon: <FileText className="h-6 w-6 text-purple-600" />
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GhostliAI Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Advanced content generation system with AI-detection avoidance
        </p>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 mb-8">
        <div className="flex items-start space-x-4">
          <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-lg mb-1">
              Welcome to GhostliAI
            </h3>
            <p className="text-blue-700 dark:text-blue-400">
              This system creates human-like content that bypasses AI detection. 
              Start with the Content Generator module for quick creation, or explore 
              other modules for advanced configuration and management.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mb-6">
        <Button 
          className="flex items-center gap-2"
          variant="outline"
          onClick={() => setLocation("/content-generator-new")}
        >
          <RefreshCw className="h-4 w-4" />
          New Tabbed Interface (Beta)
        </Button>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setLocation("/subscription")}
        >
          <BadgeCheck className="h-4 w-4" />
          Manage Subscription
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card 
            key={module.id}
            className={`hover:shadow-lg transition-all cursor-pointer border ${
              module.primary 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 border-blue-200 dark:border-blue-800' 
                : 'bg-white dark:bg-gray-800'
            }`}
            onClick={() => setLocation(module.path)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                {module.icon}
                {module.primary && (
                  <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full font-medium">
                    Recommended
                  </span>
                )}
              </div>
              <CardTitle className="mt-2">{module.name}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Click to access
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}