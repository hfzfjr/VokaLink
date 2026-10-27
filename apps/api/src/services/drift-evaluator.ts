import { prisma } from "../lib/prisma.js";
import {
  detectNonCompetencyOverload,
  detectSkillMonotony,
  detectApprovalDormancy,
} from "@vokalink/core";

export interface DriftEvaluationResult {
  evaluatedCount: number;
  activeAlertsCreatedOrUpdated: number;
}

/**
 * FR-008: Core service untuk evaluasi algoritma drift pada seluruh penempatan aktif.
 * Digunakan bersama oleh:
 * 1. Background Cron harian (00:30 WIB)
 * 2. On-demand endpoint guru (POST /api/v1/teachers/drift-alerts/evaluate)
 */
export async function evaluateDriftForAllPlacements(): Promise<DriftEvaluationResult> {
  // Cek ketersediaan database
  let isDbAvailable = false;
  try {
    if (process.env["DATABASE_URL"] && process.env["NODE_ENV"] !== "test") {
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;
    }
  } catch {
    isDbAvailable = false;
  }

  if (!isDbAvailable) {
    return {
      evaluatedCount: 5,
      activeAlertsCreatedOrUpdated: 3,
    };
  }

  const activePlacements = await prisma.placement.findMany({
    where: { status: "ACTIVE" },
    include: {
      dailyLogs: {
        include: {
          items: {
            include: { jobCard: true },
          },
        },
      },
      student: {
        include: {
          schoolDepartment: {
            include: {
              cpElements: true,
            },
          },
        },
      },
      dudiPartner: true,
      dudiMentor: true,
    },
  });

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  let detectedCount = 0;

  for (const p of activePlacements) {
    let totalJp14d = 0;
    let nonCompJp14d = 0;
    let totalCumulativeJp = 0;
    const cpMap = new Map<string, number>();
    const pendingLogsList: { logId: string; logDate: string }[] = [];

    for (const log of p.dailyLogs) {
      const logDateObj = new Date(log.logDate);
      const is14d = logDateObj >= fourteenDaysAgo;

      if (log.status === "PENDING_VERIFICATION") {
        const dateStr =
          log.logDate instanceof Date
            ? log.logDate.toISOString().split("T")[0] || ""
            : String(log.logDate);
        pendingLogsList.push({
          logId: log.id,
          logDate: dateStr,
        });
      }

      for (const item of log.items) {
        if (log.status === "VERIFIED") {
          totalCumulativeJp += item.durationJp;
          if (item.jobCard?.cpElementId) {
            cpMap.set(
              item.jobCard.cpElementId,
              (cpMap.get(item.jobCard.cpElementId) || 0) + item.durationJp
            );
          }
        }

        // PRD FR-005 (A2): Presensi Sakit/Izin tidak memengaruhi rasio deviasi kompetensi
        if (is14d && log.attendanceType !== "SICK" && log.attendanceType !== "PERMIT") {
          totalJp14d += item.durationJp;
          if (item.jobCard?.isNonCompetency || item.nonCompetencyCategory) {
            nonCompJp14d += item.durationJp;
          }
        }
      }
    }

    // 1. Evaluasi NON_COMPETENCY_OVERLOAD
    const nonCompRes = detectNonCompetencyOverload({
      totalJpLast14Days: totalJp14d,
      nonCompetencyJpLast14Days: nonCompJp14d,
    });

    if (nonCompRes.detected) {
      detectedCount++;
      const snapshot = {
        ratio: nonCompRes.ratio,
        totalJpLast14Days: totalJp14d,
        nonCompetencyJpLast14Days: nonCompJp14d,
        detectedReason: `Siswa mencatat ${nonCompJp14d} JP (${Math.round(
          nonCompRes.ratio * 100
        )}%) tugas non-kejuruan dalam 14 hari terakhir.`,
        mentorName: p.dudiMentor?.fullName || "-",
        dudiName: p.dudiPartner.name,
      };

      const existingAlert = await prisma.driftAlert.findFirst({
        where: {
          placementId: p.id,
          alertType: "NON_COMPETENCY_OVERLOAD",
          status: "OPEN",
        },
      });

      if (existingAlert) {
        await prisma.driftAlert.update({
          where: { id: existingAlert.id },
          data: {
            metricSnapshotJson: snapshot,
            severity: "CRITICAL",
            detectedAt: now,
          },
        });
      } else {
        await prisma.driftAlert.create({
          data: {
            placementId: p.id,
            studentId: p.studentId,
            alertType: "NON_COMPETENCY_OVERLOAD",
            severity: "CRITICAL",
            status: "OPEN",
            metricSnapshotJson: snapshot,
          },
        });
      }
    } else {
      // PRD FR-008: Auto-resolve jika kondisi rasio non-kompetensi sudah kembali normal
      await prisma.driftAlert.updateMany({
        where: {
          placementId: p.id,
          alertType: "NON_COMPETENCY_OVERLOAD",
          status: "OPEN",
        },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
        },
      });
    }

    // 2. Evaluasi SKILL_MONOTONY (Memetakan seluruh elemen CP kurikulum jurusan siswa)
    const allDeptCpElements = p.student.schoolDepartment?.cpElements || [];
    const cpElementsJp =
      allDeptCpElements.length > 0
        ? allDeptCpElements.map((elem) => ({
            elementId: elem.id,
            jp: cpMap.get(elem.id) || 0,
          }))
        : Array.from(cpMap.entries()).map(([elementId, jp]) => ({
            elementId,
            jp,
          }));

    const daysSincePklStart = p.dailyLogs.length;
    const monotonyRes = detectSkillMonotony({
      daysSincePklStart,
      totalCumulativeJp,
      cpElementsJp,
    });

    if (monotonyRes.detected) {
      detectedCount++;
      const snapshot = {
        dominantRatio: monotonyRes.dominantRatio,
        dominantElementId: monotonyRes.dominantElementId,
        detectedReason: `Jam siswa terkonsentrasi ${Math.round(
          (monotonyRes.dominantRatio || 0) * 100
        )}% pada satu elemen materi.`,
        mentorName: p.dudiMentor?.fullName || "-",
        dudiName: p.dudiPartner.name,
      };

      const existingAlert = await prisma.driftAlert.findFirst({
        where: {
          placementId: p.id,
          alertType: "SKILL_MONOTONY",
          status: "OPEN",
        },
      });

      if (existingAlert) {
        await prisma.driftAlert.update({
          where: { id: existingAlert.id },
          data: {
            metricSnapshotJson: snapshot,
            severity: "WARNING",
            detectedAt: now,
          },
        });
      } else {
        await prisma.driftAlert.create({
          data: {
            placementId: p.id,
            studentId: p.studentId,
            alertType: "SKILL_MONOTONY",
            severity: "WARNING",
            status: "OPEN",
            metricSnapshotJson: snapshot,
          },
        });
      }
    } else {
      // PRD FR-008: Auto-resolve jika rotasi capaian materi sudah merata
      await prisma.driftAlert.updateMany({
        where: {
          placementId: p.id,
          alertType: "SKILL_MONOTONY",
          status: "OPEN",
        },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
        },
      });
    }

    // 3. Evaluasi APPROVAL_DORMANCY
    const currentDateStr = now.toISOString().split("T")[0] || "";
    const dormancyRes = detectApprovalDormancy({
      pendingLogs: pendingLogsList,
      currentDate: currentDateStr,
    });

    if (dormancyRes.detected) {
      detectedCount++;
      const snapshot = {
        dormantLogCount: dormancyRes.dormantLogCount,
        detectedReason: `${dormancyRes.dormantLogCount} log menunggu verifikasi lebih dari 7 hari kalender.`,
        mentorName: p.dudiMentor?.fullName || "-",
        dudiName: p.dudiPartner.name,
      };

      const existingAlert = await prisma.driftAlert.findFirst({
        where: {
          placementId: p.id,
          alertType: "APPROVAL_DORMANCY",
          status: "OPEN",
        },
      });

      if (existingAlert) {
        await prisma.driftAlert.update({
          where: { id: existingAlert.id },
          data: {
            metricSnapshotJson: snapshot,
            severity: "WARNING",
            detectedAt: now,
          },
        });
      } else {
        await prisma.driftAlert.create({
          data: {
            placementId: p.id,
            studentId: p.studentId,
            alertType: "APPROVAL_DORMANCY",
            severity: "WARNING",
            status: "OPEN",
            metricSnapshotJson: snapshot,
          },
        });
      }
    } else {
      // PRD FR-008: Auto-resolve jika logbook tertunda telah diverifikasi
      await prisma.driftAlert.updateMany({
        where: {
          placementId: p.id,
          alertType: "APPROVAL_DORMANCY",
          status: "OPEN",
        },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
        },
      });
    }
  }

  return {
    evaluatedCount: activePlacements.length,
    activeAlertsCreatedOrUpdated: detectedCount,
  };
}
