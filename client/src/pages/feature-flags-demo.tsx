import React from 'react';
import { useFeatureFlags, FEATURES } from '@/hooks/use-feature-flags';
import { useUser } from '@/hooks/use-user';
import { FeatureFlagManager } from '@/components/feature-flag-manager';
import { FeatureGuard } from '@/components/feature-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Check, Crown, X } from 'lucide-react';

export default function FeatureFlagsDemo() {
  const { hasFeature, isPro, getTier } = useFeatureFlags();
  const { user } = useUser();

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">GhostliAI Feature Access</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FeatureFlagManager />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current User</CardTitle>
              <CardDescription>Your account and subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Username:</span>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Subscription Tier:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{getTier()}</span>
                      {isPro() && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Features Enabled:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-medium">{Object.values(FEATURES).filter(f => hasFeature(f)).length} / {Object.values(FEATURES).length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Sign in to view your features
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Feature Access Examples</CardTitle>
              <CardDescription>See how feature guarding works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Clone Me</h3>
                <FeatureGuard 
                  feature={FEATURES.CLONE_ME}
                  showUpgradeInfo
                >
                  <div className="bg-primary/10 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Clone Me feature is enabled</span>
                    </div>
                  </div>
                </FeatureGuard>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-3">Content Generation</h3>
                <FeatureGuard 
                  feature={FEATURES.CONTENT_GENERATION}
                  showUpgradeInfo
                >
                  <div className="bg-primary/10 p-3 rounded-md">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Basic Content Generation</span>
                      </div>
                      
                      <FeatureGuard 
                        feature={FEATURES.HIGH_WORD_COUNT}
                        fallback={
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4 text-destructive" />
                            <span className="text-sm text-muted-foreground">High Word Count (Pro only)</span>
                          </div>
                        }
                        hideIfDisabled={false}
                      >
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">High Word Count (5000+ words)</span>
                        </div>
                      </FeatureGuard>
                    </div>
                  </div>
                </FeatureGuard>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-3">Content Formats</h3>
                <Tabs defaultValue="basic">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="basic" className="flex-1">Basic Export</TabsTrigger>
                    <TabsTrigger value="advanced" className="flex-1">Advanced Export</TabsTrigger>
                  </TabsList>
                  
                  <div className="bg-muted/40 rounded-md p-3 min-h-[100px]">
                    <div data-value="basic" className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Plain Text Export</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Copy to Clipboard</span>
                      </div>
                    </div>
                    
                    <div data-value="advanced">
                      <FeatureGuard 
                        feature={FEATURES.MULTIPLE_EXPORT_FORMATS}
                        showUpgradeInfo
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="text-sm">PDF Export</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="text-sm">Word Document Export</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="text-sm">HTML Format Export</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="text-sm">Markdown Export</span>
                          </div>
                        </div>
                      </FeatureGuard>
                    </div>
                  </div>
                </Tabs>
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  View All Features
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}