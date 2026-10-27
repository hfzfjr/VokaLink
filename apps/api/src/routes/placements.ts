import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";
import { requireAuth, requireRole, type AuthUser } from "../middlewares/auth.js";
import {
  createPlacementSchema,
  batchCreatePlacementSchema,
  updateStudentCoordinatesSchema,
} from "@vokalink/shared";
import {
  calculatePlacementScore,
  rankDudiForStudent,
  type CandidateDudi,
} from "@vokalink/core";
import { handlePlacementRotation } from "./interventions.js";

export const placementsRouter = Router({ mergeParams: true });

/**
 * Tenant Guard: Verifikasi kecocokan schoolId user dengan parameter route
 */
function verifySchoolTenant(user: AuthUser, schoolIdFromParam: string) {
  if (user.schoolId !== schoolIdFromParam) {
    throw new AppError("Akses ditolak: tenant tidak cocok.", 403, "FORBIDDEN");
  }
}

// ─── GET /api/schools/:schoolId/placements/candidates ─────────────────────────
/**
 * Mengambil daftar siswa yang belum ditempatkan beserta rekomendasi DUDI terbaik (FR-004)
 */
placementsRouter.get(
  "/candidates",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId } = req.params as { schoolId: string };
      const user = req.user!;
      verifySchoolTenant(user, schoolId);

      const { departmentId } = req.query as { departmentId?: string };

      // 1. Ambil data sekolah untuk koordinat fallback
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { id: true, name: true, latitude: true, longitude: true },
      });

      if (!school) {
        throw new AppError("Sekolah tidak ditemukan.", 404, "NOT_FOUND");
      }

      const defaultLat = school.latitude ? Number(school.latitude) : -7.2575;
      const defaultLon = school.longitude ? Number(school.longitude) : 112.7521;

      // 2. Ambil periode akademik aktif
      const activePeriod = await prisma.academicPeriod.findFirst({
        where: { schoolId, isActive: true },
        orderBy: { createdAt: "desc" },
      });

      const targetTotalJp = activePeriod?.targetTotalJp ?? 792;

      // 3. Ambil daftar siswa di sekolah yang BELUM memiliki penempatan aktif di periode ini (dan filter jurusan bila ada)
      const studentWhere: any = {
        schoolId,
        role: "STUDENT",
        studentPlacements: {
          none: {
            status: "ACTIVE",
            ...(activePeriod ? { academicPeriodId: activePeriod.id } : {}),
          },
        },
      };
      if (departmentId) {
        studentWhere.schoolDepartmentId = departmentId;
      }

      const students = await prisma.userProfile.findMany({
        where: studentWhere,
        include: {
          schoolDepartment: {
            select: {
              id: true,
              name: true,
              sectorCode: true,
              cpElements: {
                select: { id: true, code: true, title: true, targetJp: true },
              },
            },
          },
          studentPlacements: {
            where: {
              status: "ACTIVE",
              ...(activePeriod ? { academicPeriodId: activePeriod.id } : {}),
            },
            select: { id: true, dudiPartnerId: true, status: true },
          },
        },
        orderBy: { fullName: "asc" },
      });

      // 4. Ambil semua guru pembimbing di sekolah ini
      const teachers = await prisma.userProfile.findMany({
        where: { schoolId, role: "TEACHER" },
        select: { id: true, fullName: true, identityNumber: true },
        orderBy: { fullName: "asc" },
      });

      // 5. Ambil semua DUDI beserta capabilities & placement aktif
      const dudis = await prisma.dudiPartner.findMany({
        include: {
          capabilities: {
            include: {
              jobCard: {
                select: {
                  id: true,
                  title: true,
                  cpElementId: true,
                  isNonCompetency: true,
                },
              },
            },
          },
          placements: {
            where: {
              status: "ACTIVE",
              ...(activePeriod ? { academicPeriodId: activePeriod.id } : {}),
            },
            select: { id: true },
          },
          mentors: {
            select: { id: true, fullName: true, jobTitle: true, tokenBoundAt: true },
          },
        },
        orderBy: { name: "asc" },
      });

      // Format DUDI candidates list
      const formattedDudis = dudis.map((d) => {
        const activeCount = d.placements.length;
        const remainingQuota = Math.max(0, d.maxQuota - activeCount);
        const supportedCpElementIds = new Set(
          d.capabilities
            .filter((c) => !c.jobCard.isNonCompetency && c.jobCard.cpElementId)
            .map((c) => c.jobCard.cpElementId!)
        );

        return {
          id: d.id,
          name: d.name,
          sectorCategory: d.sectorCategory,
          address: d.address,
          city: d.city,
          latitude: Number(d.latitude),
          longitude: Number(d.longitude),
          maxQuota: d.maxQuota,
          activePlacementsCount: activeCount,
          remainingQuota,
          supportedCpElementIds: Array.from(supportedCpElementIds),
          mentors: d.mentors.map((m) => ({
            id: m.id,
            fullName: m.fullName,
            jobTitle: m.jobTitle,
            isBound: Boolean(m.tokenBoundAt),
          })),
        };
      });

      // 6. Hitung rekomendasi penempatan untuk setiap siswa yang belum ditempatkan
      const candidateStudents = students.map((s) => {
        const isPlaced = s.studentPlacements.length > 0;
        const studentLat = s.homeLatitude ? Number(s.homeLatitude) : defaultLat;
        const studentLon = s.homeLongitude ? Number(s.homeLongitude) : defaultLon;
        const cpElements = s.schoolDepartment?.cpElements ?? [];

        // Hitung skor untuk setiap DUDI
        const candidateDudisForStudent: CandidateDudi[] = formattedDudis.map((d) => {
          // Hitung berapa total target JP dari CP Elements jurusan siswa yang didukung DUDI ini
          const supportedJp = cpElements
            .filter((cp) => d.supportedCpElementIds.includes(cp.id))
            .reduce((sum, cp) => sum + cp.targetJp, 0);

          return {
            dudiId: d.id,
            name: d.name,
            latitude: d.latitude,
            longitude: d.longitude,
            remainingQuota: d.remainingQuota,
            supportedCpJp: supportedJp,
          };
        });

        const rankedMatches = rankDudiForStudent(
          {
            studentId: s.id,
            name: s.fullName,
            homeLatitude: studentLat,
            homeLongitude: studentLon,
          },
          candidateDudisForStudent,
          targetTotalJp
        );

        return {
          studentId: s.id,
          fullName: s.fullName,
          identityNumber: s.identityNumber,
          department: s.schoolDepartment
            ? { id: s.schoolDepartment.id, name: s.schoolDepartment.name }
            : null,
          hasCustomCoordinates: Boolean(s.homeLatitude && s.homeLongitude),
          homeLatitude: studentLat,
          homeLongitude: studentLon,
          isPlaced,
          activePlacementId: s.studentPlacements[0]?.id ?? null,
          recommendations: rankedMatches,
          bestRecommendation: rankedMatches[0] ?? null,
        };
      });

      res.json({
        data: {
          period: activePeriod
            ? { id: activePeriod.id, name: activePeriod.name, targetTotalJp }
            : null,
          schoolCoordinates: { latitude: defaultLat, longitude: defaultLon },
          students: candidateStudents,
          teachers,
          dudis: formattedDudis,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/schools/:schoolId/placements ────────────────────────────────────
/**
 * Mengambil daftar seluruh penempatan (Placement) aktif dan historis
 */
placementsRouter.get(
  "/",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId } = req.params as { schoolId: string };
      const user = req.user!;
      verifySchoolTenant(user, schoolId);

      const { departmentId, status } = req.query as {
        departmentId?: string;
        status?: string;
      };

      const whereClause: any = {
        student: { schoolId },
      };

      if (departmentId) {
        whereClause.student.schoolDepartmentId = departmentId;
      }
      if (status) {
        whereClause.status = status;
      }

      // Jika role TEACHER, batasi hanya menampilkan siswa bimbingannya kecuali admin
      if (user.role === "TEACHER") {
        whereClause.teacherId = user.id;
      }

      const placements = await prisma.placement.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              identityNumber: true,
              whatsappNumber: true,
              schoolDepartment: { select: { id: true, name: true } },
            },
          },
          teacher: {
            select: { id: true, fullName: true, identityNumber: true },
          },
          dudiPartner: {
            select: {
              id: true,
              name: true,
              sectorCategory: true,
              address: true,
              city: true,
              latitude: true,
              longitude: true,
            },
          },
          dudiMentor: {
            select: { id: true, fullName: true, jobTitle: true, tokenBoundAt: true },
          },
          academicPeriod: {
            select: { id: true, name: true },
          },
          _count: {
            select: { dailyLogs: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        data: placements.map((p) => ({
          id: p.id,
          academicPeriod: p.academicPeriod,
          student: p.student,
          teacher: p.teacher,
          dudiPartner: {
            id: p.dudiPartner.id,
            name: p.dudiPartner.name,
            sectorCategory: p.dudiPartner.sectorCategory,
            city: p.dudiPartner.city,
            address: p.dudiPartner.address,
            latitude: Number(p.dudiPartner.latitude),
            longitude: Number(p.dudiPartner.longitude),
          },
          dudiMentor: p.dudiMentor
            ? {
                id: p.dudiMentor.id,
                fullName: p.dudiMentor.fullName,
                jobTitle: p.dudiMentor.jobTitle,
                isDeviceBound: Boolean(p.dudiMentor.tokenBoundAt),
              }
            : null,
          compatibilityScore: Number(p.compatibilityScore),
          coverageScore: Number(p.coverageScore),
          distanceKm: Number(p.distanceKm),
          requiresMidtermRotation: p.requiresMidtermRotation,
          status: p.status,
          rotationSequence: p.rotationSequence,
          logsCount: p._count.dailyLogs,
          createdAt: p.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/schools/:schoolId/placements ───────────────────────────────────
/**
 * Konfirmasi dan simpan penempatan siswa ke DUDI (FR-004)
 */
placementsRouter.post(
  "/",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId } = req.params as { schoolId: string };
      const user = req.user!;
      verifySchoolTenant(user, schoolId);

      const parsed = createPlacementSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Input data penempatan tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const data = parsed.data;

      // 1. Validasi Periode Akademik
      let academicPeriodId = data.academicPeriodId;
      let targetTotalJp = 792;
      if (!academicPeriodId) {
        const activePeriod = await prisma.academicPeriod.findFirst({
          where: { schoolId, isActive: true },
          orderBy: { createdAt: "desc" },
        });
        if (!activePeriod) {
          throw new AppError(
            "Tidak ditemukan periode akademik aktif di sekolah ini.",
            422,
            "NO_ACTIVE_PERIOD"
          );
        }
        academicPeriodId = activePeriod.id;
        targetTotalJp = activePeriod.targetTotalJp;
      }

      // 2. Validasi Siswa
      const student = await prisma.userProfile.findFirst({
        where: { id: data.studentId, schoolId, role: "STUDENT" },
        include: {
          schoolDepartment: {
            include: { cpElements: true },
          },
          school: { select: { latitude: true, longitude: true } },
          studentPlacements: {
            where: { academicPeriodId, status: "ACTIVE" },
          },
        },
      });

      if (!student) {
        throw new AppError("Siswa tidak ditemukan atau bukan milik sekolah ini.", 404, "NOT_FOUND");
      }

      if (student.studentPlacements.length > 0) {
        throw new AppError(
          "Siswa ini sudah memiliki penempatan magang aktif di periode yang sama.",
          409,
          "ALREADY_PLACED"
        );
      }

      // 3. Validasi Guru Pembimbing
      const teacher = await prisma.userProfile.findFirst({
        where: { id: data.teacherId, schoolId, role: "TEACHER" },
      });

      if (!teacher) {
        throw new AppError("Guru pembimbing tidak ditemukan di sekolah ini.", 404, "NOT_FOUND");
      }

      // 4. Validasi DUDI & Kuota
      const partner = await prisma.dudiPartner.findUnique({
        where: { id: data.dudiPartnerId },
        include: {
          capabilities: {
            include: {
              jobCard: { select: { id: true, cpElementId: true, isNonCompetency: true } },
            },
          },
          placements: {
            where: { academicPeriodId, status: "ACTIVE" },
            select: { id: true },
          },
        },
      });

      if (!partner) {
        throw new AppError("Mitra DUDI tidak ditemukan.", 404, "NOT_FOUND");
      }

      const activePlacementsCount = partner.placements.length;
      if (activePlacementsCount >= partner.maxQuota && !data.overrideReason) {
        throw new AppError(
          `Kuota aktif pada mitra ${partner.name} sudah penuh (${activePlacementsCount}/${partner.maxQuota}). Naikkan kuota mitra atau sertakan alasan override manual.`,
          422,
          "QUOTA_EXCEEDED"
        );
      }

      // 5. Validasi Mentor (jika disertakan)
      if (data.dudiMentorId) {
        const mentor = await prisma.dudiMentor.findFirst({
          where: { id: data.dudiMentorId, dudiPartnerId: data.dudiPartnerId },
        });
        if (!mentor) {
          throw new AppError("Mentor industri tidak ditemukan pada mitra DUDI ini.", 404, "NOT_FOUND");
        }
      }

      // 6. Hitung Skor Kecocokan & Spasial
      const studentLat = student.homeLatitude
        ? Number(student.homeLatitude)
        : student.school.latitude
        ? Number(student.school.latitude)
        : -7.2575;
      const studentLon = student.homeLongitude
        ? Number(student.homeLongitude)
        : student.school.longitude
        ? Number(student.school.longitude)
        : 112.7521;

      const cpElements = student.schoolDepartment?.cpElements ?? [];
      const supportedCpElementIds = new Set(
        partner.capabilities
          .filter((c) => !c.jobCard.isNonCompetency && c.jobCard.cpElementId)
          .map((c) => c.jobCard.cpElementId!)
      );

      const supportedCpJp = cpElements
        .filter((cp) => supportedCpElementIds.has(cp.id))
        .reduce((sum, cp) => sum + cp.targetJp, 0);

      const scoreResult = calculatePlacementScore({
        supportedCpJp,
        targetTotalJp,
        studentLat,
        studentLon,
        dudiLat: Number(partner.latitude),
        dudiLon: Number(partner.longitude),
      });

      // 7. Simpan Penempatan ke Database
      const placement = await prisma.placement.create({
        data: {
          academicPeriodId,
          studentId: data.studentId,
          teacherId: data.teacherId,
          dudiPartnerId: data.dudiPartnerId,
          dudiMentorId: data.dudiMentorId ?? null,
          compatibilityScore: scoreResult.totalScore,
          coverageScore: scoreResult.competencyScore,
          distanceKm: scoreResult.distanceKm,
          requiresMidtermRotation: scoreResult.requiresMidtermRotation,
          status: "ACTIVE",
        },
        include: {
          student: { select: { id: true, fullName: true } },
          teacher: { select: { id: true, fullName: true } },
          dudiPartner: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        message: "Penempatan siswa berhasil dikonfirmasi.",
        data: {
          id: placement.id,
          student: placement.student,
          teacher: placement.teacher,
          dudiPartner: placement.dudiPartner,
          scores: {
            totalScore: scoreResult.totalScore,
            competencyScore: scoreResult.competencyScore,
            distanceKm: scoreResult.distanceKm,
            requiresMidtermRotation: scoreResult.requiresMidtermRotation,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/schools/:schoolId/placements/batch ─────────────────────────────
/**
 * Konfirmasi penugasan massal sekaligus (Batch Placement)
 */
placementsRouter.post(
  "/batch",
  requireAuth,
  requireRole("SCHOOL_ADMIN"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId } = req.params as { schoolId: string };
      const user = req.user!;
      verifySchoolTenant(user, schoolId);

      const parsed = batchCreatePlacementSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Input batch penempatan tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const activePeriod = await prisma.academicPeriod.findFirst({
        where: { schoolId, isActive: true },
        orderBy: { createdAt: "desc" },
      });

      if (!activePeriod) {
        throw new AppError("Tidak ditemukan periode akademik aktif.", 422, "NO_ACTIVE_PERIOD");
      }

      const placementsInput = parsed.data.placements;

      // Jalankan seluruh batch dalam 1 transaksi DB
      const result = await prisma.$transaction(async (tx) => {
        const createdList = [];

        for (const item of placementsInput) {
          const student = await tx.userProfile.findFirst({
            where: { id: item.studentId, schoolId, role: "STUDENT" },
            include: {
              schoolDepartment: { include: { cpElements: true } },
              school: { select: { latitude: true, longitude: true } },
            },
          });

          if (!student) {
            throw new AppError(`Siswa ${item.studentId} tidak ditemukan.`, 404, "NOT_FOUND");
          }

          const partner = await tx.dudiPartner.findUnique({
            where: { id: item.dudiPartnerId },
            include: {
              capabilities: {
                include: {
                  jobCard: { select: { id: true, cpElementId: true, isNonCompetency: true } },
                },
              },
            },
          });

          if (!partner) {
            throw new AppError(`DUDI ${item.dudiPartnerId} tidak ditemukan.`, 404, "NOT_FOUND");
          }

          const studentLat = student.homeLatitude
            ? Number(student.homeLatitude)
            : student.school.latitude
            ? Number(student.school.latitude)
            : -7.2575;
          const studentLon = student.homeLongitude
            ? Number(student.homeLongitude)
            : student.school.longitude
            ? Number(student.school.longitude)
            : 112.7521;

          const cpElements = student.schoolDepartment?.cpElements ?? [];
          const supportedCpElementIds = new Set(
            partner.capabilities
              .filter((c) => !c.jobCard.isNonCompetency && c.jobCard.cpElementId)
              .map((c) => c.jobCard.cpElementId!)
          );

          const supportedCpJp = cpElements
            .filter((cp) => supportedCpElementIds.has(cp.id))
            .reduce((sum, cp) => sum + cp.targetJp, 0);

          const score = calculatePlacementScore({
            supportedCpJp,
            targetTotalJp: activePeriod.targetTotalJp,
            studentLat,
            studentLon,
            dudiLat: Number(partner.latitude),
            dudiLon: Number(partner.longitude),
          });

          const placed = await tx.placement.create({
            data: {
              academicPeriodId: activePeriod.id,
              studentId: item.studentId,
              teacherId: item.teacherId,
              dudiPartnerId: item.dudiPartnerId,
              dudiMentorId: item.dudiMentorId ?? null,
              compatibilityScore: score.totalScore,
              coverageScore: score.competencyScore,
              distanceKm: score.distanceKm,
              requiresMidtermRotation: score.requiresMidtermRotation,
              status: "ACTIVE",
            },
          });

          createdList.push(placed);
        }

        return createdList;
      });

      res.status(201).json({
        message: `Berhasil menempatkan ${result.length} siswa secara massal.`,
        data: {
          count: result.length,
          placementIds: result.map((p) => p.id),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/schools/:schoolId/students/:studentId/coordinates ─────────────
/**
 * Update koordinat domisili siswa (dari GPS atau pin peta OSM)
 */
placementsRouter.patch(
  "/students/:studentId/coordinates",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId, studentId } = req.params as {
        schoolId: string;
        studentId: string;
      };
      const user = req.user!;
      verifySchoolTenant(user, schoolId);

      const parsed = updateStudentCoordinatesSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Koordinat tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const { homeLatitude, homeLongitude } = parsed.data;

      const student = await prisma.userProfile.findFirst({
        where: { id: studentId, schoolId, role: "STUDENT" },
      });

      if (!student) {
        throw new AppError("Siswa tidak ditemukan di sekolah ini.", 404, "NOT_FOUND");
      }

      const updated = await prisma.userProfile.update({
        where: { id: studentId },
        data: {
          homeLatitude,
          homeLongitude,
        },
        select: {
          id: true,
          fullName: true,
          homeLatitude: true,
          homeLongitude: true,
        },
      });

      res.json({
        message: "Titik koordinat domisili siswa berhasil diperbarui.",
        data: {
          studentId: updated.id,
          fullName: updated.fullName,
          homeLatitude: Number(updated.homeLatitude),
          homeLongitude: Number(updated.homeLongitude),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/schools/:schoolId/placements/:id/rotate
 * FR-009: Rotasi Mitra DUDI Tengah Semester (TC-009)
 */
placementsRouter.post("/:id/rotate", handlePlacementRotation);
