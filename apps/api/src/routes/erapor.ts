import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";
import { requireAuth, requireRole, type AuthUser } from "../middlewares/auth.js";
import { eraporQuerySchema } from "@vokalink/shared";
import {
  calculateElementGrade,
  calculateFinalPklGrade,
  calculateOfficialFourElementsPklGrade,
  generateEraporNarratives,
  generateEraporCsv,
  type EraporExportRow,
} from "@vokalink/core";

export const eraporRouter = Router({ mergeParams: true });

function verifySchoolTenant(user: AuthUser, schoolIdFromParam: string) {
  if (user.schoolId !== schoolIdFromParam) {
    throw new AppError("Akses ditolak: tenant tidak cocok.", 403, "FORBIDDEN");
  }
}

// ─── GET /api/schools/:schoolId/erapor ─────────────────────────────────────────
/**
 * Rekap Nilai e-Rapor SMK Kurikulum Merdeka & Ekspor CSV (FR-011, BR-009)
 */
eraporRouter.get(
  "/",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId } = req.params as { schoolId: string };
      const user = req.user!;
      verifySchoolTenant(user, schoolId);

      const parsedQuery = eraporQuerySchema.safeParse(req.query);
      if (!parsedQuery.success) {
        throw new AppError(
          parsedQuery.error.errors[0]?.message ?? "Parameter query e-Rapor tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const { departmentId, academicPeriodId, format, search, page: rawPage, limit: rawLimit } =
        parsedQuery.data;

      const page = rawPage ?? 1;
      const limit = rawLimit ?? 10;
      const skip = (page - 1) * limit;
      const isCsv = format === "csv";

      // 1. Ambil data sekolah
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { id: true, name: true, city: true },
      });

      if (!school) {
        throw new AppError("Sekolah tidak ditemukan.", 404, "NOT_FOUND");
      }

      // 2. Ambil periode akademik aktif jika tidak dispesifikasikan
      let periodId = academicPeriodId;
      if (!periodId) {
        const activePeriod = await prisma.academicPeriod.findFirst({
          where: { schoolId, isActive: true },
          orderBy: { createdAt: "desc" },
        });
        if (!activePeriod) {
          throw new AppError(
            "Tidak ditemukan gelombang PKL aktif di sekolah ini.",
            422,
            "NO_ACTIVE_PERIOD"
          );
        }
        periodId = activePeriod.id;
      }

      // 3. Query penempatan siswa (filter jurusan, guru jika TEACHER, dan search)
      const basePlacementWhere: any = {
        academicPeriodId: periodId,
        student: { schoolId },
      };

      if (departmentId) {
        basePlacementWhere.student.schoolDepartmentId = departmentId;
      }
      if (user.role === "TEACHER") {
        basePlacementWhere.teacherId = user.id;
      }

      const q = search?.trim();
      const placementWhere: any = q
        ? {
            ...basePlacementWhere,
            OR: [
              { student: { fullName: { contains: q, mode: "insensitive" } } },
              { student: { identityNumber: { contains: q, mode: "insensitive" } } },
              { dudiPartner: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : basePlacementWhere;

      const hasPlacementCountFn = typeof prisma.placement.count === "function";

      const [placements, totalItemsRaw, totalAllStudentsRaw, pendingStudentsRaw] =
        await Promise.all([
          prisma.placement.findMany({
            where: placementWhere,
            include: {
              student: {
                select: {
                  id: true,
                  fullName: true,
                  identityNumber: true,
                  schoolDepartment: {
                    select: {
                      id: true,
                      name: true,
                      sectorCode: true,
                      cpElements: {
                        select: { id: true, code: true, title: true, targetJp: true },
                        orderBy: { sortOrder: "asc" },
                      },
                    },
                  },
                },
              },
              dudiPartner: {
                select: { id: true, name: true, city: true },
              },
              teacher: {
                select: { id: true, fullName: true, identityNumber: true },
              },
              endorsement: {
                select: { attitudeScore: true, endorsementQuote: true },
              },
              dailyLogs: {
                select: {
                  id: true,
                  status: true,
                  items: {
                    select: {
                      jobCardId: true,
                      durationJp: true,
                      autonomyLevel: true,
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
                },
              },
            },
            orderBy: { student: { fullName: "asc" } },
            ...(isCsv ? {} : { skip, take: limit }),
          }),
          !isCsv && hasPlacementCountFn
            ? prisma.placement.count({ where: placementWhere })
            : Promise.resolve(null),
          !isCsv && hasPlacementCountFn
            ? prisma.placement.count({ where: basePlacementWhere })
            : Promise.resolve(null),
          !isCsv && hasPlacementCountFn
            ? prisma.placement.count({
                where: {
                  ...basePlacementWhere,
                  dailyLogs: { some: { status: "PENDING_VERIFICATION" } },
                },
              })
            : Promise.resolve(null),
        ]);

      // 4. Hitung Nilai e-Rapor per Siswa sesuai BR-009
      let totalStudentsWithPendingLogs = 0;

      const studentResults = placements.map((p) => {
        const student = p.student;
        const dudi = p.dudiPartner;
        const department = student.schoolDepartment;
        const cpElements = department?.cpElements ?? [];

        // Periksa apakah siswa memiliki log PENDING_VERIFICATION
        const pendingLogsCount = p.dailyLogs.filter(
          (l) => l.status === "PENDING_VERIFICATION"
        ).length;
        if (pendingLogsCount > 0) {
          totalStudentsWithPendingLogs++;
        }

        // Ambil hanya item dari log yang berstatus VERIFIED (BR-009)
        const verifiedLogs = p.dailyLogs.filter((l) => l.status === "VERIFIED");
        const verifiedItems = verifiedLogs.flatMap((l) => l.items);

        let totalVerifiedJp = 0;
        const jobCardJpMap = new Map<
          string,
          { title: string; jp: number; cpElementId: string | null }
        >();

        // Agregasi JP per Job Card
        for (const item of verifiedItems) {
          totalVerifiedJp += item.durationJp;
          const jcId = item.jobCardId;
          const current = jobCardJpMap.get(jcId) || {
            title: item.jobCard.title,
            jp: 0,
            cpElementId: item.jobCard.cpElementId,
          };
          current.jp += item.durationJp;
          jobCardJpMap.set(jcId, current);
        }

        // Cari Job Card teknis dengan JP mandiri / jam tertinggi
        let topJobCardTitle: string | undefined;
        let maxJcHours = -1;
        for (const jc of jobCardJpMap.values()) {
          if (jc.jp > maxJcHours) {
            maxJcHours = jc.jp;
            topJobCardTitle = jc.title;
          }
        }

        // Hitung nilai capaian untuk masing-masing elemen CP Fase F
        let lowestElementTitle: string | undefined;
        let lowestElementScore = 101;
        let topElementTitle: string | undefined;
        let topElementScore = -1;

        const elementGradeResults = cpElements.map((el) => {
          const elItems = verifiedItems
            .filter((item) => item.jobCard.cpElementId === el.id)
            .map((item) => ({
              durationJp: item.durationJp,
              autonomyLevel: item.autonomyLevel as 1 | 2 | 3,
            }));

          const grade = calculateElementGrade({
            targetJp: el.targetJp,
            verifiedItems: elItems,
          });

          if (grade.score < lowestElementScore) {
            lowestElementScore = grade.score;
            lowestElementTitle = el.title;
          }
          if (grade.score > topElementScore) {
            topElementScore = grade.score;
            topElementTitle = el.title;
          }

          return {
            elementId: el.id,
            elementCode: el.code,
            elementTitle: el.title,
            targetJp: el.targetJp,
            verifiedJp: grade.verifiedJp,
            autonomyScore: grade.autonomyScore,
            score: grade.score,
          };
        });

        // Hitung nilai akhir teknis & gabungan sikap mentor (BR-009)
        const elementScores = elementGradeResults.map((r) => r.score);
        const attitudeScore = p.endorsement?.attitudeScore;

        const finalGrade = calculateFinalPklGrade({
          elementScores,
          mentorAttitudeScore: attitudeScore,
        });

        // Generate narasi kalimat Kurikulum Merdeka
        const narratives = generateEraporNarratives({
          studentName: student.fullName,
          dudiName: dudi.name,
          topJobCardTitle,
          topElementTitle,
          lowestElementTitle,
          lowestElementScore: lowestElementScore < 101 ? lowestElementScore : undefined,
        });

        // Struktur 4 Elemen Baku Mapel PKL Kurikulum Merdeka (Permendikbudristek No. 12/2024 & BSKAP)
        const fourElements = calculateOfficialFourElementsPklGrade({
          studentName: student.fullName,
          dudiName: dudi.name,
          totalVerifiedHours: totalVerifiedJp,
          attendanceDisciplinePercent:
            typeof attitudeScore === "number"
              ? Math.min(100, Math.max(80, attitudeScore))
              : 95,
          mentorAttitudeScore: attitudeScore,
          technicalElementScores: elementGradeResults.map((r, idx) => ({
            title: r.elementTitle,
            score: r.score,
            isAdvanced: idx >= Math.ceil(elementGradeResults.length / 2),
          })),
        });

        return {
          placementId: p.id,
          student: {
            id: student.id,
            fullName: student.fullName,
            identityNumber: student.identityNumber,
            department: department ? { id: department.id, name: department.name } : null,
          },
          dudiPartner: {
            id: dudi.id,
            name: dudi.name,
            city: dudi.city,
          },
          teacher: {
            id: p.teacher.id,
            fullName: p.teacher.fullName,
          },
          totalVerifiedJp,
          pendingLogsCount,
          elements: elementGradeResults,
          officialElements: fourElements.elements,
          attitudeScore: attitudeScore ?? null,
          isAttitudeIncluded: typeof attitudeScore === "number",
          finalGrade,
          highestAchievement: narratives.highestAchievement,
          needsImprovement: narratives.needsImprovement,
        };
      });

      // 5. Jika format adalah CSV, kirimkan file download
      if (format === "csv") {
        const csvRows: EraporExportRow[] = studentResults.map((s) => ({
          nisn: s.student.identityNumber,
          studentName: s.student.fullName,
          dudiName: s.dudiPartner.name,
          totalVerifiedJp: s.totalVerifiedJp,
          finalGrade: s.finalGrade,
          highestAchievement: s.highestAchievement,
          needsImprovement: s.needsImprovement,
          softSkillsScore: s.officialElements[0]?.score,
          hardSkillsCoreScore: s.officialElements[1]?.score,
          hardSkillsAdvancedScore: s.officialElements[2]?.score,
          entrepreneurshipScore: s.officialElements[3]?.score,
        }));

        const csvContent = generateEraporCsv(csvRows);
        const filename = `erapor-smk-${school.name.toLowerCase().replace(/\s+/g, "-")}.csv`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.status(200).send(csvContent);
        return;
      }

      // 6. Respon JSON default
      const totalItems =
        typeof totalItemsRaw === "number" ? totalItemsRaw : studentResults.length;
      const totalStudentsCount =
        typeof totalAllStudentsRaw === "number" ? totalAllStudentsRaw : totalItems;
      const pendingLogsStudentsCount =
        typeof pendingStudentsRaw === "number"
          ? pendingStudentsRaw
          : totalStudentsWithPendingLogs;

      res.json({
        data: {
          school: { id: school.id, name: school.name },
          totalStudents: totalStudentsCount,
          studentsWithPendingLogsCount: pendingLogsStudentsCount,
          warningMessage:
            pendingLogsStudentsCount > 0
              ? `Terdapat ${pendingLogsStudentsCount} siswa yang masih memiliki jurnal belum divalidasi mentor. Selesaikan validasi terlebih dahulu agar nilai optimal.`
              : null,
          records: studentResults,
          pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / limit)),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
