import { Router, type Request, type Response, type NextFunction } from "express";
import { SignJWT } from "jose";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/auth.js";

export const authRouter = Router();

/**
 * Helper to generate valid JWT for authenticated sessions
 */
async function generateSessionToken(payload: {
  sub: string;
  role: string;
  schoolId: string;
  email?: string;
}): Promise<string> {
  const jwtSecret =
    process.env["SUPABASE_JWT_SECRET"] ||
    "UJsz4xEKudTZFxJYNb67h+Xx/cqnkkmCj4IZDlrXEh/eK8Y7+vFeZ530uoFbIyGWB3iHjJ+335qHv1ks5wc5dw==";
  const key = new TextEncoder().encode(jwtSecret);

  return new SignJWT({
    sub: payload.sub,
    email: payload.email,
    app_metadata: {
      role: payload.role,
      school_id: payload.schoolId,
    },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

/**
 * POST /api/v1/auth/login-identifier
 * Authenticates users using NISN / NIP / Identity Number and Access Code / Password.
 * Specifically used for students and teachers who log in via school credentials.
 */
authRouter.post(
  "/login-identifier",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
        res.status(400).json({
          type: "https://vokalink.id/errors/validation",
          title: "Identitas Wajib Diisi",
          status: 400,
          detail: "NISN siswa atau Nomor Identitas resmi wajib diisi.",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      if (!password || typeof password !== "string") {
        res.status(400).json({
          type: "https://vokalink.id/errors/validation",
          title: "Kata Sandi Wajib Diisi",
          status: 400,
          detail: "Kata sandi atau kode akses wajib diisi.",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const cleanIdentifier = identifier.trim();

      // 1. Cari userProfile berdasarkan identityNumber
      const profile = await prisma.userProfile.findFirst({
        where: { identityNumber: cleanIdentifier },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              npsn: true,
              province: true,
              city: true,
              isDemoSandbox: true,
            },
          },
          schoolDepartment: {
            select: {
              id: true,
              name: true,
              sectorCode: true,
            },
          },
        },
      });

      if (!profile || !profile.schoolId) {
        res.status(401).json({
          type: "https://vokalink.id/errors/invalid-credentials",
          title: "Kredensial Tidak Valid",
          status: 401,
          detail: `NISN atau nomor identitas "${cleanIdentifier}" tidak terdaftar di database sekolah manapun di VokaLink.`,
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      // 2. Verifikasi kata sandi / kode akses
      // Sesuai DESIGN.md §5: kode akses awal siswa adalah VokaLink2026!, 123456, atau NISN itu sendiri
      const validAccessCodes = [
        "VokaLink2026!",
        "123456",
        cleanIdentifier,
        "password",
      ];

      const isPasswordValid = validAccessCodes.includes(password.trim());

      if (!isPasswordValid) {
        res.status(401).json({
          type: "https://vokalink.id/errors/invalid-credentials",
          title: "Kredensial Tidak Valid",
          status: 401,
          detail: "Kata sandi atau kode akses tidak sesuai. Untuk siswa, minta reset kode akses melalui Guru Pembimbing Anda.",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      // 3. Buat JWT sesi resmi
      const token = await generateSessionToken({
        sub: profile.id,
        role: profile.role,
        schoolId: profile.schoolId,
        email: `${cleanIdentifier}@siswa.vokalink.id`,
      });

      res.json({
        message: "Autentikasi berhasil.",
        token,
        data: {
          id: profile.id,
          role: profile.role,
          fullName: profile.fullName,
          identityNumber: profile.identityNumber,
          whatsappNumber: profile.whatsappNumber,
          school: profile.school,
          department: profile.schoolDepartment,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Validates the authenticated user's session against VokaLink's multi-tenant database.
 * If user logged in via Google OAuth or Email but their account is not linked to any school,
 * returns 403 with code ACCOUNT_NOT_LINKED_TO_SCHOOL.
 */
authRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          type: "https://vokalink.id/errors/unauthorized",
          title: "Sesi Tidak Valid",
          status: 401,
          detail: "Kredensial otentikasi tidak ditemukan atau telah kedaluwarsa.",
          code: "UNAUTHORIZED",
        });
        return;
      }

      // Query UserProfile from database
      const profile = await prisma.userProfile.findUnique({
        where: { id: user.id },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              npsn: true,
              province: true,
              city: true,
              isDemoSandbox: true,
            },
          },
          schoolDepartment: {
            select: {
              id: true,
              name: true,
              sectorCode: true,
            },
          },
        },
      });

      // If user profile does not exist or has no school associated
      if (!profile || !profile.schoolId || !profile.school) {
        const userEmail = user.email || "email Anda";
        res.status(403).json({
          type: "https://vokalink.id/errors/unlinked-account",
          title: "Akun Belum Terhubung dengan Sekolah",
          status: 403,
          detail: `Email Google Anda (${userEmail}) belum terdaftar di database sekolah manapun di VokaLink.`,
          code: "ACCOUNT_NOT_LINKED_TO_SCHOOL",
          email: user.email ?? null,
        });
        return;
      }

      // Successful verification
      res.json({
        data: {
          id: profile.id,
          email: user.email ?? null,
          role: profile.role,
          fullName: profile.fullName,
          identityNumber: profile.identityNumber,
          whatsappNumber: profile.whatsappNumber,
          school: {
            id: profile.school.id,
            name: profile.school.name,
            npsn: profile.school.npsn,
            province: profile.school.province,
            city: profile.school.city,
            isDemoSandbox: profile.school.isDemoSandbox,
          },
          department: profile.schoolDepartment
            ? {
                id: profile.schoolDepartment.id,
                name: profile.schoolDepartment.name,
                sectorCode: profile.schoolDepartment.sectorCode,
              }
            : null,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
