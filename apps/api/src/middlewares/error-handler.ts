import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { ProblemDetails } from "@vokalink/shared";
import { logger } from "../lib/logger.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode = 400,
    code = "BAD_REQUEST",
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  logger.error({ err, path: req.path, method: req.method }, "Request error occurred");

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const pathKey = issue.path.join(".") || "body";
      if (!fieldErrors[pathKey]) {
        fieldErrors[pathKey] = [];
      }
      fieldErrors[pathKey]!.push(issue.message);
    }

    const problem: ProblemDetails = {
      type: "https://vokalink.id/errors/validation-error",
      title: "Validasi Input Gagal",
      status: 400,
      code: "VALIDATION_ERROR",
      detail: "Satu atau lebih data yang dikirim tidak memenuhi format yang valid.",
      instance: req.originalUrl,
      errors: fieldErrors,
    };

    res.status(400).contentType("application/problem+json").json(problem);
    return;
  }

  if (err instanceof AppError) {
    const problem: ProblemDetails = {
      type: `https://vokalink.id/errors/${err.code.toLowerCase()}`,
      title: err.message,
      status: err.statusCode,
      code: err.code,
      detail: err.message,
      instance: req.originalUrl,
      errors: err.errors,
    };

    res.status(err.statusCode).contentType("application/problem+json").json(problem);
    return;
  }

  // Fallback 500
  const isDev = process.env["NODE_ENV"] === "development";
  const problem: ProblemDetails = {
    type: "https://vokalink.id/errors/internal-error",
    title: "Terjadi Kesalahan Server",
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    detail: isDev ? err.message : "Terjadi kesalahan internal pada sistem kami.",
    instance: req.originalUrl,
  };

  res.status(500).contentType("application/problem+json").json(problem);
}
