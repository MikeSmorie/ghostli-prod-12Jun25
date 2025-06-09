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
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(compression());
app.set("trust proxy", 1);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path.includes("/purchase") || req.path.includes("/credits");
  },
});

const contentGenerationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message:
    "Content generation rate limit exceeded. Please wait before generating more content.",
  standardHeaders: true,
  legacyHeaders: false,
});

const aiDetectionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message:
    "AI detection rate limit exceeded. Please wait before running more detections.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use(generalLimiter);
app.use("/api/content", contentGenerationLimiter);
app.use("/api/ai-detection", aiDetectionLimiter);

// Module manager
const moduleManager = new ModuleManager();

const testModule: IModule = {
  name: "testModule",
  inputSchema: { data: "string" },
  outputSchema: { result: "string" },
  async process(input: any) {
    console.log(`[DEBUG] Processing input: ${input.data}`);
    return { result: `Processed: ${input.data}` };
  },
};

moduleManager.registerModule(testModule);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

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

// Module test route
app.get("/api/module/test", async (req, res) => {
  try {
    const result = await moduleManager.runModule("testModule", {
      data: "hello",
    });
    console.log("[DEBUG] Module test result:", result);
    res.json({ message: "Module test successful", result });
  } catch (error) {
    console.error("[ERROR] Module test failed:", error);
    res.status(500).json({ error: "Module test failed" });
  }
});

// Register all API routes
const server = registerRoutes(app);

// Global error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  throw err;
});

// Start server (Fly requires PORT 8080)
(async () => {
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
