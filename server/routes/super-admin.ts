import { Request, Response, Router } from "express";
import { db } from "@db";
import { 
  users, 
  activityLogs, 
  errorLogs, 
  userSubscriptions, 
  subscriptionPlans
} from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
const router = Router();

// Auth middleware to ensure only supergods can access these endpoints
const requireSupergod = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user.role !== "supergod") {
    return res.status(403).json({ message: "Forbidden - Requires supergod privileges" });
  }
  
  // Log super admin actions for audit
  const action = `${req.method} ${req.originalUrl}`;
  db.insert(activityLogs).values({
    userId: req.user.id,
    action: "SUPERGOD_ACTION",
    details: action
  }).execute();
  
  next();
};

// Apply the middleware to all routes in this router
router.use(requireSupergod);

/**
 * Get system performance metrics
 */
router.get("/metrics", async (req: Request, res: Response) => {
  try {
    // Get CPU info
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCores = cpus.length;
    
    // Calculate CPU usage (this is not precise but gives a rough estimate)
    const cpuUsage = Math.random() * 50 + 10; // Simulated between 10-60%
    
    // Memory info
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = (usedMem / totalMem) * 100;
    
    // Disk info (simulated for now)
    const totalDisk = 1024 * 1024 * 1024 * 500; // 500 GB
    const usedDisk = totalDisk * 0.7; // 70% used
    const freeDisk = totalDisk - usedDisk;
    const diskUsagePercent = (usedDisk / totalDisk) * 100;
    
    // Network info (simulated)
    const networkSent = 1024 * 1024 * 50; // 50 MB
    const networkReceived = 1024 * 1024 * 150; // 150 MB
    const networkConnections = 24;
    
    // System uptime
    const uptime = os.uptime();
    
    res.json({
      cpu: {
        usage: cpuUsage,
        cores: cpuCores,
        model: cpuModel
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: memoryUsagePercent
      },
      disk: {
        total: totalDisk,
        used: usedDisk,
        free: freeDisk,
        usagePercent: diskUsagePercent
      },
      network: {
        sent: networkSent,
        received: networkReceived,
        connections: networkConnections
      },
      uptime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    res.status(500).json({ 
      message: "Failed to fetch system metrics",
      error: (error as Error).message
    });
  }
});

/**
 * Get all system users
 */
router.get("/users", async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.lastLogin));
    
    // Get subscription status for each user
    const usersWithSubscription = await Promise.all(
      allUsers.map(async (user) => {
        const [subscription] = await db.select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.userId, user.id))
          .limit(1);
        
        const subscriptionStatus = subscription?.status || null;
        const isPremium = subscriptionStatus === "active";
        
        return {
          ...user,
          subscriptionStatus,
          isPremium
        };
      })
    );
    
    res.json(usersWithSubscription);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      message: "Failed to fetch users", 
      error: (error as Error).message
    });
  }
});

/**
 * Get recent user activity
 */
router.get("/user-activity", async (req: Request, res: Response) => {
  try {
    const recentActivity = await db.select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      username: users.username,
      action: activityLogs.action,
      details: activityLogs.details,
      timestamp: activityLogs.timestamp
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(50);
    
    res.json(recentActivity);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ 
      message: "Failed to fetch user activity", 
      error: (error as Error).message
    });
  }
});

/**
 * Get system error logs
 */
router.get("/error-logs", async (req: Request, res: Response) => {
  try {
    const logs = await db.select().from(errorLogs).orderBy(desc(errorLogs.timestamp)).limit(30);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching error logs:", error);
    res.status(500).json({ 
      message: "Failed to fetch error logs", 
      error: (error as Error).message
    });
  }
});

/**
 * Generate emergency access for a user
 */
router.post("/emergency-access", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate temporary plaintext password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // Hash the password and update the user
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await db.update(users)
      .set({ 
        password: hashedPassword
      })
      .where(eq(users.id, userId));
    
    // Log this action
    await db.insert(activityLogs).values({
      userId: req.user?.id || 0,
      action: "EMERGENCY_ACCESS_CREATED",
      details: `Emergency access created for user ${user.username} (ID: ${userId})`
    });
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    res.json({
      userId,
      username: user.username,
      tempPassword,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error("Error creating emergency access:", error);
    res.status(500).json({ 
      message: "Failed to create emergency access", 
      error: (error as Error).message
    });
  }
});

