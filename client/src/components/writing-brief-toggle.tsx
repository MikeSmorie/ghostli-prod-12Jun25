import { useState } from "react";
import { useFeatureFlags, FEATURES } from "../hooks/use-feature-flags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureGuard } from "./feature-guard";
import { WritingBriefForm } from "./writing-brief-form"; // Import the regular/lite brief form
import { ProWritingBrief } from "./pro-writing-brief"; // Import the pro brief form

export function WritingBriefToggle() {
  const { hasFeature, isProUser } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState<string>(
    isProUser() ? "pro" : "lite"
  );

  // Handler for tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Content Generation Brief</CardTitle>
        <CardDescription>
          Define your content requirements and let our AI generate high-quality content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* If user has access to pro, show the tabs to toggle between lite and pro */}
        {hasFeature(FEATURES.WRITING_BRIEF_PRO) ? (
          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="lite">Quick Brief</TabsTrigger>
              <TabsTrigger value="pro">Advanced Brief</TabsTrigger>
            </TabsList>
            <TabsContent value="lite">
              <WritingBriefForm />
            </TabsContent>
            <TabsContent value="pro">
              <ProWritingBrief />
            </TabsContent>
          </Tabs>
        ) : (
          // If user only has lite access, show lite form with option to upgrade
          <>
            <WritingBriefForm />
            
            <div className="mt-8 p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-md">
              <h3 className="font-semibold text-lg mb-2">Want more control?</h3>
              <p className="mb-4">
                Upgrade to Pro for advanced content customization options, including humanization settings,
                Clone Me voice replication, and premium content generation up to 5,000 words.
              </p>
              <FeatureGuard
                featureName={FEATURES.WRITING_BRIEF_PRO}
                showUpgradeDialog={true}
              >
                <Button>Access Pro Features</Button>
              </FeatureGuard>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}