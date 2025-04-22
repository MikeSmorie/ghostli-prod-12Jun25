import React, { useState } from "react";
import { useFeatureFlags, type FeatureFlag } from "@/hooks/use-feature-flags";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Plus, Trash, Edit, EyeOff, CheckCircle2, XCircle } from "lucide-react";

/**
 * Admin-only component for managing feature flags
 */
export function FeatureFlagManager() {
  const { features, isLoading, updateFeature, deleteFeature, isUpdating, isDeleting } = useFeatureFlags();
  const [newFeature, setNewFeature] = useState<Partial<FeatureFlag>>({
    featureName: "",
    isEnabled: true,
    tierLevel: "premium",
    description: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);

  const handleCreateOrUpdate = () => {
    if (!newFeature.featureName) return;
    
    updateFeature({
      featureName: newFeature.featureName,
      isEnabled: newFeature.isEnabled ?? true,
      tierLevel: newFeature.tierLevel ?? "premium",
      description: newFeature.description ?? null
    });
    
    // Reset form
    setNewFeature({
      featureName: "",
      isEnabled: true,
      tierLevel: "premium",
      description: ""
    });
    setEditMode(false);
  };

  const handleEdit = (feature: FeatureFlag) => {
    setNewFeature({
      featureName: feature.featureName,
      isEnabled: feature.isEnabled,
      tierLevel: feature.tierLevel,
      description: feature.description
    });
    setEditMode(true);
  };

  const confirmDelete = (featureName: string) => {
    setFeatureToDelete(featureName);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (featureToDelete) {
      deleteFeature(featureToDelete);
      setFeatureToDelete(null);
      setDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editMode ? "Edit Feature Flag" : "Create New Feature Flag"}
          </CardTitle>
          <CardDescription>
            {editMode 
              ? "Update an existing feature flag's settings" 
              : "Define a new feature that can be controlled by subscription tier"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="featureName">Feature Name</Label>
            <Input
              id="featureName"
              placeholder="advancedAnalytics"
              value={newFeature.featureName}
              onChange={(e) => setNewFeature({ ...newFeature, featureName: e.target.value })}
              disabled={editMode}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isEnabled">Enabled</Label>
            <Switch
              id="isEnabled"
              checked={newFeature.isEnabled}
              onCheckedChange={(checked) => setNewFeature({ ...newFeature, isEnabled: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tierLevel">Required Tier</Label>
            <Select
              value={newFeature.tierLevel}
              onValueChange={(value) => setNewFeature({ ...newFeature, tierLevel: value as any })}
            >
              <SelectTrigger id="tierLevel">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed analytics with advanced metrics and visualizations"
              value={newFeature.description || ""}
              onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => {
            setNewFeature({
              featureName: "",
              isEnabled: true,
              tierLevel: "premium",
              description: ""
            });
            setEditMode(false);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateOrUpdate} 
            disabled={!newFeature.featureName || isUpdating}
          >
            {editMode ? "Update" : "Create"} Feature
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Show skeleton cards when loading
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="opacity-50">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-muted rounded w-full"></div>
              </CardFooter>
            </Card>
          ))
        ) : (
          // Show actual feature cards
          features?.map((feature) => (
            <Card key={feature.featureName}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">
                    {feature.featureName}
                  </CardTitle>
                  {feature.isEnabled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <CardDescription>
                  Required tier: <span className="capitalize">{feature.tierLevel}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description || "No description provided"}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(feature)}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete(feature.featureName)}
                  disabled={isDeleting}
                >
                  <Trash className="h-4 w-4 mr-2" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation dialog for deleting features */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the feature flag "{featureToDelete}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}