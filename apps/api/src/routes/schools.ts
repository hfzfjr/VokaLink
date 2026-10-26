import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma, createTenantPrisma } from "../lib/prisma.js";
import { schoolRegisterSchema } from "@vokalink/shared";
import { AppError } from "../middlewares/error-handler.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  cloneCurriculumForSchool,
  getCurriculumSeedData,
} from "../lib/curriculum.js";
import { provisionSupabaseUser } from "../lib/supabase.js";

export const schoolsRouter = Router();

/**
 * GET /api/schools/master-departments
 * Returns preloaded master departments from curriculum seed
 */
schoolsRouter.get(
  "/master-departments",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seedData = getCurriculumSeedData();
      const list = seedData.masterDepartments.map((m) => {
        const curr = seedData.curriculum.find(
          (c) => c.sectorCode.toUpperCase() === m.sectorCode.toUpperCase()
        );
        const totalJp = curr
          ? curr.cpElements.reduce((acc, el) => acc + el.targetJp, 0)
          : 792;
        const totalJobCards = curr
          ? curr.cpElements.reduce((acc, el) => acc + el.jobCards.length, 0) +
            (curr.nonCompetencyJobCards?.length ?? 1)
          : 12;

        return {
          sectorCode: m.sectorCode,
          name: m.name,
          description: m.description,
          totalJp,
          cpElementsCount: curr?.cpElements.length ?? 4,
          jobCardsCount: totalJobCards,
        };
      });

      res.json({
        data: list,
        meta: { total: list.length },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/schools/register
 * FR-001: Register a new school tenant, admin user, academic period, and clone curriculum.
 */
schoolsRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = schoolRegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
          const path = issue.path.join(".");
          errors[path] = errors[path] ?? [];
          errors[path].push(issue.message);
        }
        res.status(422).json({
          type: "https://vokalink.id/errors/validation",
          title: "Validasi Gagal",
          status: 422,
          detail: "Data formulir pendaftaran sekolah tidak valid",
          code: "VALIDATION_ERROR",
          errors,
        });
        return;
      }

      const input = parsed.data;

      // 1. Check if NPSN is already registered
      const existingSchool = await prisma.school.findUnique({
        where: { npsn: input.npsn },
      });

      if (existingSchool && !input.isDemoSandbox) {
        throw new AppError(
          "Sekolah dengan NPSN ini sudah terdaftar. Hubungi admin sekolah Anda atau gunakan fitur Masuk.",
          409,
          "NPSN_ALREADY_EXISTS"
        );
      }

      // 2. Provision Supabase Auth User for School Admin
      const schoolId = existingSchool?.id ?? crypto.randomUUID();
      const authUser = await provisionSupabaseUser({
        email: input.adminEmail,
        password: input.adminPassword,
        fullName: input.adminFullName,
        role: "SCHOOL_ADMIN",
        schoolId,
      });

      // 3. Database transaction: Create School, Period, UserProfile, and Clone Curriculum
      const result = await prisma.$transaction(async (tx) => {
        // Create or update School
        const school = await tx.school.upsert({
          where: { id: schoolId },
          create: {
            id: schoolId,
            npsn: input.npsn,
            name: input.name,
            province: input.province,
            city: input.city,
            latitude: input.latitude,
            longitude: input.longitude,
            isDemoSandbox: input.isDemoSandbox,
          },
          update: {
            name: input.name,
            province: input.province,
            city: input.city,
          },
        });

        // Create Academic Period
        const now = new Date();
        const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        const academicPeriod = await tx.academicPeriod.create({
          data: {
            schoolId: school.id,
            name: input.academicPeriodName,
            startDate: input.startDate ? new Date(input.startDate) : now,
            endDate: input.endDate ? new Date(input.endDate) : sixMonthsLater,
            targetTotalJp: input.targetTotalJp,
            isActive: true,
          },
        });

        // Create UserProfile for Admin
        const userProfile = await tx.userProfile.upsert({
          where: { id: authUser.id },
          create: {
            id: authUser.id,
            schoolId: school.id,
            role: "SCHOOL_ADMIN",
            fullName: input.adminFullName,
            identityNumber: input.npsn,
          },
          update: {
            fullName: input.adminFullName,
            role: "SCHOOL_ADMIN",
          },
        });

        // Clone curriculum for selected departments
        const clonedDepartments = await cloneCurriculumForSchool(
          tx,
          school.id,
          input.selectedDepartmentSectorCodes
        );

        return {
          school,
          academicPeriod,
          userProfile,
          departments: clonedDepartments,
        };
      });

      res.status(201).json({
        success: true,
        message: "Pendaftaran sekolah dan inisialisasi kurikulum berhasil.",
        data: {
          school: {
            id: result.school.id,
            npsn: result.school.npsn,
            name: result.school.name,
            province: result.school.province,
            city: result.school.city,
            isDemoSandbox: result.school.isDemoSandbox,
          },
          academicPeriod: {
            id: result.academicPeriod.id,
            name: result.academicPeriod.name,
            targetTotalJp: result.academicPeriod.targetTotalJp,
          },
          admin: {
            id: result.userProfile.id,
            fullName: result.userProfile.fullName,
            role: result.userProfile.role,
            email: input.adminEmail,
          },
          departmentsCount: result.departments.length,
          departments: result.departments.map((d) => ({
            id: d.id,
            sectorCode: d.sectorCode,
            name: d.name,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/schools/demo-sandbox
 * FR-001 Alternatif A1: Demo Switcher data loader for Judges
 */
schoolsRouter.post(
  "/demo-sandbox",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Find the demo school from seed
      const demoSchool = await prisma.school.findFirst({
        where: { isDemoSandbox: true },
        include: {
          academicPeriods: { where: { isActive: true }, take: 1 },
          schoolDepartments: {
            include: {
              _count: { select: { cpElements: true, jobCards: true } },
            },
          },
          userProfiles: {
            take: 10,
          },
        },
      });

      if (!demoSchool) {
        throw new AppError(
          "Data demo sandbox belum diinisialisasi. Silakan jalankan seeder terlebih dahulu.",
          404,
          "DEMO_NOT_INITIALIZED"
        );
      }

      const teacher = demoSchool.userProfiles.find((u) => u.role === "TEACHER");
      const students = demoSchool.userProfiles.filter((u) => u.role === "STUDENT");

      res.json({
        success: true,
        message: "Data demo sandbox aktif tersedia.",
        data: {
          school: {
            id: demoSchool.id,
            npsn: demoSchool.npsn,
            name: demoSchool.name,
            city: demoSchool.city,
            province: demoSchool.province,
            isDemoSandbox: true,
          },
          period: demoSchool.academicPeriods[0] ?? null,
          departments: demoSchool.schoolDepartments.map((d) => ({
            id: d.id,
            sectorCode: d.sectorCode,
            name: d.name,
            cpElementsCount: d._count.cpElements,
            jobCardsCount: d._count.jobCards,
          })),
          demoAccounts: {
            schoolAdmin: {
              role: "SCHOOL_ADMIN",
              label: "Admin Pokja PKL",
              email: "admin.smk@vokalink.id",
              description: "Akses Dasbor Sekolah, Kelola Kurikulum, dan Smart Placement",
            },
            teacher: teacher
              ? {
                  id: teacher.id,
                  role: "TEACHER",
                  fullName: teacher.fullName,
                  label: "Guru Pembimbing (Budi Santoso)",
                  email: "budi.santoso@vokalink.id",
                  description: "Pantau Live Heatmap, Peringatan Drift, dan Intervensi WA",
                }
              : null,
            students: students.slice(0, 3).map((s) => ({
              id: s.id,
              role: "STUDENT",
              fullName: s.fullName,
              identityNumber: s.identityNumber,
              label: `Siswa PKL (${s.fullName})`,
              description: "PWA Zero-Typing Logger, Tombol Jujur, dan Paspor Kompetensi",
            })),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/schools/current
 * Retrieves current school profile and aggregated stats (Tenant Guarded)
 */
schoolsRouter.get(
  "/current",
  requireAuth,
  requireRole("SCHOOL_ADMIN"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const tenantDb = createTenantPrisma({
        userId: user.id,
        schoolId: user.schoolId,
        role: user.role,
      });

      const school = await prisma.school.findUnique({
        where: { id: user.schoolId },
        include: {
          academicPeriods: {
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          schoolDepartments: {
            include: {
              _count: {
                select: {
                  cpElements: true,
                  jobCards: true,
                },
              },
            },
          },
        },
      });

      if (!school) {
        throw new AppError("Sekolah tidak ditemukan", 404, "SCHOOL_NOT_FOUND");
      }

      // Count students, teachers, placements, dudis, and fetch priority students
      const [totalStudents, totalTeachers, totalPlacements, totalDudis, rawPlacements] = await Promise.all([
        tenantDb.userProfile.count({
          where: { schoolId: user.schoolId, role: "STUDENT" },
        }),
        tenantDb.userProfile.count({
          where: { schoolId: user.schoolId, role: "TEACHER" },
        }),
        tenantDb.placement.count({
          where: { academicPeriod: { schoolId: user.schoolId } },
        }),
        prisma.dudiPartner.count(),
        tenantDb.placement.findMany({
          where: { academicPeriod: { schoolId: user.schoolId } },
          include: {
            student: {
              include: { schoolDepartment: true },
            },
            dudiPartner: true,
            dailyLogs: {
              select: {
                status: true,
                items: {
                  select: { durationJp: true },
                },
              },
            },
            driftAlerts: {
              where: { status: "OPEN" },
              take: 1,
            },
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const priorityStudents = rawPlacements.map((p) => {
        const verifiedJp = p.dailyLogs
          .filter((l) => l.status === "VERIFIED")
          .reduce(
            (acc, log) =>
              acc + log.items.reduce((s, it) => s + it.durationJp, 0),
            0
          );
        const pendingLogs = p.dailyLogs.filter(
          (l) => l.status === "PENDING_VERIFICATION"
        ).length;
        const activeAlert = p.driftAlerts[0];

        let statusText = "Progres Aktif";
        let severity: "warning" | "info" | "success" = "info";

        if (activeAlert) {
          statusText = `Drift: ${activeAlert.alertType.replace(/_/g, " ")}`;
          severity = "warning";
        } else if (verifiedJp >= 700) {
          statusText = "Target JP Tuntas";
          severity = "success";
        } else if (pendingLogs > 2) {
          statusText = `${pendingLogs} Log Belum Terverifikasi`;
          severity = "warning";
        }

        return {
          id: p.student.id,
          name: p.student.fullName,
          department: p.student.schoolDepartment?.name || "Konsentrasi Keahlian",
          dudiName: p.dudiPartner.name,
          jpProgress: verifiedJp,
          pendingLogs,
          statusText,
          severity,
        };
      });

      res.json({
        success: true,
        data: {
          school: {
            id: school.id,
            npsn: school.npsn,
            name: school.name,
            province: school.province,
            city: school.city,
            isDemoSandbox: school.isDemoSandbox,
          },
          activePeriod: school.academicPeriods[0] ?? null,
          departments: school.schoolDepartments.map((d) => ({
            id: d.id,
            sectorCode: d.sectorCode,
            name: d.name,
            cpElementsCount: d._count.cpElements,
            jobCardsCount: d._count.jobCards,
            isLocked: d.isLocked,
          })),
          stats: {
            totalStudents,
            totalTeachers,
            totalDepartments: school.schoolDepartments.length,
            totalPlacements,
            totalDudis,
          },
          priorityStudents,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
