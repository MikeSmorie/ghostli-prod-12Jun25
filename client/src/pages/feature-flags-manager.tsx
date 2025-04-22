import React from "react";
import { FeatureFlagManager } from "@/components/feature-flag-manager";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

export default function FeatureFlagsManagerPage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Only allow admins to access this page
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Feature Flags Manager</h1>
        <p className="text-muted-foreground mt-2">
          Control which features are available to different subscription tiers
        </p>
      </div>
      
      <FeatureFlagManager />
    </div>
  );
}