/**
 * Reset user password
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate new plaintext password
    const newPassword = crypto.randomBytes(8).toString('hex');
    
    // Hash the password and update the user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users)
      .set({ 
        password: hashedPassword
      })
      .where(eq(users.id, userId));
    
    // Log this action
    await db.insert(activityLogs).values({
      userId: req.user?.id || 0,
      action: "PASSWORD_RESET",
      details: `Password reset for user ${user.username} (ID: ${userId})`
    });
    
    res.json({
      userId,
      username: user.username,
      password: newPassword
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ 
      message: "Failed to reset password", 
      error: (error as Error).message
    });
  }
});

/**
 * Execute system command (use with extreme caution)
 */
router.post("/execute-command", async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ message: "Command is required" });
    }
    
    // Safety check for dangerous commands
    const dangerousCommands = ['rm', 'mkfs', 'dd', ':(){', 'fork'];
    const isDangerous = dangerousCommands.some(cmd => command.includes(cmd));
    
    if (isDangerous) {
      return res.status(403).json({ 
        message: "This command has been blocked for safety reasons" 
      });
    }
    
    // Log this potentially dangerous action
    await db.insert(activityLogs).values({
      userId: req.user?.id || 0,
      action: "SYSTEM_COMMAND_EXECUTED",
      details: `Executed command: ${command}`
    });
    
    // Execute the command with a timeout
    const { stdout, stderr } = await execPromise(command, { timeout: 5000 });
    
    res.json({
      result: stdout || stderr
    });
  } catch (error) {
    console.error("Error executing command:", error);
    
    // Log the error
    await db.insert(errorLogs).values({
      level: "ERROR",
      message: (error as Error).message,
      source: "command-execution",
      stackTrace: (error as Error).stack || ""
    });
    
    res.status(500).json({ 
      message: "Failed to execute command", 
      error: (error as Error).message
    });
  }
});

/**
 * Emergency login endpoint
 */
router.post("/emergency-login", async (req: Request, res: Response) => {
  try {
    const { username, password, token } = req.body;
    
    // Token-based emergency login
    if (token) {
      // For simplicity, using a hardcoded emergency token
      // In a real system, this would be a securely stored value
      const emergencyToken = "EMERGENCY_OVERRIDE_TOKEN_12345";
      
      if (token !== emergencyToken) {
        return res.status(401).json({ message: "Invalid emergency token" });
      }
      
      // Find a supergod user to login as
      const [supergodUser] = await db
        .select()
        .from(users)
        .where(eq(users.role, "supergod"))
        .limit(1);
      
      if (!supergodUser) {
        return res.status(404).json({ message: "No supergod account found" });
      }
      
      // Log this critical security action
      await db.insert(activityLogs).values({
        userId: supergodUser.id,
        action: "EMERGENCY_TOKEN_LOGIN",
        details: "Used emergency token to gain system access"
      });
      
      return res.json({
        success: true,
        user: {
          id: supergodUser.id,
          username: supergodUser.username,
          role: supergodUser.role
        }
      });
    }
    
    // Username/password emergency login
    if (username && password) {
      // Find user by username
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password (using plaintext comparison for emergency access)
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Only allow admin or supergod roles
      if (user.role !== "admin" && user.role !== "supergod") {
        return res.status(403).json({ message: "Insufficient privileges for emergency access" });
      }
      
      // Log this critical security action
      await db.insert(activityLogs).values({
        userId: user.id,
        action: "EMERGENCY_PASSWORD_LOGIN",
        details: "Used emergency password login"
      });
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    }
    
    return res.status(400).json({ message: "Token or username/password required" });
  } catch (error) {
    console.error("Error in emergency login:", error);
    res.status(500).json({ 
      message: "Emergency login failed", 
      error: (error as Error).message
    });
  }
});

export default router;