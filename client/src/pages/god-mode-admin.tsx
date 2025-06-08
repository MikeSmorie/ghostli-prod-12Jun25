import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Activity,
  AlertTriangle,
  ArrowLeft,
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
  Ticket,
  User,
  Users,
  WifiOff
} from "lucide-react";
import { VoucherManagement } from "@/components/voucher-management";

// Simulated system metrics
const generateMetrics = () => ({
  cpu: {
    usage: Math.random() * 60 + 15,
    cores: 8,
    model: "Intel(R) Xeon(R) CPU @ 2.20GHz"
  },
  memory: {
    total: 16 * 1024 * 1024 * 1024,
    used: (Math.random() * 8 + 4) * 1024 * 1024 * 1024,
    free: (Math.random() * 4 + 4) * 1024 * 1024 * 1024,
    usagePercent: Math.random() * 60 + 15
  },
  disk: {
    total: 500 * 1024 * 1024 * 1024,
    used: (Math.random() * 250 + 150) * 1024 * 1024 * 1024,
    free: (Math.random() * 150 + 100) * 1024 * 1024 * 1024,
    usagePercent: Math.random() * 60 + 30
  },
  network: {
    sent: Math.random() * 50 * 1024 * 1024,
    received: Math.random() * 150 * 1024 * 1024,
    connections: Math.floor(Math.random() * 30 + 10)
  },
  uptime: Math.floor(Math.random() * 86400 * 7),
  timestamp: new Date().toISOString()
});

// Mock user data
const mockUsers = [
  { id: 1, username: "admin", email: "admin@example.com", role: "admin", lastLogin: new Date().toISOString(), createdAt: "2025-01-15T10:20:30.000Z", subscriptionStatus: "active", isPremium: true },
  { id: 2, username: "user1", email: "user1@example.com", role: "user", lastLogin: new Date(Date.now() - 86400000).toISOString(), createdAt: "2025-02-20T14:30:45.000Z", subscriptionStatus: "active", isPremium: true },
  { id: 3, username: "user2", email: "user2@example.com", role: "user", lastLogin: new Date(Date.now() - 86400000 * 2).toISOString(), createdAt: "2025-03-10T09:15:22.000Z", subscriptionStatus: "cancelled", isPremium: false },
];

// Mock activity logs
const mockActivity = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  userId: Math.floor(Math.random() * 3) + 1,
  username: ["admin", "user1", "user2"][Math.floor(Math.random() * 3)],
  action: ["LOGIN", "CONTENT_GENERATION", "SUBSCRIPTION_CHANGED", "PROFILE_UPDATE", "PASSWORD_RESET"][Math.floor(Math.random() * 5)],
  details: "Action performed by user",
  timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
}));

// Mock error logs
const mockErrors = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  userId: Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : null,
  errorCode: ["API_ERROR", "DATABASE_ERROR", "AUTH_ERROR", "PAYMENT_ERROR", "SYSTEM_ERROR"][Math.floor(Math.random() * 5)],
  message: "An error occurred during operation",
  path: ["/api/user", "/api/content", "/api/payment", "/api/subscription"][Math.floor(Math.random() * 4)],
  timestamp: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString(),
  resolved: Math.random() > 0.7
}));

