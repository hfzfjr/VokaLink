
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

function sanitizeErrorMessage(message: string): string {
  if (
    !message ||
    message.includes(":\\") ||
    message.includes("/apps/") ||
    message.includes(".ts:") ||
    message.includes("prisma.") ||
    message.includes("Can't reach database") ||
    message.includes("invocation in") ||
    message.includes("pooler.supabase")
  ) {
    return "Terjadi kendala saat memproses permintaan Anda.";
  }
  return message;
}

function isPrismaError(err: any): boolean {
  return Boolean(
    err &&
      (err.name?.startsWith("PrismaClient") ||
        (typeof err.code === "string" && /^P\d{4}$/.test(err.code)) ||
        err.message?.includes("prisma.") ||
        err.message?.includes("Can't reach database server"))
  );
}

function handlePrismaError(err: any, req: Request, res: Response): boolean {
  if (!isPrismaError(err)) return false;

  const code = (err.code as string) || "";
  const msg = err.message || "";

  // Database Connection / Initialization Failure (e.g. Supabase pooler unreachable)
  if (
    code === "P1001" ||
    code === "P1002" ||
    code === "P1003" ||
    code === "P1008" ||
    code === "P1017" ||
    err.name === "PrismaClientInitializationError" ||
    msg.includes("Can't reach database server") ||
    msg.includes("timed out") ||
    msg.includes("ECONNREFUSED")
  ) {
    const problem: ProblemDetails = {
      type: "https://vokalink.id/errors/database-connection",
      title: "Layanan Basis Data Tidak Dapat Dihubungi",
      status: 503,
      code: "DATABASE_CONNECTION_ERROR",
      detail:
        "Sistem tidak dapat terhubung ke server basis data. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.",
      instance: req.originalUrl,
    };
    res.status(503).contentType("application/problem+json").json(problem);
    return true;
  }

  // P2002: Unique constraint failed
  if (code === "P2002") {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "";
    const problem: ProblemDetails = {
      type: "https://vokalink.id/errors/data-conflict",
      title: "Data Sudah Terdaftar",
      status: 409,
      code: "DATA_CONFLICT",
      detail: target
        ? `Data dengan ${target} tersebut sudah terdaftar dalam sistem.`
        : "Data yang dimasukkan sudah terdaftar dalam sistem.",
      instance: req.originalUrl,
    };
    res.status(409).contentType("application/problem+json").json(problem);
    return true;
  }

  // P2025: Record to update not found / Record does not exist
  if (code === "P2025") {
    const problem: ProblemDetails = {
      type: "https://vokalink.id/errors/not-found",
      title: "Data Tidak Ditemukan",
      status: 404,
      code: "NOT_FOUND",
      detail: "Data yang diminta tidak ditemukan dalam sistem database.",
      instance: req.originalUrl,
    };
    res.status(404).contentType("application/problem+json").json(problem);
    return true;
  }

  // P2003: Foreign key constraint failed
  if (code === "P2003") {
    const problem: ProblemDetails = {
      type: "https://vokalink.id/errors/relation-error",
      title: "Relasi Data Tidak Valid",
      status: 400,
      code: "RELATION_ERROR",
      detail: "Permintaan tidak dapat diproses karena data relasi terkait tidak ditemukan.",
      instance: req.originalUrl,
    };
    res.status(400).contentType("application/problem+json").json(problem);
    return true;
  }

  // Generic Prisma Database Error
  const problem: ProblemDetails = {
    type: "https://vokalink.id/errors/database-error",
    title: "Gangguan Basis Data",
    status: 500,
    code: "DATABASE_ERROR",
    detail: "Terjadi kendala saat memproses data pada database. Silakan coba beberapa saat lagi.",
    instance: req.originalUrl,
  };
  res.status(500).contentType("application/problem+json").json(problem);
  return true;
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
      status: 422,
      code: "VALIDATION_ERROR",
      detail: "Satu atau lebih data yang dikirim tidak memenuhi format yang valid.",
      instance: req.originalUrl,
      errors: fieldErrors,
    };

    res.status(422).contentType("application/problem+json").json(problem);
    return;
  }

  // Intercept Prisma / Database errors before AppError or general fallback
  if (handlePrismaError(err, req, res)) {
    return;
  }

  if (err instanceof AppError || typeof (err as any).statusCode === "number") {
    const statusCode = (err as any).statusCode || 500;
    const code = (err as any).code || "INTERNAL_ERROR";
    const safeDetail = sanitizeErrorMessage(err.message);
    const problem: ProblemDetails = {
      type: `https://vokalink.id/errors/${code.toLowerCase()}`,
      title: safeDetail,
      status: statusCode,
      code,
      detail: safeDetail,
      instance: req.originalUrl,
      errors: (err as any).errors,
    };

    res.status(statusCode).contentType("application/problem+json").json(problem);
    return;
  }

  // Fallback 500: Always return safe, localized error message to clients
  const problem: ProblemDetails = {
    type: "https://vokalink.id/errors/internal-error",
    title: "Terjadi Kesalahan Server",
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    detail: "Terjadi kendala pada server saat memproses permintaan. Silakan coba beberapa saat lagi.",
    instance: req.originalUrl,
  };

  res.status(500).contentType("application/problem+json").json(problem);
}
