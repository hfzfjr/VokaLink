import { Router, type Request, type Response, type NextFunction } from "express";
import { createTenantPrisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";
import { requireAuth, requireRole, type AuthUser } from "../middlewares/auth.js";
import {
  updateCpElementsSchema,
  addJobCardSchema,
  updateJobCardSchema,
} from "@vokalink/shared";

export const curriculumRouter = Router({ mergeParams: true });

// ─── Tenant Guard Helper ───────────────────────────────────────────────────────
/**
 * Verifikasi department milik school dari token. Mengembalikan schoolDepartment.
 * Throws AppError 403/404 jika tidak cocok.
 */
async function resolveDepartment(
  user: AuthUser,
  deptId: string,
  schoolIdFromParam: string
) {
  if (user.schoolId !== schoolIdFromParam) {
    throw new AppError("Akses ditolak: tenant tidak cocok.", 403, "FORBIDDEN");
  }

  const tenantPrisma = createTenantPrisma({
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
  });

  const dept = await tenantPrisma.schoolDepartment.findFirst({
    where: { id: deptId, schoolId: user.schoolId },
    include: {
      cpElements: { orderBy: { sortOrder: "asc" } },
      jobCards: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!dept) {
    throw new AppError("Jurusan tidak ditemukan.", 404, "NOT_FOUND");
  }

  return { dept, tenantPrisma };
}

// ─── GET /api/schools/:schoolId/departments/:deptId/curriculum ────────────────
/**
 * Tampilkan matriks kurikulum: elemen CP + job cards per elemen.
 * Juga sertakan periode aktif (targetTotalJp) untuk validasi slider.
 */
curriculumRouter.get(
  "/",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId, deptId } = req.params as { schoolId: string; deptId: string };
      const user = req.user!;

      const { dept, tenantPrisma } = await resolveDepartment(
        user,
        deptId,
        schoolId
      );

      // Ambil periode aktif untuk targetTotalJp
      const activePeriod = await tenantPrisma.academicPeriod.findFirst({
        where: { schoolId: user.schoolId, isActive: true },
        select: { targetTotalJp: true, name: true },
      });

      const targetTotalJp = activePeriod?.targetTotalJp ?? 792;

      // Hitung total JP saat ini
      const currentTotalJp = dept.cpElements.reduce(
        (acc, el) => acc + el.targetJp,
        0
      );

      // Kelompokkan job cards per elemen CP
      const elements = dept.cpElements.map((el) => ({
        id: el.id,
        code: el.code,
        title: el.title,
        targetJp: el.targetJp,
        sortOrder: el.sortOrder,
        jobCards: dept.jobCards
          .filter((jc) => jc.cpElementId === el.id)
          .map((jc) => ({
            id: jc.id,
            title: jc.title,
            skkniUnitCode: jc.skkniUnitCode,
            toolsAndSoftware: jc.toolsAndSoftware,
            actionVerbTemplate: jc.actionVerbTemplate,
            isNonCompetency: jc.isNonCompetency,
          })),
      }));

      // Job card non-kompetensi (Bantuan Operasional Umum)
      const nonCompetencyCards = dept.jobCards
        .filter((jc) => jc.isNonCompetency)
        .map((jc) => ({
          id: jc.id,
          title: jc.title,
          skkniUnitCode: jc.skkniUnitCode,
          toolsAndSoftware: jc.toolsAndSoftware,
          actionVerbTemplate: jc.actionVerbTemplate,
          isNonCompetency: true,
        }));

      res.json({
        data: {
          department: {
            id: dept.id,
            sectorCode: dept.sectorCode,
            name: dept.name,
            isLocked: dept.isLocked,
          },
          activePeriod: activePeriod
            ? { name: activePeriod.name, targetTotalJp }
            : { name: "—", targetTotalJp },
          currentTotalJp,
          jpDelta: targetTotalJp - currentTotalJp,
          elements,
          nonCompetencyCards,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/schools/:schoolId/departments/:deptId/curriculum ────────────────
/**
 * Update bobot target JP seluruh elemen CP.
 * BR: sum(targetJp) HARUS === activePeriod.targetTotalJp
 */
curriculumRouter.put(
  "/",
  requireAuth,
  requireRole("SCHOOL_ADMIN"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId, deptId } = req.params as { schoolId: string; deptId: string };
      const user = req.user!;

      const { dept, tenantPrisma } = await resolveDepartment(
        user,
        deptId,
        schoolId
      );

      if (dept.isLocked) {
        throw new AppError(
          "Kurikulum sudah dikunci. Hubungi admin untuk membuka kunci.",
          409,
          "CURRICULUM_LOCKED"
        );
      }

      const parsed = updateCpElementsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Input tidak valid.",
          422,
          "VALIDATION_ERROR"
        );
      }

      const { elements } = parsed.data;

      // Validasi: semua elemen ID harus milik dept ini
      const validIds = new Set(dept.cpElements.map((el) => el.id));
      for (const el of elements) {
        if (!validIds.has(el.id)) {
          throw new AppError(
            `Elemen CP dengan ID ${el.id} tidak ditemukan di jurusan ini.`,
            422,
            "INVALID_ELEMENT_ID"
          );
        }
      }

      // Validasi BR: sum === targetTotalJp
      const activePeriod = await tenantPrisma.academicPeriod.findFirst({
        where: { schoolId: user.schoolId, isActive: true },
        select: { targetTotalJp: true },
      });
      const targetTotalJp = activePeriod?.targetTotalJp ?? 792;
      const sumJp = elements.reduce((acc, el) => acc + el.targetJp, 0);

      if (sumJp !== targetTotalJp) {
        throw new AppError(
          `Total alokasi saat ini ${sumJp} JP (${
            sumJp < targetTotalJp
              ? `Kurang ${targetTotalJp - sumJp}`
              : `Kelebihan ${sumJp - targetTotalJp}`
          } JP dari target ${targetTotalJp} JP).`,
          422,
          "JP_TOTAL_MISMATCH"
        );
      }

      // Update semua elemen dalam transaksi
      await tenantPrisma.$transaction(
        elements.map((el) =>
          tenantPrisma.cpElement.update({
            where: { id: el.id },
            data: { targetJp: el.targetJp },
          })
        )
      );

      res.json({
        message: "Bobot JP berhasil disimpan.",
        data: { totalJp: sumJp, targetTotalJp },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/schools/:schoolId/departments/:deptId/curriculum/lock ──────────
/**
 * Kunci matriks kurikulum.
 * BR: sum(targetJp) === targetTotalJp DAN setiap elemen CP punya min 2 job cards aktif.
 */
curriculumRouter.post(
  "/lock",
  requireAuth,
  requireRole("SCHOOL_ADMIN"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId, deptId } = req.params as { schoolId: string; deptId: string };
      const user = req.user!;

      const { dept, tenantPrisma } = await resolveDepartment(
        user,
        deptId,
        schoolId
      );

      if (dept.isLocked) {
        throw new AppError("Kurikulum ini sudah terkunci.", 409, "ALREADY_LOCKED");
      }

      // Validasi sum JP
      const activePeriod = await tenantPrisma.academicPeriod.findFirst({
        where: { schoolId: user.schoolId, isActive: true },
        select: { targetTotalJp: true },
      });
      const targetTotalJp = activePeriod?.targetTotalJp ?? 792;
      const sumJp = dept.cpElements.reduce((acc, el) => acc + el.targetJp, 0);

      if (sumJp !== targetTotalJp) {
        throw new AppError(
          `Total alokasi saat ini ${sumJp} JP (${
            sumJp < targetTotalJp
              ? `Kurang ${targetTotalJp - sumJp}`
              : `Kelebihan ${sumJp - targetTotalJp}`
          } JP dari target ${targetTotalJp} JP). Perbaiki sebelum mengunci.`,
          422,
          "JP_TOTAL_MISMATCH"
        );
      }

      // Validasi min 2 job cards per elemen CP (hanya non-nonCompetency)
      for (const el of dept.cpElements) {
        const count = dept.jobCards.filter(
          (jc) => jc.cpElementId === el.id && !jc.isNonCompetency
        ).length;
        if (count < 2) {
          throw new AppError(
            `Elemen CP "${el.title}" hanya memiliki ${count} Job Card. Setiap elemen wajib minimal 2 Job Cards sebelum dikunci.`,
            422,
            "MIN_JOB_CARDS_NOT_MET"
          );
        }
      }

      // Kunci
      await tenantPrisma.schoolDepartment.update({
        where: { id: deptId },
        data: { isLocked: true },
      });

      res.json({
        message: "Matriks kurikulum berhasil dikunci.",
        data: { isLocked: true },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/schools/:schoolId/departments/:deptId/job-cards ───────────────
/** Tambah Job Card baru ke dalam elemen CP (atau non-kompetensi) */
curriculumRouter.post(
  "/job-cards",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId, deptId } = req.params as { schoolId: string; deptId: string };
      const user = req.user!;

      const { dept, tenantPrisma } = await resolveDepartment(
        user,
        deptId,
        schoolId
      );

      if (dept.isLocked) {
        throw new AppError(
          "Kurikulum sudah dikunci. Job Card baru tidak dapat ditambahkan.",
          409,
          "CURRICULUM_LOCKED"
        );
      }

      const parsed = addJobCardSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Input tidak valid.",
          422,
          "VALIDATION_ERROR"
        );
      }

      const data = parsed.data;

      // Validasi cpElementId milik dept ini
      if (data.cpElementId) {
        const elExists = dept.cpElements.some((el) => el.id === data.cpElementId);
        if (!elExists) {
          throw new AppError(
            "Elemen CP tidak ditemukan di jurusan ini.",
            422,
            "INVALID_ELEMENT_ID"
          );
        }
      }

      const jc = await tenantPrisma.jobCard.create({
        data: {
          schoolDepartmentId: deptId,
          cpElementId: data.cpElementId ?? null,
          title: data.title,
          skkniUnitCode: data.skkniUnitCode ?? null,
          toolsAndSoftware: data.toolsAndSoftware,
          actionVerbTemplate: data.actionVerbTemplate,
          isNonCompetency: data.isNonCompetency,
        },
      });

      res.status(201).json({
        message: "Job Card berhasil ditambahkan.",
        data: {
          id: jc.id,
          title: jc.title,
          cpElementId: jc.cpElementId,
          isNonCompetency: jc.isNonCompetency,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/schools/:schoolId/departments/:deptId/job-cards/:jcId ─────────
/** Update sebagian field Job Card */
curriculumRouter.patch(
  "/job-cards/:jcId",
  requireAuth,
  requireRole("SCHOOL_ADMIN", "TEACHER"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId, deptId, jcId } = req.params as { schoolId: string; deptId: string; jcId: string };
      const user = req.user!;

      const { dept, tenantPrisma } = await resolveDepartment(
        user,
        deptId,
        schoolId
      );

      if (dept.isLocked) {
        throw new AppError(
          "Kurikulum sudah dikunci. Job Card tidak dapat diubah.",
          409,
          "CURRICULUM_LOCKED"
        );
      }

      const jcExists = dept.jobCards.some((jc) => jc.id === jcId);
      if (!jcExists) {
        throw new AppError("Job Card tidak ditemukan.", 404, "NOT_FOUND");
      }

      const parsed = updateJobCardSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message ?? "Input tidak valid.",
          422,
          "VALIDATION_ERROR"
        );
      }

      const updated = await tenantPrisma.jobCard.update({
        where: { id: jcId },
        data: parsed.data,
      });

      res.json({
        message: "Job Card berhasil diperbarui.",
        data: { id: updated.id, title: updated.title },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/schools/:schoolId/departments/:deptId/job-cards/:jcId ────────
/** Hapus Job Card (hanya bila kurikulum belum dikunci & belum ada log yang pakai) */
curriculumRouter.delete(
  "/job-cards/:jcId",
  requireAuth,
  requireRole("SCHOOL_ADMIN"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schoolId, deptId, jcId } = req.params as { schoolId: string; deptId: string; jcId: string };
      const user = req.user!;

      const { dept, tenantPrisma } = await resolveDepartment(
        user,
        deptId,
        schoolId
      );

      if (dept.isLocked) {
        throw new AppError(
          "Kurikulum sudah dikunci. Job Card tidak dapat dihapus.",
          409,
          "CURRICULUM_LOCKED"
        );
      }

      const jc = dept.jobCards.find((j) => j.id === jcId);
      if (!jc) {
        throw new AppError("Job Card tidak ditemukan.", 404, "NOT_FOUND");
      }

      // Cek apakah sudah dipakai di daily log items
      const usageCount = await tenantPrisma.dailyLogItem.count({
        where: { jobCardId: jcId },
      });
      if (usageCount > 0) {
        throw new AppError(
          "Job Card ini sudah dipakai di log siswa dan tidak dapat dihapus.",
          409,
          "JOB_CARD_IN_USE"
        );
      }

      await tenantPrisma.jobCard.delete({ where: { id: jcId } });

      res.json({ message: "Job Card berhasil dihapus.", data: { id: jcId } });
    } catch (err) {
      next(err);
    }
  }
);
