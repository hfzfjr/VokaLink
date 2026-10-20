import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "vokalink-api",
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/readyz", async (_req: Request, res: Response) => {
  try {
    // If DATABASE_URL is configured, test DB query
    if (process.env["DATABASE_URL"]) {
      await prisma.$queryRaw`SELECT 1`;
    }
    res.status(200).json({
      status: "ready",
      service: "vokalink-api",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      error: error instanceof Error ? error.message : "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});
