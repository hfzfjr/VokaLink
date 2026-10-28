import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";
import {
  createInterventionSchema,
  generateInterventionDraftSchema,
  rotatePlacementSchema,
  type InterventionDraftResult,
  type RotationExecutionResult,
} from "@vokalink/shared";
import {
  generateInterventionMessage,
  buildWhatsAppDeepLink,
  normalizeIndonesianPhoneNumber,
} from "@vokalink/core";

export const interventionsRouter = Router();

// ─── 1. POST /api/v1/interventions/draft ──────────────────────────────────────
/**
 * Menyusun draf pesan koordinasi WhatsApp berbasis data yang sopan & terstruktur (FR-009).
 */
interventionsRouter.post(
  "/draft",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = generateInterventionDraftSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message || "Format data permintaan draf intervensi tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const { studentId, placementId, driftAlertId, alertType } = parsed.data;

      // Cek ketersediaan database
      let isDbAvailable = false;
      try {
        if (process.env.DATABASE_URL) {
          await prisma.$queryRaw`SELECT 1`;
          isDbAvailable = true;
        }
      } catch {
        isDbAvailable = false;
      }

      let studentName = "Siswa Vokasi";
      let departmentName = "Rekayasa Perangkat Lunak";
      let schoolName = "SMK Negeri 1 Surabaya";
      let teacherName = req.user ? "Guru Pembimbing" : "Dra. Siti Rahayu, M.Pd";
      let mentorName = "Bapak/Ibu Mentor";
      let mentorTitle = "Pembimbing Lapangan";
      let mentorPhone = "081234567890";
      let dudiName = "Mitra DUDI";
      let effectiveAlertType = alertType || "GENERAL";

      let nonCompJp14d = 16;
      let totalJp14d = 40;
      let dominantElementName = "Pemrograman Web & Mobile";
      let dominantJp = 162;
      let dominantRatio = 0.85;
      let dormantCount = 7;
      let zeroJpElements: string[] = ["Basis Data Relasional", "Cloud Pipeline"];
      let recommendedJobCards: string[] = ["Database Query & Migration", "CI/CD Setup"];
      let magicLinkUrl = "http://localhost:3000/v/mock-demo-token-123";

      if (isDbAvailable) {
        // Query data siswa & sekolah
        const student = await prisma.userProfile.findUnique({
          where: { id: studentId },
          include: {
            school: true,
            schoolDepartment: {
              include: {
                cpElements: {
                  include: { jobCards: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        });

        if (student) {
          studentName = student.fullName;
          schoolName = student.school?.name || schoolName;
          departmentName = student.schoolDepartment?.name || departmentName;
        }

        // Query penempatan & mentor
        const placement = await prisma.placement.findUnique({
          where: { id: placementId },
          include: {
            dudiPartner: true,
            dudiMentor: true,
            teacher: true,
            dailyLogs: {
              include: { items: { include: { jobCard: true } } },
            },
          },
        });

        if (placement) {
          dudiName = placement.dudiPartner.name;
          if (placement.dudiMentor) {
            mentorName = placement.dudiMentor.fullName;
            mentorTitle = placement.dudiMentor.jobTitle;
            mentorPhone = placement.dudiMentor.whatsappNumber;
          }
          if (placement.teacher) {
            teacherName = placement.teacher.fullName;
          }

          // Hitung metrik 14 hari terakhir
          const now = new Date();
          const ms14d = 14 * 24 * 60 * 60 * 1000;
          let calculatedTotal14d = 0;
          let calculatedNonComp14d = 0;
          let calculatedDormant = 0;
          const cpVerifiedMap = new Map<string, number>();

          for (const log of placement.dailyLogs) {
            const is14d = now.getTime() - new Date(log.logDate).getTime() <= ms14d;
            if (log.status === "PENDING_VERIFICATION") {
              const diffDays =
                (now.getTime() - new Date(log.logDate).getTime()) / (24 * 60 * 60 * 1000);
              if (diffDays > 7) {
                calculatedDormant++;
              }
            }

            for (const item of log.items) {
              if (is14d) {
                calculatedTotal14d += item.durationJp;
                if (item.jobCard?.isNonCompetency || item.nonCompetencyCategory) {
                  calculatedNonComp14d += item.durationJp;
                }
              }
              if (log.status === "VERIFIED" && item.jobCard?.cpElementId) {
                cpVerifiedMap.set(
                  item.jobCard.cpElementId,
                  (cpVerifiedMap.get(item.jobCard.cpElementId) || 0) + item.durationJp
                );
              }
            }
          }

          if (calculatedTotal14d > 0) {
            totalJp14d = calculatedTotal14d;
            nonCompJp14d = calculatedNonComp14d;
          }
          if (calculatedDormant > 0) {
            dormantCount = calculatedDormant;
          }

          // Identifikasi elemen CP dominan (Skill Monotony)
          let calculatedDominantName = dominantElementName;
          let calculatedDominantJp = 0;
          let calculatedTotalVerified = 0;
          for (const [cpId, jp] of cpVerifiedMap.entries()) {
            calculatedTotalVerified += jp;
            if (jp > calculatedDominantJp) {
              calculatedDominantJp = jp;
              const cpObj = student?.schoolDepartment?.cpElements?.find((c) => c.id === cpId);
              if (cpObj) calculatedDominantName = cpObj.title;
            }
          }
          if (calculatedTotalVerified > 0 && calculatedDominantJp > 0) {
            dominantElementName = calculatedDominantName;
            dominantJp = calculatedDominantJp;
            dominantRatio = calculatedDominantJp / calculatedTotalVerified;
          }

          if (placement.dudiMentor) {
            const mentorSub = placement.dudiMentor.id ? placement.dudiMentor.id.slice(0, 8) : "demo";
            magicLinkUrl = `http://localhost:3000/v/mentor-${mentorSub}`;
          }

          // Identifikasi elemen CP yang masih 0 JP
          if (student?.schoolDepartment?.cpElements) {
            const zeros: string[] = [];
            const recJcs: string[] = [];
            for (const cp of student.schoolDepartment.cpElements) {
              const jp = cpVerifiedMap.get(cp.id) || 0;
              if (jp === 0) {
                zeros.push(cp.title);
                for (const jc of cp.jobCards.slice(0, 2)) {
                  recJcs.push(jc.title);
                }
              }
            }
            if (zeros.length > 0) {
              zeroJpElements = zeros;
              recommendedJobCards = recJcs;
            }
          }
        }

        // Query alert jika tersedia
        if (driftAlertId) {
          const alert = await prisma.driftAlert.findUnique({
            where: { id: driftAlertId },
          });
          if (alert) {
            effectiveAlertType = alert.alertType;
          }
        }
      }

      // Format pesan otomatis
      const messageText = generateInterventionMessage({
        studentName,
        departmentName,
        schoolName,
        teacherName,
        mentorName,
        mentorTitle,
        dudiName,
        alertType: effectiveAlertType as any,
        nonCompetencyJpLast14Days: nonCompJp14d,
        totalJpLast14Days: totalJp14d,
        dominantElementName,
        dominantJp,
        dominantRatio,
        dormantLogCount: dormantCount,
        zeroJpElements,
        recommendedJobCards,
        magicLinkUrl,
      });

      const waLink = buildWhatsAppDeepLink(mentorPhone, messageText);

      const result: InterventionDraftResult = {
        messageText,
        waLink,
        mentorName,
        mentorPhone: normalizeIndonesianPhoneNumber(mentorPhone),
        studentName,
        dudiName,
        alertType: effectiveAlertType,
      };

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── 2. POST /api/v1/interventions ───────────────────────────────────────────
/**
 * Menyimpan log tindak lanjut intervensi guru dan memperbarui status anomali (FR-009).
 */
interventionsRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createInterventionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.errors[0]?.message || "Format data intervensi tidak valid",
          422,
          "VALIDATION_ERROR"
        );
      }

      const { driftAlertId, placementId, studentId, actionType, messageSent, newDudiId, newMentorId } =
        parsed.data;

      // Cek ketersediaan database
      let isDbAvailable = false;
      try {
        if (process.env.DATABASE_URL) {
          await prisma.$queryRaw`SELECT 1`;
          isDbAvailable = true;
        }
      } catch {
        isDbAvailable = false;
      }

      // Default ID guru jika belum ada auth sesi
      const teacherId =
        req.user?.id || "00000000-0000-0000-0000-000000000021";

      if (!isDbAvailable) {
        res.status(201).json({
          success: true,
          message: "Intervensi pembimbing berhasil dicatat (Mode Demo / Sandbox).",
          intervention: {
            id: "demo-intervention-" + Date.now(),
            driftAlertId,
            placementId,
            studentId,
            teacherId,
            actionType,
            messageSent,
            createdAt: new Date().toISOString(),
          },
        });
        return;
      }

      // ─── TRANSAKSI DATABASE ───────────────────────────────────────────────
      const result = await prisma.$transaction(async (tx) => {
        let actualAlertId = driftAlertId;

        // Jika tidak ada driftAlertId langsung tapi ada penempatan, cari alert open
        if (!actualAlertId) {
          const openAlert = await tx.driftAlert.findFirst({
            where: { placementId, status: "OPEN" },
          });
          if (openAlert) {
            actualAlertId = openAlert.id;
          }
        }

        // Resolusi teacherId dari penempatan jika req.user belum terpasang
        const placement = await tx.placement.findUnique({
          where: { id: placementId },
          select: { teacherId: true },
        });
        const effectiveTeacherId = req.user?.id || placement?.teacherId || teacherId;

        // 1. Simpan InterventionLog
        let intervention = null;
        if (actualAlertId) {
          intervention = await tx.interventionLog.create({
            data: {
              driftAlertId: actualAlertId,
              teacherId: effectiveTeacherId,
              actionType,
              messageSent,
            },
          });

          // 2. Update status DriftAlert menjadi INTERVENED atau RESOLVED
          const nextStatus = actionType === "DUDI_ROTATION" ? "RESOLVED" : "INTERVENED";
          await tx.driftAlert.update({
            where: { id: actualAlertId },
            data: {
              status: nextStatus,
              resolvedAt: nextStatus === "RESOLVED" ? new Date() : undefined,
            },
          });
        }

        // 3. Jika tindakan adalah rotasi DUDI, eksekusi rotasi penempatan
        if (actionType === "DUDI_ROTATION" && newDudiId) {
          const currentPlacement = await tx.placement.findUnique({
            where: { id: placementId },
          });

          if (currentPlacement && currentPlacement.status === "ACTIVE") {
            await tx.placement.update({
              where: { id: placementId },
              data: { status: "ROTATED_OUT" },
            });

            await tx.placement.create({
              data: {
                academicPeriodId: currentPlacement.academicPeriodId,
                studentId: currentPlacement.studentId,
                teacherId: currentPlacement.teacherId,
                dudiPartnerId: newDudiId,
                dudiMentorId: newMentorId || null,
                compatibilityScore: currentPlacement.compatibilityScore,
                distanceKm: currentPlacement.distanceKm,
                requiresMidtermRotation: false,
                rotatedFromId: currentPlacement.id,
                rotationSequence: currentPlacement.rotationSequence + 1,
                status: "ACTIVE",
              },
            });
          }
        }

        return intervention;
      });

      res.status(201).json({
        success: true,
        message:
          actionType === "DUDI_ROTATION"
            ? "Rotasi mitra DUDI berhasil dan status intervensi diperbarui."
            : "Catatan intervensi guru berhasil disimpan.",
        intervention: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── 3. POST /api/v1/placements/:id/rotate & /api/v1/interventions/rotate ────
/**
 * Eksekusi Rotasi Mitra DUDI Tengah Semester (A1 & TC-009).
 * - Mengubah penempatan lama menjadi ROTATED_OUT.
 * - Membuka penempatan baru dengan status ACTIVE.
 * - Menjaga total jam terverifikasi tetap utuh.
 */
interventionsRouter.post(
  "/rotate",
  handlePlacementRotation
);

export async function handlePlacementRotation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = rotatePlacementSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors[0]?.message || "Data permintaan rotasi DUDI tidak valid",
        422,
        "VALIDATION_ERROR"
      );
    }

    const { studentId, fromPlacementId, toDudiId, toMentorId, driftAlertId, reason, notes } =
      parsed.data;

    let isDbAvailable = false;
    try {
      if (process.env.DATABASE_URL) {
        await prisma.$queryRaw`SELECT 1`;
        isDbAvailable = true;
      }
    } catch {
      isDbAvailable = false;
    }

    // Default mock response jika DB offline / sandbox
    if (!isDbAvailable) {
      const mockResult: RotationExecutionResult = {
        success: true,
        message: "Rotasi mitra DUDI berhasil dieksekusi (Mode Demo Sandbox).",
        previousPlacement: {
          id: fromPlacementId,
          dudiName: "PT Nusantara Tech (DUDI A)",
          status: "ROTATED_OUT",
          verifiedJp: 380,
        },
        newPlacement: {
          id: "new-placement-" + Date.now(),
          dudiId: toDudiId,
          dudiName: "PT Inovasi Digital Mandiri (DUDI B)",
          mentorName: "Budi Santoso",
          status: "ACTIVE",
          rotationSequence: 2,
        },
        cumulativeVerifiedJp: 430,
        interventionLogId: "demo-intervention-log",
      };
      res.status(200).json(mockResult);
      return;
    }

    // ─── EKSEKUSI DATABASE PRISMA ───────────────────────────────────────────
    const oldPlacement = await prisma.placement.findUnique({
      where: { id: fromPlacementId },
      include: {
        dudiPartner: true,
        dailyLogs: {
          where: { status: "VERIFIED" },
          include: { items: true },
        },
      },
    });

    if (!oldPlacement) {
      throw new AppError("Penempatan asal tidak ditemukan", 404, "NOT_FOUND");
    }

    if (oldPlacement.studentId !== studentId) {
      throw new AppError(
        "ID Siswa tidak sesuai dengan penempatan asal",
        422,
        "STUDENT_MISMATCH"
      );
    }

    if (oldPlacement.status !== "ACTIVE") {
      throw new AppError(
        "Hanya penempatan berstatus ACTIVE yang dapat dirotasi",
        422,
        "INVALID_PLACEMENT_STATUS"
      );
    }

    // Cek DUDI tujuan
    const targetDudi = await prisma.dudiPartner.findUnique({
      where: { id: toDudiId },
      include: {
        placements: { where: { status: "ACTIVE" } },
        mentors: true,
      },
    });

    if (!targetDudi) {
      throw new AppError("Mitra DUDI tujuan tidak ditemukan", 404, "DUDI_NOT_FOUND");
    }

    if (targetDudi.placements.length >= targetDudi.maxQuota) {
      throw new AppError(
        `Kuota aktif pada mitra ${targetDudi.name} sudah penuh (${targetDudi.placements.length}/${targetDudi.maxQuota}).`,
        422,
        "QUOTA_EXCEEDED"
      );
    }

    const mentorIdToAssign =
      toMentorId || targetDudi.mentors[0]?.id || null;

    // Hitung total JP terverifikasi di DUDI lama
    let oldVerifiedJp = 0;
    for (const log of oldPlacement.dailyLogs) {
      for (const item of log.items) {
        oldVerifiedJp += item.durationJp;
      }
    }

    const teacherId = req.user?.id || oldPlacement.teacherId;

    // Transaksi Atomik Rotasi Mitra
    const execution = await prisma.$transaction(async (tx) => {
      // 1. Nonaktifkan penempatan lama -> ROTATED_OUT
      const updatedOld = await tx.placement.update({
        where: { id: fromPlacementId },
        data: { status: "ROTATED_OUT" },
      });

      // 2. Buat penempatan baru -> ACTIVE
      const newPlacement = await tx.placement.create({
        data: {
          academicPeriodId: oldPlacement.academicPeriodId,
          studentId: oldPlacement.studentId,
          teacherId: oldPlacement.teacherId,
          dudiPartnerId: toDudiId,
          dudiMentorId: mentorIdToAssign,
          compatibilityScore: oldPlacement.compatibilityScore,
          distanceKm: oldPlacement.distanceKm,
          requiresMidtermRotation: false,
          rotatedFromId: oldPlacement.id,
          rotationSequence: oldPlacement.rotationSequence + 1,
          status: "ACTIVE",
        },
        include: {
          dudiPartner: true,
          dudiMentor: true,
        },
      });

      // 3. Selesaikan anomali drift jika ada
      let alertIdToResolve = driftAlertId;
      if (!alertIdToResolve) {
        const openAlert = await tx.driftAlert.findFirst({
          where: { placementId: fromPlacementId, status: "OPEN" },
        });
        if (openAlert) alertIdToResolve = openAlert.id;
      }

      let interventionLogId: string | undefined;
      if (alertIdToResolve) {
        await tx.driftAlert.update({
          where: { id: alertIdToResolve },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
          },
        });

        const iLog = await tx.interventionLog.create({
          data: {
            driftAlertId: alertIdToResolve,
            teacherId,
            actionType: "DUDI_ROTATION",
            messageSent: `Rotasi mitra dari ${oldPlacement.dudiPartner.name} ke ${targetDudi.name}. Alasan: ${reason}. ${notes || ""}`,
          },
        });
        interventionLogId = iLog.id;
      }

      return {
        updatedOld,
        newPlacement,
        interventionLogId,
      };
    });

    const result: RotationExecutionResult = {
      success: true,
      message: `Rotasi siswa dari ${oldPlacement.dudiPartner.name} ke ${targetDudi.name} berhasil dieksekusi.`,
      previousPlacement: {
        id: execution.updatedOld.id,
        dudiName: oldPlacement.dudiPartner.name,
        status: execution.updatedOld.status,
        verifiedJp: oldVerifiedJp,
      },
      newPlacement: {
        id: execution.newPlacement.id,
        dudiId: execution.newPlacement.dudiPartnerId,
        dudiName: execution.newPlacement.dudiPartner.name,
        mentorName: execution.newPlacement.dudiMentor?.fullName || "-",
        status: execution.newPlacement.status,
        rotationSequence: execution.newPlacement.rotationSequence,
      },
      cumulativeVerifiedJp: oldVerifiedJp,
      interventionLogId: execution.interventionLogId,
    };

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// ─── 4. GET /api/v1/interventions ────────────────────────────────────────────
/**
 * Riwayat Log Intervensi & Bimbingan Guru
 */
interventionsRouter.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let isDbAvailable = false;
      try {
        if (process.env.DATABASE_URL) {
          await prisma.$queryRaw`SELECT 1`;
          isDbAvailable = true;
        }
      } catch {
        isDbAvailable = false;
      }

      if (!isDbAvailable) {
        res.status(200).json({
          interventions: [
            {
              id: "intervention-eko",
              actionType: "DUDI_ROTATION",
              messageSent:
                "Rotasi mitra dari Kantor Akuntan A ke Koperasi B untuk memenuhi kompetensi Pajak & Rekonsiliasi (TC-009).",
              teacherName: "Dra. Siti Rahayu, M.Pd",
              studentName: "Eko Saputra",
              createdAt: "2026-10-18T08:30:00.000Z",
            },
          ],
        });
        return;
      }

      const logs = await prisma.interventionLog.findMany({
        include: {
          teacher: true,
          driftAlert: {
            include: {
              student: true,
              placement: {
                include: { dudiPartner: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formatted = logs.map((log) => ({
        id: log.id,
        actionType: log.actionType,
        messageSent: log.messageSent,
        teacherName: log.teacher.fullName,
        studentName: log.driftAlert.student.fullName,
        dudiName: log.driftAlert.placement.dudiPartner.name,
        alertType: log.driftAlert.alertType,
        createdAt: log.createdAt.toISOString(),
      }));

      res.status(200).json({ interventions: formatted });
    } catch (err) {
      next(err);
    }
  }
);
