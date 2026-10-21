import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import type { UserRole } from "@vokalink/shared";
import { AppError } from "./error-handler.js";

export interface AuthUser {
  id: string;
  email?: string;
  role: UserRole;
  schoolId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware to authenticate requests via Bearer JWT (Supabase Auth token)
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AppError("Kredensial otentikasi tidak ditemukan", 401, "UNAUTHORIZED"));
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    next(new AppError("Format token tidak valid", 401, "UNAUTHORIZED"));
    return;
  }

  const jwtSecret = process.env["SUPABASE_JWT_SECRET"];
  if (!jwtSecret) {
    // In test environment or early development without secret set:
    if (process.env["NODE_ENV"] === "test") {
      req.user = {
        id: "00000000-0000-0000-0000-000000000001",
        role: "SCHOOL_ADMIN",
        schoolId: "00000000-0000-0000-0000-000000000002",
      };
      next();
      return;
    }
    next(new AppError("Server JWT configuration is missing", 500, "CONFIG_ERROR"));
    return;
  }

  try {
    const secretKey = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secretKey);

    const sub = payload.sub;
    const appMetadata = (payload["app_metadata"] ?? {}) as Record<string, unknown>;
    let userRole = (appMetadata["role"] ?? "STUDENT") as UserRole;
    let schoolId = (appMetadata["school_id"] ?? "") as string;

    if (!sub) {
      next(new AppError("Token sub tidak valid", 401, "UNAUTHORIZED"));
      return;
    }

    if (!schoolId) {
      const { prisma } = await import("../lib/prisma.js");
      const profile = await prisma.userProfile.findUnique({
        where: { id: sub },
        select: { schoolId: true, role: true },
      });
      if (profile) {
        schoolId = profile.schoolId;
        userRole = profile.role as UserRole;
      }
    }

    req.user = {
      id: sub,
      email: payload["email"] as string | undefined,
      role: userRole,
      schoolId: schoolId,
    };

    next();
  } catch {
    next(new AppError("Sesi telah kedaluwarsa atau token tidak valid", 401, "UNAUTHORIZED"));
  }
}

/**
 * Middleware to restrict access by UserRole
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Otentikasi dibutuhkan", 401, "UNAUTHORIZED"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          "Anda tidak memiliki izin untuk mengakses sumber daya ini",
          403,
          "FORBIDDEN"
        )
      );
      return;
    }

    next();
  };
}
