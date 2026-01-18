import "reflect-metadata";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import chaptersRouter from "./routes/chapters";
import sellersRouter from "./routes/sellers";
import promotersRouter from "./routes/promoters";
import membersRouter from "./routes/members";
import usersRouter from "./routes/users";
import adminRouter from "./routes/admin";
import productsRouter from "./routes/products";
import eventsRouter from "./routes/events";
import checkoutRouter from "./routes/checkout";
import webhookRouter from "./routes/webhook";
import donationsRouter from "./routes/donations";
import locationRouter from "./routes/location";
import industriesRouter from "./routes/industries";
import professionsRouter from "./routes/professions";
import sellerSetupRouter from "./routes/seller-setup";
import stewardsRouter from "./routes/stewards";
import stewardCheckoutRouter from "./routes/steward-checkout";
import favoritesRouter from "./routes/favorites";
import savedEventsRouter from "./routes/saved-events";
import notificationsRouter from "./routes/notifications";
import shippingRouter from "./routes/shipping";
import addressesRouter from "./routes/addresses";
import { initializeDatabase } from "./db/migrations";

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
// FRONTEND_URL is the primary production frontend URL (e.g., https://one-kappa.com)
// We also allow preview/staging subdomains via regex patterns
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

// Log FRONTEND_URL on startup for debugging
console.log(`🌐 CORS Configuration:`);
console.log(`   FRONTEND_URL: ${frontendUrl || "NOT SET"}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || "development"}`);

const allowedOrigins = [
  // Primary frontend URL from environment variable
  frontendUrl,
  // Localhost for local development
  "http://localhost:3000",
  // Allow both www and non-www versions of production domain
  frontendUrl.replace("www.", ""),
  frontendUrl.includes("www.")
    ? frontendUrl.replace("www.", "")
    : frontendUrl.replace("https://", "https://www."),
  // Allow all Vercel preview deployments (pattern: *.vercel.app)
  /^https:\/\/.*\.vercel\.app$/,
  // Allow Vercel production if different from FRONTEND_URL
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  // Allow one-kappa.com domains (any subdomain including www, preview, staging, etc.)
  // This regex matches: preview.one-kappa.com, www.one-kappa.com, staging.one-kappa.com, etc.
  // Note: This is separate from FRONTEND_URL because FRONTEND_URL is typically the production URL
  // while preview/staging use subdomains
  /^https:\/\/.*\.one-kappa\.com$/,
  // Also allow root domain (one-kappa.com without subdomain)
  /^https:\/\/one-kappa\.com$/,
].filter(Boolean) as (string | RegExp)[];

console.log(`   Allowed origins: ${allowedOrigins.length} patterns configured`);
console.log(`   Includes regex patterns for: *.one-kappa.com, *.vercel.app`);

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Log CORS check for debugging (only in development)
      if (process.env.NODE_ENV !== "production") {
        console.log(`[CORS] Checking origin: ${origin}`);
        console.log(`[CORS] FRONTEND_URL: ${frontendUrl}`);
        console.log(`[CORS] Allowed origins:`, allowedOrigins);
      }

      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (typeof allowedOrigin === "string") {
          const matches = origin === allowedOrigin;
          if (process.env.NODE_ENV !== "production" && matches) {
            console.log(`[CORS] ✅ Matched string: ${allowedOrigin}`);
          }
          return matches;
        } else if (allowedOrigin instanceof RegExp) {
          const matches = allowedOrigin.test(origin);
          if (process.env.NODE_ENV !== "production" && matches) {
            console.log(`[CORS] ✅ Matched regex: ${allowedOrigin}`);
          }
          return matches;
        }
        return false;
      });

      if (isAllowed) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[CORS] ✅ Allowed: ${origin}`);
        }
        callback(null, true);
      } else {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[CORS] ❌ Blocked: ${origin}`);
          console.log(`[CORS] Allowed origins:`, allowedOrigins);
        }
        // Return false instead of error to prevent CORS headers from being set incorrectly
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Webhook route needs raw body for Stripe signature verification
app.use(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhookRouter
);

// Regular JSON middleware for other routes (only parse JSON, not multipart/form-data)
// Increase body size limit to 10MB for image uploads
// Only apply JSON parser to requests that are actually JSON (skip multipart/form-data)
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const contentType = req.headers["content-type"] || "";
    // Skip JSON parsing for multipart/form-data (handled by multer) and other non-JSON content types
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      return next();
    }
    if (contentType.includes("application/json")) {
      express.json({ limit: "10mb" })(req, res, next);
    } else {
      next();
    }
  }
);

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const contentType = req.headers["content-type"] || "";
    // Skip URL-encoded parsing for multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      return next();
    }
    if (contentType.includes("application/x-www-form-urlencoded")) {
      express.urlencoded({ extended: true, limit: "10mb" })(req, res, next);
    } else {
      next();
    }
  }
);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to 1Kappa API" });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/chapters", chaptersRouter);
app.use("/api/sellers", sellersRouter);
app.use("/api/promoters", promotersRouter);
app.use("/api/members", membersRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", productsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/donations", donationsRouter);
app.use("/api/location", locationRouter);
app.use("/api/industries", industriesRouter);
app.use("/api/professions", professionsRouter);
app.use("/api/seller-setup", sellerSetupRouter);
app.use("/api/stewards", stewardsRouter);
app.use("/api/steward-checkout", stewardCheckoutRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/saved-events", savedEventsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/addresses", addressesRouter);

// Initialize database on startup
initializeDatabase().catch(console.error);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
