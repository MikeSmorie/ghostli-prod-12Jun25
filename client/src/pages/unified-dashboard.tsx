import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import CreditsDisplay from "@/components/credits-display";
import { 
  FileText, 
  Sparkles, 
  LineChart,
  Shield,
  Download,
  ArrowRight,
  CheckCircle,
  Play,
  BookOpen,
  Zap,
  TrendingUp,
  Users
} from "lucide-react";
import { useUser } from "@/hooks/use-user";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  primary?: boolean;
  premium?: boolean;
  badge?: string;
}

interface GuideStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  path: string;
}

export default function UnifiedDashboard() {
  const [, navigate] = useLocation();
  const { user } = useUser();

  // Quick actions following the requested flow
  const quickActions: QuickAction[] = [
    {
      id: "create-content",
      title: "Create Content",
      description: "Generate AI-powered content with anti-detection capabilities",
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      path: "/content-generator-new",
      primary: true,
      badge: "Start Here"
    },
    {
      id: "clone-me",
      title: "Clone Me",
      description: "Generate content that mimics your unique writing style",
      icon: <Sparkles className="h-8 w-8 text-purple-600" />,
      path: "/clone-me",
      premium: true
    },
    {
      id: "analytics",
      title: "Performance Analytics",
      description: "Review content generation performance and insights",
      icon: <LineChart className="h-8 w-8 text-green-600" />,
      path: "/analytics"
    },
    {
      id: "ai-shield",
      title: "AI Detection Shield",
      description: "Analyze and improve content humanization",
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      path: "/ai-shield"
    }
  ];

  // Guided onboarding steps
  const guideSteps: GuideStep[] = [
    {
      id: "welcome",
      title: "Welcome to GhostliAI",
      description: "Get familiar with the platform",
      completed: true,
      path: "/"
    },
    {
      id: "first-content",
      title: "Create Your First Content",
      description: "Generate AI content with anti-detection",
      completed: false,
      path: "/content-generator-new"
    },
    {
      id: "clone-setup",
      title: "Set Up Clone Me",
      description: "Upload samples of your writing style",
      completed: false,
      path: "/clone-me"
    },
    {
      id: "export-content",
      title: "Export & Use Content",
      description: "Download and share your generated content",
      completed: false,
      path: "/export"
    }
  ];

  const completedSteps = guideSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / guideSteps.length) * 100;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to GhostliAI
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform your content creation with AI-powered writing that bypasses detection systems
        </p>
      </div>

      {/* Credits Display */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <CreditsDisplay />
        </div>
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Getting Started Guide
          </CardTitle>
          <CardDescription>
            Follow these steps to get the most out of GhostliAI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedSteps} of {guideSteps.length} completed
            </span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
          
          <div className="grid gap-3">
            {guideSteps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(step.path)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Quick Actions</h2>
          <p className="text-muted-foreground">Choose an action to get started with GhostliAI</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Card 
              key={action.id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                action.primary ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-md' : ''
              }`}
              onClick={() => navigate(action.path)}
            >
              <CardHeader className="text-center space-y-4 pb-4">
                <div className="flex justify-center">
                  {action.icon}
                </div>
                <div>
                  <CardTitle className="flex items-center justify-center gap-2 text-lg">
                    {action.title}
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                    {action.premium && (
                      <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                        Premium
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-center mt-2 text-sm">
                    {action.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className="w-full"
                  variant={action.primary ? "default" : "outline"}
                  size="lg"
                >
                  {action.primary ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Open
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <CardTitle>Anti-AI Detection</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Advanced humanization technology that bypasses AI detection systems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <CardTitle>Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Track your content performance and optimization metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <CardTitle>Writing Style Cloning</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Generate content that matches your unique voice and style
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Call-to-Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardContent className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">Ready to Create Amazing Content?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start generating AI-powered content that passes detection systems and engages your audience.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/content-generator-new")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Creating Content
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}