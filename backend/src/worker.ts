import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import cron from "node-cron";
import { initializeDatabase } from "./db/migrations";
import {
  runVerification,
  runSellerVerification,
} from "./scripts/verify-members";

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

console.log("Worker process starting...");
console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);

// Initialize database connection
initializeDatabase()
  .then(() => {
    console.log("Database initialized for worker process");

    // Schedule daily member verification at 2 AM
    // Cron format: minute hour day month day-of-week
    // '0 2 * * *' means: at 2:00 AM every day
    cron.schedule(
      "0 2 * * *",
      async () => {
        console.log(
          "Scheduled member verification started at",
          new Date().toISOString()
        );
        try {
          await runVerification();
        } catch (error) {
          console.error("Error in scheduled member verification:", error);
        }
      },
      {
        scheduled: true,
        timezone: "America/New_York",
      }
    );

    // Schedule daily seller verification at 3 AM (separate from member verification)
    // Seller verification searches vendor program page - no login required
    cron.schedule(
      "0 3 * * *",
      async () => {
        console.log(
          "Scheduled seller verification started at",
          new Date().toISOString()
        );
        try {
          await runSellerVerification();
        } catch (error) {
          console.error("Error in scheduled seller verification:", error);
        }
      },
      {
        scheduled: true,
        timezone: "America/New_York",
      }
    );

    console.log("Member verification scheduled to run daily at 2:00 AM ET");
    console.log("Seller verification scheduled to run daily at 3:00 AM ET");
    console.log("Worker process is running. Press Ctrl+C to stop.");
  })
  .catch((error) => {
    console.error("Failed to initialize database for worker:", error);
    process.exit(1);
  });

// Keep the process alive
process.on("SIGINT", () => {
  console.log("Worker process shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Worker process received SIGTERM, shutting down...");
  process.exit(0);
});
