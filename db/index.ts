import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced database connection with comprehensive error handling
export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws,
});

// Database connection health check
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to verify connection
    await db.execute('SELECT 1 as health_check');
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Initialize database connection verification on startup
verifyDatabaseConnection()
  .then(isHealthy => {
    if (isHealthy) {
      console.log("Database connection verified successfully");
    } else {
      console.error("Database connection verification failed");
    }
  })
  .catch(error => {
    console.error("Database initialization error:", error);
  });
