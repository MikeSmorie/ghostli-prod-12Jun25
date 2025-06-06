import express, { type Request, Response, NextFunction } from "express";
import "express-async-errors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ModuleManager } from "./moduleManager";

interface IModule {
  name: string;
  inputSchema: any;
  outputSchema: any;
  process: (input: any) => Promise<any>;
}

const app = express();

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development/flexibility
  crossOriginEmbedderPolicy: false
}));
app.use(compression()); // Gzip compression for all responses

// Trust proxy for proper IP handling in deployment
app.set('trust proxy', 1);

// Rate limiting for API protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const contentGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit content generation to 10 requests per minute per IP
  message: 'Content generation rate limit exceeded. Please wait before generating more content.',
  standardHeaders: true,
  legacyHeaders: false,
});

const aiDetectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Allow more AI detection requests
  message: 'AI detection rate limit exceeded. Please wait before running more detections.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Initialize module manager
const moduleManager = new ModuleManager();

// Register test module
const testModule: IModule = {
  name: "testModule",
  inputSchema: { data: "string" },
  outputSchema: { result: "string" },
  async process(input: any) {
    console.log(`[DEBUG] Processing input: ${input.data}`);
    return { result: `Processed: ${input.data}` };
  }
};

moduleManager.registerModule(testModule);

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log API requests on completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Test endpoint for module manager
app.get("/api/module/test", async (req, res) => {
  try {
    const result = await moduleManager.runModule("testModule", { data: "hello" });
    console.log("[DEBUG] Module test result:", result);
    res.json({ message: "Module test successful", result });
  } catch (error) {
    console.error("[ERROR] Module test failed:", error);
    res.status(500).json({ error: "Module test failed" });
  }
});

(async () => {
  // Register all API routes and create HTTP server
  const server = registerRoutes(app);

  // Global error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup development/production server
  if (app.get("env") === "development") {
    await setupVite(app, server); // Development: Vite dev server
  } else {
    serveStatic(app); // Production: Static file serving
  }

  // Start server on port 5000
  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();