export default function GodModeAdmin() {
  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State
  const [systemMetrics, setSystemMetrics] = useState(generateMetrics());
  const [users, setUsers] = useState(mockUsers);
  const [activityLogs, setActivityLogs] = useState(mockActivity);
  const [errorLogs, setErrorLogs] = useState(mockErrors);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [emergencyAccessDetails, setEmergencyAccessDetails] = useState<any>(null);
  const [emergencyAccessOpen, setEmergencyAccessOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandInput, setCommandInput] = useState("");
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [commandLoading, setCommandLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Simulated permission check
  if (user && user.role !== "admin" && user.role !== "supergod") {
    toast({
      title: "Access Denied",
      description: "You need administrator privileges to access this page.",
      variant: "destructive"
    });
    navigate("/");
    return null;
  }

  // Simulated metrics refresh
  const refreshMetrics = () => {
    setSystemMetrics(generateMetrics());
    toast({
      title: "System Metrics Updated",
      description: "System performance data has been refreshed."
    });
  };

  // Refresh all data
  const refreshAllData = () => {
    setLoading(true);
    setTimeout(() => {
      refreshMetrics();
      setActivityLogs(
        [...mockActivity].sort(() => Math.random() - 0.5)
      );
      setErrorLogs(
        [...mockErrors].sort(() => Math.random() - 0.5)
      );
      setLoading(false);
      toast({
        title: "Data Refreshed",
        description: "All system data has been updated."
      });
    }, 1000);
  };

  // Filtered users
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.id.toString().includes(searchQuery)
  );

  // Generate emergency access
  const handleEmergencyAccess = () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setTimeout(() => {
      const tempPassword = Math.random().toString(36).substring(2, 10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      setEmergencyAccessDetails({
        userId: selectedUser.id,
        username: selectedUser.username,
        tempPassword,
        expiresAt: expiresAt.toISOString()
      });
      
      setEmergencyAccessOpen(true);
      setLoading(false);
      
      toast({
        title: "Emergency Access Created",
        description: "Temporary access has been generated."
      });
    }, 1000);
  };

  // Reset user password
  const handlePasswordReset = () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setTimeout(() => {
      const newPassword = Math.random().toString(36).substring(2, 10);
      
      toast({
        title: "Password Reset",
        description: `New password for ${selectedUser.username}: ${newPassword}`
      });
      
      setLoading(false);
    }, 1000);
  };

  // Execute command
  const handleExecuteCommand = () => {
    if (!commandInput.trim()) return;
    
    setCommandLoading(true);
    setTimeout(() => {
      if (commandInput.includes("rm") || commandInput.includes("dd") || commandInput.includes("mkfs")) {
        setCommandResult("Error: This command has been blocked for security reasons.");
        toast({
          title: "Command Blocked",
          description: "This command could potentially harm the system and has been blocked.",
          variant: "destructive"
        });
      } else {
        setCommandResult(`Executed: ${commandInput}\n\nSystem response: Operation completed successfully. (Simulated result)`);
      }
      
      setCommandLoading(false);
    }, 1500);
  };

  // Format bytes to human-readable
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
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
            Administrator Access
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
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
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Vouchers
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
                  {systemMetrics.cpu.usage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics.cpu.cores} Cores | {systemMetrics.cpu.model}
                </p>
                <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${systemMetrics.cpu.usage}%` }}
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
                  {systemMetrics.memory.usagePercent.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
                </p>
                <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${systemMetrics.memory.usagePercent}%` }}
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
                  {systemMetrics.disk.usagePercent.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemMetrics.disk.used)} / {formatBytes(systemMetrics.disk.total)}
                </p>
                <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${systemMetrics.disk.usagePercent}%` }}
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
                    {formatUptime(systemMetrics.uptime)}
                  </span>
                </div>
                <div className="mt-2 text-xs">
                  <div className="flex justify-between">
                    <span>Network In</span>
                    <span>{formatBytes(systemMetrics.network.received)}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Out</span>
                    <span>{formatBytes(systemMetrics.network.sent)}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connections</span>
                    <span>{systemMetrics.network.connections}</span>
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
                  {errorLogs.length > 0 ? (
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
                <Button variant="outline" onClick={() => setUsers([...mockUsers])}>
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
                    {filteredUsers.length > 0 ? (
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
                              onClick={() => setSelectedUser(user)}
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
                      {activityLogs.filter(a => 
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
                      {activityLogs.filter(a => 
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
                      {activityLogs.length ? 
                        Object.entries(
                          activityLogs.reduce((acc: any, curr) => {
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
                <Button variant="outline" size="sm" onClick={() => setActivityLogs([...mockActivity])}>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.length > 0 ? (
                      activityLogs.slice(0, 15).map((activity, index) => (
                        <TableRow key={index}>
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
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
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

        {/* Voucher Management Tab */}
        <TabsContent value="vouchers" className="space-y-4">
          <VoucherManagement />
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
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                  />
                  <Button 
                    onClick={handleExecuteCommand}
                    disabled={commandLoading || !commandInput.trim()}
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
                  <div className="p-4 rounded-md border">
                    <p className="text-sm font-medium mb-2">Emergency Access URL:</p>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/emergency-login?token=EMERGENCY_TOKEN`} 
                        className="font-mono text-xs"
                      />
                      <Button variant="outline" size="icon">
                        <span className="h-4 w-4">📋</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This URL provides direct access to the system with administrative privileges.
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
                        <AlertDialogAction onClick={() => {
                          toast({
                            title: "System Shutdown Initiated",
                            description: "The server is shutting down...",
                            variant: "destructive"
                          });
                          setTimeout(() => navigate("/"), 2000);
                        }} className="bg-destructive text-destructive-foreground">
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
                <Button variant="outline" className="flex items-center justify-center gap-2 h-20" onClick={() => {
                  toast({
                    title: "Database Backup Initiated",
                    description: "A full database backup is being created."
                  });
                }}>
                  <Database className="h-5 w-5" />
                  <div className="text-left">
                    <h4 className="font-medium">Backup Database</h4>
                    <p className="text-xs text-muted-foreground">Create a full database backup</p>
                  </div>
                </Button>

                <Button variant="outline" className="flex items-center justify-center gap-2 h-20" onClick={() => {
                  toast({
                    title: "Export Started",
                    description: "Database tables are being exported to CSV."
                  });
                }}>
                  <Download className="h-5 w-5" />
                  <div className="text-left">
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-xs text-muted-foreground">Export database tables to CSV</p>
                  </div>
                </Button>

                <Button variant="outline" className="flex items-center justify-center gap-2 h-20" onClick={() => {
                  toast({
                    title: "Database Optimization",
                    description: "Database vacuum process has started."
                  });
                }}>
                  <HardDrive className="h-5 w-5" />
                  <div className="text-left">
                    <h4 className="font-medium">Vacuum Database</h4>
                    <p className="text-xs text-muted-foreground">Optimize database storage</p>
                  </div>
                </Button>

                <Button variant="outline" className="flex items-center justify-center gap-2 h-20" onClick={() => {
                  toast({
                    title: "Security Audit",
                    description: "System security checks are in progress."
                  });
                }}>
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
                      <Button variant="outline" size="sm" onClick={() => {
                        toast({
                          title: "Maintenance Mode Enabled",
                          description: "The system is now in maintenance mode."
                        });
                      }}>
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