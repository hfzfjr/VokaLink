import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health.js";
import { schoolsRouter } from "./routes/schools.js";
import { curriculumRouter } from "./routes/curriculum.js";
import { dudiRouter } from "./routes/dudi.js";
import { placementsRouter } from "./routes/placements.js";
import { eraporRouter } from "./routes/erapor.js";
import { logsRouter } from "./routes/logs.js";
import { passportsRouter } from "./routes/passports.js";
import { verifyRouter } from "./routes/verify.js";
import { teachersRouter } from "./routes/teachers.js";
import { interventionsRouter } from "./routes/interventions.js";
import { endorsementsRouter } from "./routes/endorsements.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { zeroLoginRateLimiter } from "./middlewares/rate-limiter.js";

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

  // DUDI Onboarding, Directory & Mentor Device Binding (FR-003)
  app.use("/api/dudi", dudiRouter);
  app.use("/api/v1/dudi", dudiRouter);

  // Smart Placement & Spatial Compatibility Scorer (FR-004)
  const PLACEMENT_PATH = "/api/schools/:schoolId/placements";
  app.use(PLACEMENT_PATH, placementsRouter);
  app.use(`/api/v1${PLACEMENT_PATH.slice(4)}`, placementsRouter);

  // Automated e-Rapor SMK Grade & Narrative Exporter (FR-011)
  const ERAPOR_PATH = "/api/schools/:schoolId/erapor";
  app.use(ERAPOR_PATH, eraporRouter);
  app.use(`/api/v1${ERAPOR_PATH.slice(4)}`, eraporRouter);

  // Daily Logs & Offline Sync (FR-005, FR-006 & DESIGN.md §7.3)
  app.use("/api/logs", logsRouter);
  app.use("/api/v1/logs", logsRouter);

  // Student ATS-CV & Public Skill Passport (FR-012, TC-010)
  app.use("/api", passportsRouter);
  app.use("/api/v1", passportsRouter);

  // Dual-Mode Zero-Login Mentor Verification (FR-007, BR-007)
  app.use("/api/verify", zeroLoginRateLimiter, verifyRouter);
  app.use("/api/v1/verify", zeroLoginRateLimiter, verifyRouter);

  // Live Competency Heatmap & Drift Alert (FR-008, BR-008)
  app.use("/api/teachers", teachersRouter);
  app.use("/api/v1/teachers", teachersRouter);
  app.use("/api/schools/:schoolId/heatmap", teachersRouter);

  // Smart Intervention Dispatcher & Mid-Term Rotation (FR-009)
  app.use("/api/interventions", interventionsRouter);
  app.use("/api/v1/interventions", interventionsRouter);
  app.use("/api/teachers/interventions", interventionsRouter);
  app.use("/api/v1/teachers/interventions", interventionsRouter);
  app.use("/api/placements", interventionsRouter);
  app.use("/api/v1/placements", interventionsRouter);

  // 1-Click Soft Skills Endorsement (FR-010)
  app.use("/api/endorsements", zeroLoginRateLimiter, endorsementsRouter);
  app.use("/api/v1/endorsements", zeroLoginRateLimiter, endorsementsRouter);

  // Global RFC 7807 error handler
  app.use(errorHandler);

  return app;
}
