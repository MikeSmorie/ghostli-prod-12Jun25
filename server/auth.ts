import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { type Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { UserRegistrationService } from "./services/user-registration";

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "writeright-security-key";
const JWT_EXPIRATION = '24h';

// Bcrypt Configuration
const SALT_ROUNDS = 10;

// Authentication helpers
const crypto = {
  hash: async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
  },
  compare: async (suppliedPassword: string, storedPassword: string): Promise<boolean> => {
    return bcrypt.compare(suppliedPassword, storedPassword);
  },
  generateToken: (user: { id: number; username: string; role: string }): string => {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );
  },
  verifyToken: (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
  }
};

// extend express user object with our schema
declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

// Middleware to authenticate with JWT
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: Express.User, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
    req.user = user;
    return next();
  })(req, res, next);
};

// Middleware to require specific roles
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: Authentication required" });
    }
    
    // Cast to our user type
    const user = req.user as SelectUser;
    
    // Check if user has the required role
    if (user.role !== role && 
        !(role === 'admin' && user.role === 'supergod')) { // supergod has admin privileges
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    next();
  };
};

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "porygon-supremacy",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Local Strategy for traditional login
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        // Update last login timestamp
        await db
          .update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Configure JWT Strategy for token-based authentication
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET
      },
      async (jwtPayload, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, jwtPayload.id))
            .limit(1);

          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid input: " + result.error.issues.map(i => i.message).join(", ")
        });
      }

      const { username, password } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({
          message: "Username already exists"
        });
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new user with initial login timestamp
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          role: "user", // Explicitly set role as user
          lastLogin: new Date() // Set initial login time
        })
        .returning();

      // Grant default first-time credits to new user
      await UserRegistrationService.handleNewUserRegistration(newUser.id);

      // Generate JWT token
      const token = crypto.generateToken({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      });
      
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({
            message: "Error during login after registration"
          });
        }
        return res.json({
          message: "Registration successful",
          user: { id: newUser.id, username: newUser.username, role: newUser.role },
          token // Return the JWT token to the client
        });
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  });

  app.post("/api/register-admin", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid input: " + result.error.issues.map(i => i.message).join(", ")
        });
      }

      const { username, password } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({
          message: "Username already exists"
        });
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new admin user
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          role: "admin", // Set role as admin
          lastLogin: new Date() // Set initial login time
        })
        .returning();

      // Generate JWT token
      const token = crypto.generateToken({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      });
      
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({
            message: "Error during login after registration"
          });
        }
        return res.json({
          message: "Admin registration successful",
          user: { id: newUser.id, username: newUser.username, role: newUser.role },
          token // Return the JWT token to the client
        });
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  });
  
  // Register a supergod user (highest privilege)
  app.post("/api/register-supergod", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid input: " + result.error.issues.map(i => i.message).join(", ")
        });
      }

      const { username, password } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({
          message: "Username already exists"
        });
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new supergod user
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          role: "supergod", // Set role as supergod
          lastLogin: new Date() // Set initial login time
        })
        .returning();
        
      console.log("[DEBUG] Super-God Mode role registered");

      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({
            message: "Error during login after registration"
          });
        }
        
        console.log("[DEBUG] Current user role:", newUser.role);
        console.log("[DEBUG] Super-God privileges unlocked");
        
        // Generate JWT token
        const token = crypto.generateToken({
          id: newUser.id,
          username: newUser.username,
          role: newUser.role
        });
        
        return res.json({
          message: "Super-God registration successful",
          user: { id: newUser.id, username: newUser.username, role: newUser.role },
          token // Return the JWT token to the client
        });
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input: " + result.error.issues.map(i => i.message).join(", ")
      });
    }

    const cb = async (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        return res.status(500).json({
          message: "Internal server error",
          error: err.message
        });
      }

      if (!user) {
        return res.status(400).json({
          message: info.message ?? "Login failed"
        });
      }

      // Generate JWT token
      const token = crypto.generateToken({
        id: user.id,
        username: user.username,
        role: user.role
      });

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({
            message: "Error during login",
            error: err.message
          });
        }

        return res.json({
          message: "Login successful",
          user: { id: user.id, username: user.username, role: user.role },
          token: token // Return the JWT token to the client
        });
      });
    };
    passport.authenticate("local", cb)(req, res, next);
  });

  // JWT token-based login route
  app.post("/api/token", (req, res, next) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input: " + result.error.issues.map(i => i.message).join(", ")
      });
    }

    passport.authenticate("local", { session: false }, async (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        return res.status(500).json({
          message: "Internal server error",
          error: err.message
        });
      }

      if (!user) {
        return res.status(401).json({
          message: info.message ?? "Authentication failed"
        });
      }

      // Update last login timestamp
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, user.id));

      // Generate JWT token
      const token = crypto.generateToken({
        id: user.id,
        username: user.username,
        role: user.role
      });

      return res.json({
        message: "Authentication successful",
        user: { id: user.id, username: user.username, role: user.role },
        token: token
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          message: "Logout failed",
          error: err.message
        });
      }

      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    // First check session-based authentication
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    
    // Then try JWT authentication from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1]; // Bearer TOKEN
        const decoded = crypto.verifyToken(token);
        
        if (decoded && decoded.id) {
          // Get fresh user data from DB
          db.select()
            .from(users)
            .where(eq(users.id, decoded.id))
            .limit(1)
            .then(([user]) => {
              if (user) {
                return res.json(user);
              } else {
                return res.status(401).json({ message: "Invalid user token" });
              }
            })
            .catch(err => {
              console.error("DB error during JWT auth:", err);
              return res.status(500).json({ message: "Database error" });
            });
          return; // End response here as it will be handled by the promise
        }
      } catch (err) {
        console.error("JWT verification error:", err);
      }
    }

    // No valid authentication found
    res.status(401).json({ message: "Not logged in" });
  });
  
  // JWT-based protected user route
  app.get("/api/jwt/user", authenticateJWT, (req, res) => {
    return res.json(req.user);
  });
  
  // Example of role-based protected route
  app.get("/api/admin/protected", authenticateJWT, requireRole("admin"), (req, res) => {
    return res.json({ 
      message: "Admin access granted", 
      user: req.user
    });
  });
}