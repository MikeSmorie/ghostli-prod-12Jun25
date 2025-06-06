import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useAdmin } from "@/contexts/admin-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Activity,
  AlertTriangle,
  ArrowLeft, 
  Check, 
  ChevronDown, 
  Copy,
  Cpu, 
  Database, 
  Download, 
  HardDrive, 
  Key, 
  Loader2, 
  Lock, 
  RefreshCw, 
  Search, 
  Shield, 
  ShieldAlert, 
  Terminal, 
  User, 
  Users, 
  WifiOff
} from "@/lib/icons";

// Type definitions
interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    sent: number;
    received: number;
    connections: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
  timestamp: string;
}

interface SystemUser {
  id: number;
  username: string;
  email: string | null;
  role: string;
  lastLogin: string;
  createdAt: string;
  lastActivity?: string;
  subscriptionStatus?: string;
  isPremium?: boolean;
}

interface UserActivity {
  id: number;
  userId: number;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface ErrorLog {
  id: number;
  userId: number | null;
  errorCode: string;
  message: string;
  stackTrace: string;
  path: string;
  timestamp: string;
  resolved: boolean;
}

interface EmergencyAccessDetails {
  userId: number;
  username: string;
  tempPassword?: string;
  expiresAt?: string;
}

export default function GodModeDashboard() {
  const { user } = useUser();
  const { isSupergod } = useAdmin();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // State for user search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [emergencyAccessDetails, setEmergencyAccessDetails] = useState<EmergencyAccessDetails | null>(null);
  const [emergencyAccessOpen, setEmergencyAccessOpen] = useState(false);
  const [systemCommandInput, setSystemCommandInput] = useState("");
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [commandLoading, setCommandLoading] = useState(false);

  // Redirect non-supergods
  useEffect(() => {
    if (!isSupergod) {
      toast({
        title: "Access Denied",
        description: "You need Super-God privileges to access this page.",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [isSupergod, toast, navigate]);

  // Fetch system metrics
  const { 
    data: systemMetrics, 
    isLoading: metricsLoading,
    refetch: refetchMetrics
  } = useQuery<SystemMetrics>({
    queryKey: ["/api/super-admin/metrics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/super-admin/metrics");
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch all users
  const { 
    data: users, 
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useQuery<SystemUser[]>({
    queryKey: ["/api/super-admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/super-admin/users");
      return response.json();
    }
  });

  // Fetch recent user activity
  const { 
    data: userActivity, 
    isLoading: activityLoading,
    refetch: refetchActivity
  } = useQuery<UserActivity[]>({
    queryKey: ["/api/super-admin/user-activity"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/super-admin/user-activity");
      return response.json();
    }
  });

  // Fetch system error logs
  const { 
    data: errorLogs, 
    isLoading: errorLogsLoading,
    refetch: refetchErrorLogs
  } = useQuery<ErrorLog[]>({
    queryKey: ["/api/super-admin/error-logs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/super-admin/error-logs");
      return response.json();
    }
  });

  // Emergency access mutation
  const createEmergencyAccess = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/super-admin/emergency-access", { userId });
      return response.json();
    },
    onSuccess: (data) => {
      setEmergencyAccessDetails(data);
      setEmergencyAccessOpen(true);
      toast({
        title: "Emergency Access Created",
        description: "Temporary access has been generated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create emergency access: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Reset user password mutation
  const resetUserPassword = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/super-admin/reset-password", { userId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset Successful",
        description: `New password: ${data.password}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to reset password: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Execute system command mutation
  const executeSystemCommand = useMutation({
    mutationFn: async (command: string) => {
      setCommandLoading(true);
      const response = await apiRequest("POST", "/api/super-admin/execute-command", { command });
      return response.json();
    },
    onSuccess: (data) => {
      setCommandResult(data.result);
      setCommandLoading(false);
    },
    onError: (error: Error) => {
      setCommandResult(`Error: ${error.message}`);
      setCommandLoading(false);
      toast({
        title: "Command Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter users based on search query
  const filteredUsers = users?.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.id.toString().includes(searchQuery)
  );

  // Format bytes to more readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format uptime to human-readable format
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Handle user selection
  const handleUserSelect = (user: SystemUser) => {
    setSelectedUser(user);
  };

  // Handle emergency access creation
  const handleEmergencyAccess = () => {
    if (selectedUser) {
      createEmergencyAccess.mutate(selectedUser.id);
    }
  };

  // Handle password reset
  const handlePasswordReset = () => {
    if (selectedUser) {
      resetUserPassword.mutate(selectedUser.id);
    }
  };

  // Handle system command execution
  const handleExecuteCommand = () => {
    if (systemCommandInput.trim()) {
      executeSystemCommand.mutate(systemCommandInput);
    }
  };

  // Handle refresh all data
  const handleRefreshAll = () => {
    refetchMetrics();
    refetchUsers();
    refetchActivity();
    refetchErrorLogs();
    toast({
      title: "Refreshed",
      description: "All data has been refreshed",
    });
  };

  if (!isSupergod || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ShieldAlert className="h-12 w-12 text-destructive" />
            <p className="text-center">You need Super-God privileges to access this page.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (metricsLoading || usersLoading || activityLoading || errorLogsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Loading God Mode Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">God Mode Dashboard</h1>
          <Badge variant="outline" className="bg-destructive/10 text-destructive">
            Super-God Access
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit God Mode
          </Button>
        </div>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            System Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            User Activity
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Admin Controls
          </TabsTrigger>
        </TabsList>

        {/* System Overview Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Usage Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics?.cpu.usage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics?.cpu.cores} Cores | {systemMetrics?.cpu.model}
                </p>
                <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${systemMetrics?.cpu.usage || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics?.memory.usagePercent.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemMetrics?.memory.used || 0)} / {formatBytes(systemMetrics?.memory.total || 0)}
                </p>
                <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${systemMetrics?.memory.usagePercent || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Disk Usage Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics?.disk.usagePercent.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemMetrics?.disk.used || 0)} / {formatBytes(systemMetrics?.disk.total || 0)}
                </p>
                <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${systemMetrics?.disk.usagePercent || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Uptime & Network Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                    Online
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatUptime(systemMetrics?.uptime || 0)}
                  </span>
                </div>
                <div className="mt-2 text-xs">
                  <div className="flex justify-between">
                    <span>Network In</span>
                    <span>{formatBytes(systemMetrics?.network.received || 0)}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Out</span>
                    <span>{formatBytes(systemMetrics?.network.sent || 0)}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connections</span>
                    <span>{systemMetrics?.network.connections || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Logs */}
          <Card>
            <CardHeader>
              <CardTitle>System Error Logs</CardTitle>
              <CardDescription>Recent errors and exceptions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorLogs && errorLogs.length > 0 ? (
                    errorLogs.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {log.userId ? `ID: ${log.userId}` : 'Anonymous'}
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-xs" title={log.message}>
                            {log.errorCode}: {log.message}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.path}</TableCell>
                        <TableCell>
                          {log.resolved ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-500">
                              Unresolved
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No error logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username, email or ID..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={() => refetchUsers()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "supergod" ? "destructive" : 
                                   user.role === "admin" ? "default" : 
                                   "secondary"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUserSelect(user)}
                            >
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          {searchQuery ? "No users match your search" : "No users found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {selectedUser && (
                <div className="mt-6 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Manage User: {selectedUser.username}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-medium">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Login</p>
                      <p className="font-medium">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : "Never"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Subscription</p>
                      <p className="font-medium">{selectedUser.subscriptionStatus || "No subscription"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button variant="outline" className="flex items-center gap-2" onClick={handleEmergencyAccess}>
                      <Key className="h-4 w-4" />
                      Generate Emergency Access
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Reset Password
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset User Password</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will generate a new plaintext password for {selectedUser.username}.
                            This action cannot be undone and will invalidate the user's current password.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handlePasswordReset}>
                            Reset Password
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Access Dialog */}
          <Dialog open={emergencyAccessOpen} onOpenChange={setEmergencyAccessOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Emergency Access Generated</DialogTitle>
                <DialogDescription>
                  Temporary access details for {emergencyAccessDetails?.username}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted">
                  <p className="font-medium mb-2">Temporary Password:</p>
                  <p className="font-mono text-sm">{emergencyAccessDetails?.tempPassword}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expires at:</p>
                  <p>{emergencyAccessDetails?.expiresAt ? new Date(emergencyAccessDetails.expiresAt).toLocaleString() : "24 hours from generation"}</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setEmergencyAccessOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Analytics</CardTitle>
              <CardDescription>Recent user actions and behavior insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Users (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userActivity?.filter(a => 
                        new Date(a.timestamp).getTime() > Date.now() - 86400000
                      ).filter((v, i, a) => a.findIndex(t => t.userId === v.userId) === i).length || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Actions (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userActivity?.filter(a => 
                        new Date(a.timestamp).getTime() > Date.now() - 86400000
                      ).length || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Popular Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold truncate">
                      {userActivity?.length ? 
                        Object.entries(
                          userActivity.reduce((acc, curr) => {
                            acc[curr.action] = (acc[curr.action] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort((a, b) => b[1] - a[1])[0][0]
                        : "No data"
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Recent Activity</h3>
                <Button variant="outline" size="sm" onClick={() => refetchActivity()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActivity && userActivity.length > 0 ? (
                      userActivity.slice(0, 15).map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-mono text-xs">
                            {new Date(activity.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{activity.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>{activity.action}</TableCell>
                          <TableCell>
                            <div className="truncate max-w-xs" title={activity.details}>
                              {activity.details}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {activity.ipAddress}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No activity logs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Controls Tab */}
        <TabsContent value="admin" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Command Card */}
            <Card>
              <CardHeader>
                <CardTitle>System Command</CardTitle>
                <CardDescription>Execute low-level system commands</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Enter command..."
                    value={systemCommandInput}
                    onChange={(e) => setSystemCommandInput(e.target.value)}
                  />
                  <Button 
                    onClick={handleExecuteCommand}
                    disabled={commandLoading || !systemCommandInput.trim()}
                  >
                    {commandLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Terminal className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {commandResult && (
                  <div className="p-4 rounded-md bg-muted font-mono text-xs overflow-x-auto">
                    <pre>{commandResult}</pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Login Card */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Login</CardTitle>
                <CardDescription>Direct system access for emergency situations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select authentication type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="password">Password</SelectItem>
                        <SelectItem value="token">Auth Token</SelectItem>
                        <SelectItem value="bypass">Bypass Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button>Generate Link</Button>
                  </div>

                  <div className="p-4 rounded-md border">
                    <p className="text-sm font-medium mb-2">Emergency Access URL:</p>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/emergency-login?token=<will-be-generated>`} 
                        className="font-mono text-xs"
                      />
                      <Button variant="outline" size="icon">
                        <span className="h-4 w-4">📋</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This URL will provide direct access to the system with super-admin privileges.
                      All actions will be logged and audited.
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Emergency Shutdown
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Emergency System Shutdown</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will immediately terminate all connections and shut down the application server.
                          This action cannot be undone and will require a manual restart of the server.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground">
                          Confirm Shutdown
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Database Management */}
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>Manage database operations and maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Button variant="outline" className="flex items-center justify-center gap-2 h-20">
                  <Database className="h-5 w-5" />
                  <div className="text-left">
                    <h4 className="font-medium">Backup Database</h4>
                    <p className="text-xs text-muted-foreground">Create a full database backup</p>
                  </div>
                </Button>

                <Button variant="outline" className="flex items-center justify-center gap-2 h-20">
                  <Download className="h-5 w-5" />
                  <div className="text-left">
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-xs text-muted-foreground">Export database tables to CSV</p>
                  </div>
                </Button>

                <Button variant="outline" className="flex items-center justify-center gap-2 h-20">
                  <HardDrive className="h-5 w-5" />
                  <div className="text-left">
                    <h4 className="font-medium">Vacuum Database</h4>
                    <p className="text-xs text-muted-foreground">Optimize database storage</p>
                  </div>
                </Button>

                <Button variant="outline" className="flex items-center justify-center gap-2 h-20">
                  <Shield className="h-5 w-5" />
                  <div className="text-left">
                    <h4 className="font-medium">Security Audit</h4>
                    <p className="text-xs text-muted-foreground">Run security checks</p>
                  </div>
                </Button>
              </div>

              <div className="p-4 rounded-md bg-muted">
                <div className="flex items-start gap-2">
                  <WifiOff className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-500">Maintenance Mode Controls</h4>
                    <p className="text-sm mb-2">
                      Enable maintenance mode to temporarily disable public access to the application while
                      performing critical operations.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Enable Maintenance Mode
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        Disable Maintenance Mode
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}