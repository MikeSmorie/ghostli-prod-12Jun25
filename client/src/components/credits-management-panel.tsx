import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Plus, Settings, DollarSign, Users, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface User {
  id: number;
  username: string;
  email: string | null;
  role: string;
  credits: number;
  creditExempt: boolean;
  createdAt: string;
}

interface GlobalSetting {
  settingKey: string;
  settingValue: string;
  description: string | null;
}

export default function CreditsManagementPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [newDefaultCredits, setNewDefaultCredits] = useState("");

  // Fetch all users with credit information
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/supergod/credits/users"],
    queryFn: async () => {
      const response = await fetch("/api/supergod/credits/users", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    }
  });

  // Fetch global settings
  const { data: settings = [], isLoading: settingsLoading } = useQuery<GlobalSetting[]>({
    queryKey: ["/api/supergod/credits/settings"],
    queryFn: async () => {
      const response = await fetch("/api/supergod/credits/settings", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    }
  });

  // Toggle credit exemption
  const toggleExemptionMutation = useMutation({
    mutationFn: async ({ userId, exempt }: { userId: number; exempt: boolean }) => {
      const response = await fetch(`/api/supergod/credits/users/${userId}/exemption`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ creditExempt: exempt })
      });
      if (!response.ok) throw new Error("Failed to update exemption");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supergod/credits/users"] });
      toast({
        title: "Exemption Updated",
        description: "User credit exemption status has been updated."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update exemption"
      });
    }
  });

  // Add credits manually
  const addCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number; amount: number }) => {
      const response = await fetch(`/api/supergod/credits/users/${userId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error("Failed to add credits");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supergod/credits/users"] });
      setCreditsToAdd("");
      setSelectedUserId(null);
      toast({
        title: "Credits Added",
        description: "Credits have been successfully added to the user account."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add credits"
      });
    }
  });

  // Update default first-time credits
  const updateDefaultCreditsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch("/api/supergod/credits/settings/default-credits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error("Failed to update default credits");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supergod/credits/settings"] });
      setNewDefaultCredits("");
      toast({
        title: "Default Credits Updated",
        description: "Default first-time credits setting has been updated."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update default credits"
      });
    }
  });

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const defaultCredits = settings.find(s => s.settingKey === "default_first_time_credits")?.settingValue || "100";

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <CreditCard className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Credits Management</h2>
      </div>

      {/* Global Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Global Settings</span>
          </CardTitle>
          <CardDescription>
            Configure system-wide credit settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="default-credits">Default First-Time Credits</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="default-credits"
                  placeholder={defaultCredits}
                  value={newDefaultCredits}
                  onChange={(e) => setNewDefaultCredits(e.target.value)}
                  type="number"
                  min="0"
                />
                <Button
                  onClick={() => {
                    const amount = parseInt(newDefaultCredits);
                    if (amount >= 0) {
                      updateDefaultCreditsMutation.mutate(amount);
                    }
                  }}
                  disabled={!newDefaultCredits || updateDefaultCreditsMutation.isPending}
                >
                  {updateDefaultCreditsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Current: {defaultCredits} credits
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Credits Management</span>
          </CardTitle>
          <CardDescription>
            Manage individual user credits and exemptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Exemption</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          {user.email && (
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "supergod" ? "default" : user.role === "admin" ? "secondary" : "outline"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">{user.credits.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.creditExempt}
                          onCheckedChange={(checked) => {
                            toggleExemptionMutation.mutate({
                              userId: user.id,
                              exempt: checked
                            });
                          }}
                          disabled={toggleExemptionMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUserId(user.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Credits
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Credits to {user.username}</DialogTitle>
                              <DialogDescription>
                                Enter the number of credits to add to this user's account.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="credits-amount">Credits to Add</Label>
                                <Input
                                  id="credits-amount"
                                  type="number"
                                  min="1"
                                  placeholder="Enter amount..."
                                  value={creditsToAdd}
                                  onChange={(e) => setCreditsToAdd(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <Button
                                  onClick={() => {
                                    const amount = parseInt(creditsToAdd);
                                    if (amount > 0 && selectedUserId) {
                                      addCreditsMutation.mutate({
                                        userId: selectedUserId,
                                        amount
                                      });
                                    }
                                  }}
                                  disabled={!creditsToAdd || addCreditsMutation.isPending}
                                >
                                  {addCreditsMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                  )}
                                  Add Credits
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}