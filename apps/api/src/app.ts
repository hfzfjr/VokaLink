import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health.js";
import { schoolsRouter } from "./routes/schools.js";
import { curriculumRouter } from "./routes/curriculum.js";
import { errorHandler } from "./middlewares/error-handler.js";

export function createApp(): Express {
  const app = express();

  // Basic security headers
  app.use(helmet());

  // Strict CORS policy
  const rawOrigins = process.env["APP_ORIGINS"] || "http://localhost:3000";
  const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Content-SHA256"],
    })
  );

  app.use(express.json({ limit: "2mb" }));

  // Root / ping
  app.get("/", (_req, res) => {
    res.json({
      name: "VokaLink API",
      version: "1.0.0",
      status: "running",
      documentation: "/docs",
    });
  });

  // Health and readiness endpoints
  app.use(healthRouter);

  // School onboarding and management routes
  app.use("/api/schools", schoolsRouter);
  app.use("/api/v1/schools", schoolsRouter);

  // Curriculum & Job Cards (FR-002) — nested under schools
  const CURR_PATH = "/api/schools/:schoolId/departments/:deptId/curriculum";
  app.use(CURR_PATH, curriculumRouter);
  app.use(`/api/v1${CURR_PATH.slice(4)}`, curriculumRouter);

  // Global RFC 7807 error handler
  app.use(errorHandler);

  return app;
}
