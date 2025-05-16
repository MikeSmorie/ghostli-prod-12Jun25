import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Lock, Shield } from "lucide-react";

export default function EmergencyLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Emergency admin password and token are hardcoded for simplicity
  // In a real system, these would be environment variables or secured credentials
  const EMERGENCY_ADMIN_PASSWORD = "GodModeAccess!123";
  const EMERGENCY_TOKEN = "EMERGENCY_ACCESS_TOKEN_2025";
  
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  // Handle emergency login
  const handleEmergencyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Short timeout to simulate a server request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (token) {
        // Token-based emergency login
        if (token !== EMERGENCY_TOKEN) {
          throw new Error("Invalid emergency token");
        }
        
        toast({
          title: "Emergency Access Granted",
          description: "You have been granted emergency access to the system",
        });
        
        // Set a localStorage token for the emergency session 
        localStorage.setItem("emergencyAccess", "true");
        
        // Redirect to God Mode dashboard
        navigate("/god-mode-admin");
        return;
      }
      
      // Password-based emergency login
      if (adminPassword !== EMERGENCY_ADMIN_PASSWORD) {
        throw new Error("Invalid emergency password");
      }
      
      toast({
        title: "Emergency Access Granted",
        description: "You have been granted emergency access to the system",
      });
      
      // Set a localStorage token for the emergency session
      localStorage.setItem("emergencyAccess", "true");
      
      // Redirect to God Mode dashboard
      navigate("/god-mode-admin");
      
    } catch (err: any) {
      setError(err.message || "Emergency access failed");
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: err.message || "Emergency access failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl">Emergency System Access</CardTitle>
          </div>
          <CardDescription>
            This access method bypasses standard security measures and is for emergency situations only.
            All actions will be logged and monitored.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleEmergencyLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {token ? (
              <div className="p-3 rounded-md bg-amber-500/10">
                <p className="text-sm text-amber-600">
                  Using token authentication. This token provides direct system access.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Emergency Admin Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Enter emergency admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  For demo purposes, use: GodModeAccess!123
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || (!token && !adminPassword)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Access System
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/")}
            >
              Return to Standard Login
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-4 text-xs text-center text-muted-foreground max-w-md">
        This emergency login bypasses normal authentication procedures. 
        All actions performed after emergency login will be logged for security auditing.
      </p>
    </div>
  );
}