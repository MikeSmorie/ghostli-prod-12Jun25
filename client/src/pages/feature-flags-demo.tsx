import { useUser } from "../hooks/use-user";
import { FeatureGuard } from "../components/feature-guard";
import { FeatureFlagManager } from "../components/feature-flag-manager";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeatureFlags, FEATURES } from "../hooks/use-feature-flags";
import { UserCircle2, LogIn, Crown, Sparkles, ArrowRight } from "lucide-react";

export default function FeatureFlagsDemo() {
  const { user, isAuthenticated } = useUser();
  const { isProUser } = useFeatureFlags();
  
  if (!isAuthenticated) {
    return (
      <div className="container max-w-screen-lg mx-auto py-12 px-4">
        <Card className="my-8">
          <CardHeader>
            <CardTitle className="text-2xl">Feature Access Demo</CardTitle>
            <CardDescription>
              Sign in to view and test feature flags
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-10">
            <UserCircle2 className="h-16 w-16 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              You need to be logged in to view your subscription features.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isPro = isProUser();
  
  return (
    <div className="container max-w-screen-lg mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Feature Access</h1>
          <p className="text-muted-foreground">
            View and test features based on your subscription tier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Logged in as {user?.username}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <UserCircle2 className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Your Subscription Status</CardTitle>
            <CardDescription>
              View which features are available to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-6">
              <div className="mr-4">
                {isPro ? (
                  <div className="p-3 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100">
                    <Crown className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="p-3 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-100">
                    <Sparkles className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  {isPro ? "GhostliAI Pro" : "GhostliAI Lite"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isPro
                    ? "You have access to all premium features"
                    : "Free tier with basic content generation features"}
                </p>
              </div>
            </div>

            {!isPro && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <h3 className="font-medium mb-2">Upgrade to Pro</h3>
                <p className="text-sm mb-3">
                  Get access to advanced features like humanization settings, Clone Me, and premium content generation.
                </p>
                <Button asChild size="sm">
                  <Link href="/subscription">
                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                    View Pro Plans
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Test</CardTitle>
            <CardDescription>
              Try accessing a premium feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Clone Me</h3>
                <FeatureGuard
                  featureName={FEATURES.CLONE_ME}
                  fallback={
                    <p className="text-sm text-muted-foreground mb-2">
                      This premium feature requires Pro subscription
                    </p>
                  }
                >
                  <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                    ✓ You have access to this feature
                  </p>
                </FeatureGuard>
                <Button
                  variant={isPro ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  {isPro ? "Use Clone Me" : "Try Clone Me"}
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-2">Basic Generation</h3>
                <FeatureGuard
                  featureName={FEATURES.CONTENT_GENERATION_BASIC}
                  fallback={
                    <p className="text-sm text-muted-foreground mb-2">
                      Access issue with basic generation
                    </p>
                  }
                >
                  <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                    ✓ Free for all users
                  </p>
                </FeatureGuard>
                <Button size="sm" className="w-full">
                  Generate Content
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FeatureFlagManager />
    </div>
  );
}