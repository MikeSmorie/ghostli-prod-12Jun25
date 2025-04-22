import React, { useState } from "react";
import { FeatureGuard, FeatureRequiredDialog } from "@/components/feature-guard";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { Loader2, Lock, Star, Zap, BarChart3, Database, FileText, Globe } from "lucide-react";

// Example features for the demo
const FEATURES = [
  {
    name: "advancedAnalytics",
    title: "Advanced Analytics",
    description: "Comprehensive data analytics with detailed reports and visualizations",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "bg-blue-500"
  },
  {
    name: "dataExports",
    title: "Data Exports",
    description: "Export your data in multiple formats for external analysis",
    icon: <Database className="h-6 w-6" />,
    color: "bg-green-500"
  },
  {
    name: "templateLibrary",
    title: "Template Library",
    description: "Access to premium templates and custom document formats",
    icon: <FileText className="h-6 w-6" />,
    color: "bg-purple-500"
  },
  {
    name: "globalAccess",
    title: "Global Access",
    description: "Access your documents from anywhere in the world",
    icon: <Globe className="h-6 w-6" />,
    color: "bg-amber-500"
  }
];

export default function FeatureFlagsDemoPage() {
  const { user, isLoading: authLoading } = useUser();
  const { features, isLoading } = useFeatureFlags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedTier, setSelectedTier] = useState("");

  const handleFeatureClick = (featureName: string, tierRequired: string) => {
    setSelectedFeature(featureName);
    setSelectedTier(tierRequired);
    setDialogOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Feature Flags Demo</h1>
        <p className="text-muted-foreground mt-2">
          This page demonstrates how features can be conditionally rendered based on subscription tiers
        </p>
        
        {user && (
          <div className="mt-4 flex items-center gap-2">
            <p>Logged in as: <strong>{user.username}</strong></p>
            <Badge>{user.role}</Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="features">Feature Guards</TabsTrigger>
          <TabsTrigger value="buttons">Feature Buttons</TabsTrigger>
        </TabsList>
        
        {/* Tab content for feature guards that conditionally render content */}
        <TabsContent value="features" className="space-y-4 mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.name} className="overflow-hidden">
                <CardHeader className={`text-white ${feature.color}`}>
                  <div className="flex justify-between">
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    {feature.icon}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardDescription className="mt-2">{feature.description}</CardDescription>
                </CardContent>
                <FeatureGuard featureName={feature.name}>
                  <CardFooter className="bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-sm font-semibold">You have access to this feature!</p>
                  </CardFooter>
                </FeatureGuard>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Tab content for buttons that trigger dialogs */}
        <TabsContent value="buttons" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Access Testing</CardTitle>
              <CardDescription>
                Click the buttons below to test feature access. If you don't have access,
                a dialog will prompt you to upgrade your subscription.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => {
                // Find the tier required for this feature from our features list
                const featureInfo = features?.find(f => f.featureName === feature.name);
                const tierRequired = featureInfo?.tierLevel || "premium";
                
                return (
                  <Button 
                    key={feature.name}
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleFeatureClick(feature.title, tierRequired)}
                  >
                    {feature.icon}
                    <span>{feature.title}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog that appears when a user clicks a feature they don't have access to */}
      <FeatureRequiredDialog
        featureName={selectedFeature}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tierRequired={selectedTier}
      />
    </div>
  );
}