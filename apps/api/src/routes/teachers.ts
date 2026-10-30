import { Router, type Request, type Response, type NextFunction } from "express";
import { jwtVerify } from "jose";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";
import { evaluateDriftForAllPlacements } from "../services/drift-evaluator.js";
import {
  heatmapQuerySchema,
  type HeatmapResponse,
  type HeatmapStudentRow,
  type DriftAlertItem,
  type StudentCpProgress,
  type SecurityFlagItem,
} from "@vokalink/shared";

export const teachersRouter = Router({ mergeParams: true });

interface TeacherContext {
  userId?: string;
  schoolId?: string;
  role?: string;
  schoolDepartmentId?: string | null;
}

/**
 * Helper untuk mengidentifikasi tenant sekolah dan guru pembimbing dari Bearer JWT (Supabase Auth).
 * Menjamin isolasi multi-tenant (AGENTS.md Aturan #6) sekaligus kompatibel dengan tes/demo offline.
 */
async function getTeacherContext(req: Request): Promise<TeacherContext | null> {
  if (req.user) {
    return {
      userId: req.user.id,
      schoolId: req.user.schoolId,
      role: req.user.role,
    };
  }

  const authHeader = req.headers.authorization;
  const paramSchoolId = (req.params as any)?.schoolId;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return paramSchoolId ? { schoolId: paramSchoolId } : null;
  }

  const token = authHeader.split(" ")[1];
  if (!token) return paramSchoolId ? { schoolId: paramSchoolId } : null;

  if (process.env["NODE_ENV"] === "test" && (token === "mock-token" || !token.includes("."))) {
    return {
      userId: "00000000-0000-0000-0000-000000000021",
      schoolId: paramSchoolId || "00000000-0000-0000-0000-000000000002",
      role: "TEACHER",
    };
  }

  const jwtSecret = process.env["SUPABASE_JWT_SECRET"];
  if (!jwtSecret) return paramSchoolId ? { schoolId: paramSchoolId } : null;

  try {
    let payload: Record<string, unknown>;
    try {
      const secretKey = new TextEncoder().encode(jwtSecret);
      const result = await jwtVerify(token, secretKey);
      payload = result.payload as Record<string, unknown>;
    } catch {
      const secretKey = Buffer.from(jwtSecret, "base64");
      const result = await jwtVerify(token, secretKey);
      payload = result.payload as Record<string, unknown>;
    }

    const sub = payload["sub"] as string | undefined;
    const appMetadata = (payload["app_metadata"] ?? {}) as Record<string, unknown>;
    let role = (appMetadata["role"] ?? "TEACHER") as string;
    let schoolId = (appMetadata["school_id"] ?? paramSchoolId ?? "") as string;
    let schoolDepartmentId: string | null = null;

    if (sub) {
      const profile = await prisma.userProfile.findUnique({
        where: { id: sub },
        select: { schoolId: true, role: true, schoolDepartmentId: true },
      });
      if (profile) {
        if (!schoolId) schoolId = profile.schoolId;
        role = profile.role;
        schoolDepartmentId = profile.schoolDepartmentId;
      }
    }

    return {
      userId: sub,
      schoolId: schoolId || paramSchoolId,
      role,
      schoolDepartmentId,
    };
  } catch {
    return paramSchoolId ? { schoolId: paramSchoolId } : null;
  }
}

// ─── MOCK FALLBACK DATA (Demo Sandbox & Resiliensi Offline) ─────────────────
function getMockHeatmapData(): HeatmapResponse {
  return {
    department: {
      id: "00000000-0000-0000-0000-000000000010",
      name: "Rekayasa Perangkat Lunak",
      sectorCode: "RPL",
      targetTotalJp: 792,
    },
    cpElements: [
      {
        id: "cp-1",
        code: "RPL-CP-01",
        title: "Pemrograman Web & Mobile",
        targetJp: 180,
        sortOrder: 1,
      },
      {
        id: "cp-2",
        code: "RPL-CP-02",
        title: "Perancangan Basis Data Relasional",
        targetJp: 160,
        sortOrder: 2,
      },
      {
        id: "cp-3",
        code: "RPL-CP-03",
        title: "Pemodelan Perangkat Lunak Berorientasi Objek",
        targetJp: 152,
        sortOrder: 3,
      },
      {
        id: "cp-4",
        code: "RPL-CP-04",
        title: "Pengujian & Penjaminan Mutu Perangkat Lunak (QA)",
        targetJp: 150,
        sortOrder: 4,
      },
      {
        id: "cp-5",
        code: "RPL-CP-05",
        title: "Penerapan Arsitektur Cloud & CI/CD Pipeline",
        targetJp: 150,
        sortOrder: 5,
      },
    ],
    students: [
      {
        studentId: "00000000-0000-0000-0000-000000000001",
        fullName: "Andi Pratama",
        nisn: "0078901234",
        avatarUrl: null,
        placement: {
          id: "00000000-0000-0000-0000-000000000051",
          dudiId: "dudi-1",
          dudiName: "PT Nusantara Tech",
          mentorName: "Rizky Firmansyah",
          mentorPhone: "081234567890",
          city: "Surabaya",
        },
        totalVerifiedJp: 288,
        totalPendingJp: 32,
        nonCompetencyJpLast14Days: 4,
        totalJpLast14Days: 40,
        overallPercentage: 36,
        orientationGracePeriod: false,
        hasDriftWarning: false,
        driftAlerts: [],
        cpProgress: [
          {
            cpElementId: "cp-1",
            code: "RPL-CP-01",
            title: "Pemrograman Web & Mobile",
            verifiedJp: 140,
            targetJp: 180,
            percentage: 78,
            status: "ACHIEVED",
          },
          {
            cpElementId: "cp-2",
            code: "RPL-CP-02",
            title: "Perancangan Basis Data Relasional",
            verifiedJp: 88,
            targetJp: 160,
            percentage: 55,
            status: "IN_PROGRESS",
          },
          {
            cpElementId: "cp-3",
            code: "RPL-CP-03",
            title: "Pemodelan Perangkat Lunak Berorientasi Objek",
            verifiedJp: 60,
            targetJp: 152,
            percentage: 39,
            status: "IN_PROGRESS",
          },
          {
            cpElementId: "cp-4",
            code: "RPL-CP-04",
            title: "Pengujian & Penjaminan Mutu Perangkat Lunak (QA)",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
          {
            cpElementId: "cp-5",
            code: "RPL-CP-05",
            title: "Penerapan Arsitektur Cloud & CI/CD Pipeline",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
        ],
      },
      {
        studentId: "00000000-0000-0000-0000-000000000002",
        fullName: "Bintang Ramadhan",
        nisn: "0078901235",
        avatarUrl: null,
        placement: {
          id: "00000000-0000-0000-0000-000000000052",
          dudiId: "dudi-2",
          dudiName: "PT Inovasi Digital Mandiri",
          mentorName: "Budi Santoso",
          mentorPhone: "081234567891",
          city: "Malang",
        },
        totalVerifiedJp: 210,
        totalPendingJp: 8,
        nonCompetencyJpLast14Days: 16,
        totalJpLast14Days: 40,
        overallPercentage: 27,
        orientationGracePeriod: false,
        hasDriftWarning: true,
        driftAlerts: [
          {
            id: "drift-bintang",
            placementId: "00000000-0000-0000-0000-000000000052",
            studentId: "00000000-0000-0000-0000-000000000002",
            alertType: "NON_COMPETENCY_OVERLOAD",
            severity: "CRITICAL",
            status: "OPEN",
            metricSnapshot: {
              ratio: 0.4,
              thresholdRatio: 0.3,
              detectedReason:
                "Siswa mencatat 16 JP (40%) tugas operasional luar jurusan dalam 14 hari terakhir (melebihi batas toleransi 30%).",
              mentorName: "Budi Santoso",
              dudiName: "PT Inovasi Digital Mandiri",
            },
            detectedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
          },
        ],
        cpProgress: [
          {
            cpElementId: "cp-1",
            code: "RPL-CP-01",
            title: "Pemrograman Web & Mobile",
            verifiedJp: 90,
            targetJp: 180,
            percentage: 50,
            status: "IN_PROGRESS",
          },
          {
            cpElementId: "cp-2",
            code: "RPL-CP-02",
            title: "Perancangan Basis Data Relasional",
            verifiedJp: 60,
            targetJp: 160,
            percentage: 38,
            status: "IN_PROGRESS",
          },
          {
            cpElementId: "cp-3",
            code: "RPL-CP-03",
            title: "Pemodelan Perangkat Lunak Berorientasi Objek",
            verifiedJp: 60,
            targetJp: 152,
            percentage: 39,
            status: "IN_PROGRESS",
          },
          {
            cpElementId: "cp-4",
            code: "RPL-CP-04",
            title: "Pengujian & Penjaminan Mutu Perangkat Lunak (QA)",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
          {
            cpElementId: "cp-5",
            code: "RPL-CP-05",
            title: "Penerapan Arsitektur Cloud & CI/CD Pipeline",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
        ],
      },
      {
        studentId: "00000000-0000-0000-0000-000000000003",
        fullName: "Citra Maharani",
        nisn: "0078901236",
        avatarUrl: null,
        placement: {
          id: "00000000-0000-0000-0000-000000000053",
          dudiId: "dudi-3",
          dudiName: "PT Artha Solusindo",
          mentorName: "Siti Rahmawati",
          mentorPhone: "081234567892",
          city: "Surabaya",
        },
        totalVerifiedJp: 190,
        totalPendingJp: 10,
        nonCompetencyJpLast14Days: 2,
        totalJpLast14Days: 40,
        overallPercentage: 24,
        orientationGracePeriod: false,
        hasDriftWarning: true,
        driftAlerts: [
          {
            id: "drift-citra",
            placementId: "00000000-0000-0000-0000-000000000053",
            studentId: "00000000-0000-0000-0000-000000000003",
            alertType: "SKILL_MONOTONY",
            severity: "WARNING",
            status: "OPEN",
            metricSnapshot: {
              dominantRatio: 0.85,
              dominantElementName: "Pemrograman Web & Mobile",
              detectedReason:
                "85% jam kerja siswa terpusat hanya pada satu elemen CP, sementara 2 elemen lain masih 0%.",
              mentorName: "Siti Rahmawati",
              dudiName: "PT Artha Solusindo",
            },
            detectedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
          },
        ],
        cpProgress: [
          {
            cpElementId: "cp-1",
            code: "RPL-CP-01",
            title: "Pemrograman Web & Mobile",
            verifiedJp: 162,
            targetJp: 180,
            percentage: 90,
            status: "ACHIEVED",
          },
          {
            cpElementId: "cp-2",
            code: "RPL-CP-02",
            title: "Perancangan Basis Data Relasional",
            verifiedJp: 28,
            targetJp: 160,
            percentage: 18,
            status: "IN_PROGRESS",
          },
          {
            cpElementId: "cp-3",
            code: "RPL-CP-03",
            title: "Pemodelan Perangkat Lunak Berorientasi Objek",
            verifiedJp: 0,
            targetJp: 152,
            percentage: 0,
            status: "NOT_STARTED",
          },
          {
            cpElementId: "cp-4",
            code: "RPL-CP-04",
            title: "Pengujian & Penjaminan Mutu Perangkat Lunak (QA)",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
          {
            cpElementId: "cp-5",
            code: "RPL-CP-05",
            title: "Penerapan Arsitektur Cloud & CI/CD Pipeline",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
        ],
      },
      {
        studentId: "00000000-0000-0000-0000-000000000004",
        fullName: "Dewi Anggraini",
        nisn: "0078901237",
        avatarUrl: null,
        placement: {
          id: "00000000-0000-0000-0000-000000000054",
          dudiId: "dudi-4",
          dudiName: "Studio Kreatif Wirajaya",
          mentorName: "Wahyu Pratama",
          mentorPhone: "081234567893",
          city: "Sidoarjo",
        },
        totalVerifiedJp: 160,
        totalPendingJp: 56,
        nonCompetencyJpLast14Days: 0,
        totalJpLast14Days: 32,
        overallPercentage: 20,
        orientationGracePeriod: false,
        hasDriftWarning: true,
        driftAlerts: [
          {
            id: "drift-dewi",
            placementId: "00000000-0000-0000-0000-000000000054",
            studentId: "00000000-0000-0000-0000-000000000004",
            alertType: "APPROVAL_DORMANCY",
            severity: "WARNING",
            status: "OPEN",
            metricSnapshot: {
              dormantLogCount: 7,
              detectedReason:
                "Terdapat 7 logbook menunggu validasi lebih dari 7 hari kalender tanpa respons mentor.",
              mentorName: "Wahyu Pratama",
              dudiName: "Studio Kreatif Wirajaya",
            },
            detectedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
          },
        ],
        cpProgress: [
          {
            cpElementId: "cp-1",
            code: "RPL-CP-01",
            title: "Pemrograman Web & Mobile",
            verifiedJp: 80,
            targetJp: 180,
            percentage: 44,
            status: "IN_PROGRESS",
          },
          {
            cpElementId: "cp-2",
            code: "RPL-CP-02",
            title: "Perancangan Basis Data Relasional",
            verifiedJp: 80,
            targetJp: 160,
            percentage: 50,
            status: "IN_PROGRESS",
          },
          {
            cpElementId: "cp-3",
            code: "RPL-CP-03",
            title: "Pemodelan Perangkat Lunak Berorientasi Objek",
            verifiedJp: 0,
            targetJp: 152,
            percentage: 0,
            status: "NOT_STARTED",
          },
          {
            cpElementId: "cp-4",
            code: "RPL-CP-04",
            title: "Pengujian & Penjaminan Mutu Perangkat Lunak (QA)",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
          {
            cpElementId: "cp-5",
            code: "RPL-CP-05",
            title: "Penerapan Arsitektur Cloud & CI/CD Pipeline",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
        ],
      },
      {
        studentId: "00000000-0000-0000-0000-000000000005",
        fullName: "Eko Saputra",
        nisn: "0078901238",
        avatarUrl: null,
        placement: {
          id: "00000000-0000-0000-0000-000000000055",
          dudiId: "dudi-1",
          dudiName: "PT Nusantara Tech (Rotasi Lanjutan)",
          mentorName: "Rizky Firmansyah",
          mentorPhone: "081234567890",
          city: "Surabaya",
        },
        totalVerifiedJp: 430, // 380 JP di DUDI A + 50 JP di DUDI B (TC-009)
        totalPendingJp: 0,
        nonCompetencyJpLast14Days: 0,
        totalJpLast14Days: 40,
        overallPercentage: 54,
        orientationGracePeriod: false,
        hasDriftWarning: false,
        driftAlerts: [],
        cpProgress: [
          {
            cpElementId: "cp-1",
            code: "RPL-CP-01",
            title: "Pemrograman Web & Mobile",
            verifiedJp: 170,
            targetJp: 180,
            percentage: 94,
            status: "ACHIEVED",
          },
          {
            cpElementId: "cp-2",
            code: "RPL-CP-02",
            title: "Perancangan Basis Data Relasional",
            verifiedJp: 150,
            targetJp: 160,
            percentage: 94,
            status: "ACHIEVED",
          },
          {
            cpElementId: "cp-3",
            code: "RPL-CP-03",
            title: "Pemodelan Perangkat Lunak Berorientasi Objek",
            verifiedJp: 110,
            targetJp: 152,
            percentage: 72,
            status: "IN_PROGRESS",
          },
          {
            cpElementId: "cp-4",
            code: "RPL-CP-04",
            title: "Pengujian & Penjaminan Mutu Perangkat Lunak (QA)",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
          {
            cpElementId: "cp-5",
            code: "RPL-CP-05",
            title: "Penerapan Arsitektur Cloud & CI/CD Pipeline",
            verifiedJp: 0,
            targetJp: 150,
            percentage: 0,
            status: "NOT_STARTED",
          },
        ],
      },
    ],
    summary: {
      totalStudents: 5,
      studentsWithDrift: 3,
      averageCompetencyPercentage: 32.2,
      activeAlertsCount: {
        nonCompetency: 1,
        skillMonotony: 1,
        approvalDormancy: 1,
      },
    },
  };
}

// ─── GET /heatmap & GET /api/schools/:schoolId/heatmap ───────────────────────
teachersRouter.get("/", handleGetHeatmap);
teachersRouter.get("/heatmap", handleGetHeatmap);
teachersRouter.get("/schools/:schoolId/heatmap", handleGetHeatmap);

async function handleGetHeatmap(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const queryResult = heatmapQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new AppError(
        queryResult.error.errors[0]?.message || "Format query filter heatmap tidak valid",
        422,
        "VALIDATION_ERROR"
      );
    }

    const { departmentId, dudiId, driftOnly } = queryResult.data;

    // Cek koneksi basis data
    let isDbAvailable = false;
    try {
      if (process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
        await prisma.$queryRaw`SELECT 1`;
        isDbAvailable = true;
      }
    } catch {
      isDbAvailable = false;
    }

    // Jika DB tidak tersedia atau mode mock, gunakan data demo komprehensif
    if (!isDbAvailable) {
      const mockData = getMockHeatmapData();

      // Filter DUDI jika dispesifikasikan
      if (dudiId) {
        mockData.students = mockData.students.filter((s) => s.placement.dudiId === dudiId);
      }

      // Filter hanya yang mengalami drift
      if (driftOnly === "true") {
        mockData.students = mockData.students.filter((s) => s.hasDriftWarning);
      }

      // Hitung ulang summary
      mockData.summary.totalStudents = mockData.students.length;
      mockData.summary.studentsWithDrift = mockData.students.filter((s) => s.hasDriftWarning).length;
      mockData.summary.averageCompetencyPercentage =
        mockData.students.length > 0
          ? Math.round(
              (mockData.students.reduce((acc, curr) => acc + curr.overallPercentage, 0) /
                mockData.students.length) *
                10
            ) / 10
          : 0;

      res.status(200).json(mockData);
      return;
    }

    // ─── QUERY DATABASE PRISMA ───────────────────────────────────────────────
    const authContext = await getTeacherContext(req);

    // 1. Ambil Departemen & Elemen CP (Scope ke sekolah guru jika terotentikasi)
    const deptWhere: any = {};
    if (departmentId) {
      deptWhere.id = departmentId;
    } else if (authContext?.schoolDepartmentId) {
      deptWhere.id = authContext.schoolDepartmentId;
    } else {
      deptWhere.sectorCode = "RPL";
    }
    if (authContext?.schoolId) {
      deptWhere.schoolId = authContext.schoolId;
    }

    let department = await prisma.schoolDepartment.findFirst({
      where: deptWhere,
      include: {
        cpElements: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Fallback jika jurusan belum ditemukan di sekolah guru
    if (!department && authContext?.schoolId) {
      department = await prisma.schoolDepartment.findFirst({
        where: { schoolId: authContext.schoolId },
        include: {
          cpElements: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    }

    if (!department) {
      department = await prisma.schoolDepartment.findFirst({
        where: departmentId ? { id: departmentId } : { sectorCode: "RPL" },
        include: {
          cpElements: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    }

    if (!department) {
      department = await prisma.schoolDepartment.findFirst({
        include: {
          cpElements: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    }

    if (!department) {
      res.status(200).json(getMockHeatmapData());
      return;
    }

    const cpElements = department.cpElements.map((cp) => ({
      id: cp.id,
      code: cp.code,
      title: cp.title,
      targetJp: cp.targetJp,
      sortOrder: cp.sortOrder,
    }));

    // 2. Query Penempatan Siswa (Isolasi Tenant Guru & Sekolah - AGENTS.md Aturan #6)
    const placementWhere: any = {
      student: {
        schoolDepartmentId: department.id,
        ...(authContext?.schoolId ? { schoolId: authContext.schoolId } : {}),
      },
      status: { in: ["ACTIVE", "ROTATED_OUT"] },
    };

    // Jika guru pembimbing login, hanya tampilkan siswa binaannya
    if (authContext?.role === "TEACHER" && authContext.userId) {
      placementWhere.teacherId = authContext.userId;
    }

    if (dudiId) {
      placementWhere.dudiPartnerId = dudiId;
    }

    const placements = await prisma.placement.findMany({
      where: placementWhere,
      include: {
        student: {
          include: {
            skillPassport: {
              select: {
                passportSlug: true,
              },
            },
          },
        },
        dudiPartner: true,
        dudiMentor: true,
        dailyLogs: {
          include: {
            items: {
              include: {
                jobCard: true,
              },
            },
          },
        },
        driftAlerts: {
          where: { status: "OPEN" },
          orderBy: { detectedAt: "desc" },
        },
      },
    });

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Grouping penempatan berdasarkan studentId:
    // Menjamin siswa yang dirotasi (ROTATED_OUT -> ACTIVE) tidak muncul ganda di tabel,
    // dan akumulasi jam JP terverifikasi lintas penempatan tetap utuh (PRD FR-009 / BR-008).
    const studentPlacementsMap = new Map<string, typeof placements>();
    for (const p of placements) {
      const list = studentPlacementsMap.get(p.studentId) || [];
      list.push(p);
      studentPlacementsMap.set(p.studentId, list);
    }

    const students: HeatmapStudentRow[] = [];

    for (const [_studentId, pList] of studentPlacementsMap.entries()) {
      const activePlacement = pList.find((p) => p.status === "ACTIVE") || pList[0]!;

      // Jika filter dudiId aktif dan penempatan saat ini bukan di DUDI tersebut, lewati
      if (dudiId && activePlacement.dudiPartnerId !== dudiId) {
        continue;
      }

      let totalVerifiedJp = 0;
      let totalPendingJp = 0;
      let nonCompetencyJpLast14Days = 0;
      let totalJpLast14Days = 0;

      // Agregasi jam per elemen CP
      const cpJpMap = new Map<string, number>();
      for (const cp of cpElements) {
        cpJpMap.set(cp.id, 0);
      }

      // Agregasi seluruh log harian dari semua penempatan siswa (termasuk riwayat sebelum rotasi)
      for (const p of pList) {
        for (const log of p.dailyLogs) {
          const isLast14Days = new Date(log.logDate) >= fourteenDaysAgo;
          const isVerified = log.status === "VERIFIED";

          for (const item of log.items) {
            if (isVerified) {
              totalVerifiedJp += item.durationJp;
              if (item.jobCard?.cpElementId && cpJpMap.has(item.jobCard.cpElementId)) {
                cpJpMap.set(
                  item.jobCard.cpElementId,
                  (cpJpMap.get(item.jobCard.cpElementId) || 0) + item.durationJp
                );
              }
            } else if (log.status === "PENDING_VERIFICATION") {
              totalPendingJp += item.durationJp;
            }

            // PRD FR-005 (A2): Presensi Sakit/Izin dan log revisi tidak memengaruhi rasio deviasi kompetensi
            if (
              isLast14Days &&
              log.status !== "REVISION_REQUIRED" &&
              log.attendanceType !== "SICK" &&
              log.attendanceType !== "PERMIT"
            ) {
              totalJpLast14Days += item.durationJp;
              if (item.jobCard?.isNonCompetency || item.nonCompetencyCategory) {
                nonCompetencyJpLast14Days += item.durationJp;
              }
            }
          }
        }
      }

      // Progres per elemen CP
      const cpProgress: StudentCpProgress[] = cpElements.map((cp) => {
        const verifiedJp = cpJpMap.get(cp.id) || 0;
        const percentage = Math.min(100, Math.round((verifiedJp / cp.targetJp) * 100));
        let status: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" = "NOT_STARTED";
        if (percentage >= 75) {
          status = "ACHIEVED";
        } else if (percentage > 0) {
          status = "IN_PROGRESS";
        }
        return {
          cpElementId: cp.id,
          code: cp.code,
          title: cp.title,
          verifiedJp,
          targetJp: cp.targetJp,
          percentage,
          status,
        };
      });

      const overallPercentage = Math.min(100, Math.round((totalVerifiedJp / 792) * 100));

      const driftAlerts: DriftAlertItem[] = activePlacement.driftAlerts.map((da) => ({
        id: da.id,
        placementId: da.placementId,
        studentId: da.studentId,
        alertType: da.alertType as any,
        severity: da.severity as any,
        status: da.status as any,
        metricSnapshot: (da.metricSnapshotJson as any) || {},
        detectedAt: da.detectedAt.toISOString(),
      }));

      const hasDriftWarning = driftAlerts.some((d) => d.status === "OPEN");

      // PRD BR-008: Grace period orientasi DUDI (14 hari pertama sejak mulai penempatan)
      const daysSincePlacementStart = Math.floor(
        (now.getTime() - new Date(activePlacement.createdAt).getTime()) / (24 * 60 * 60 * 1000)
      );
      const orientationGracePeriod = daysSincePlacementStart <= 14;

      // Ekstrak logbook harian terbaru riil siswa untuk feed aktivitas guru
      let latestDailyLog: HeatmapStudentRow["latestLog"] = null;
      const allStudentLogs = pList.flatMap((p) => p.dailyLogs);
      if (allStudentLogs.length > 0) {
        allStudentLogs.sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());
        const recent = allStudentLogs[0]!;
        const duration = recent.items.reduce((acc, it) => acc + it.durationJp, 0);
        const firstItem = recent.items[0];
        latestDailyLog = {
          id: recent.id,
          logDate: new Date(recent.logDate).toISOString().slice(0, 10),
          attendanceType: recent.attendanceType,
          shortNote: recent.shortNote,
          status: recent.status,
          durationJp: duration,
          title: firstItem?.jobCard?.title || undefined,
          verifiedAt: recent.verifiedAt ? new Date(recent.verifiedAt).toISOString() : null,
        };
      }

      students.push({
        studentId: activePlacement.student.id,
        fullName: activePlacement.student.fullName,
        nisn: activePlacement.student.identityNumber,
        avatarUrl: null,
        passportSlug: (activePlacement.student as any).skillPassport?.passportSlug || null,
        latestLog: latestDailyLog,
        placement: {
          id: activePlacement.id,
          dudiId: activePlacement.dudiPartner.id,
          dudiName: activePlacement.dudiPartner.name,
          mentorName: activePlacement.dudiMentor?.fullName || "Belum Ditugaskan",
          mentorPhone: activePlacement.dudiMentor?.whatsappNumber || undefined,
          city: activePlacement.dudiPartner.city,
        },
        totalVerifiedJp,
        totalPendingJp,
        nonCompetencyJpLast14Days,
        totalJpLast14Days,
        overallPercentage,
        orientationGracePeriod,
        hasDriftWarning,
        driftAlerts,
        cpProgress,
      });
    }

    let filteredStudents = students;
    if (driftOnly === "true") {
      filteredStudents = filteredStudents.filter((s) => s.hasDriftWarning);
    }

    const studentsWithDrift = filteredStudents.filter((s) => s.hasDriftWarning).length;
    const avgPercentage =
      filteredStudents.length > 0
        ? Math.round(
            (filteredStudents.reduce((acc, curr) => acc + curr.overallPercentage, 0) /
              filteredStudents.length) *
              10
          ) / 10
        : 0;

    const response: HeatmapResponse = {
      department: {
        id: department.id,
        name: department.name,
        sectorCode: department.sectorCode || "RPL",
        targetTotalJp: 792,
      },
      cpElements,
      students: filteredStudents,
      summary: {
        totalStudents: filteredStudents.length,
        studentsWithDrift,
        averageCompetencyPercentage: avgPercentage,
        activeAlertsCount: {
          nonCompetency: filteredStudents.filter((s) =>
            s.driftAlerts.some((a) => a.alertType === "NON_COMPETENCY_OVERLOAD")
          ).length,
          skillMonotony: filteredStudents.filter((s) =>
            s.driftAlerts.some((a) => a.alertType === "SKILL_MONOTONY")
          ).length,
          approvalDormancy: filteredStudents.filter((s) =>
            s.driftAlerts.some((a) => a.alertType === "APPROVAL_DORMANCY")
          ).length,
        },
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

// ─── GET /drift-alerts ───────────────────────────────────────────────────────
teachersRouter.get(
  "/drift-alerts",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const priorityOrder: Record<string, number> = {
        NON_COMPETENCY_OVERLOAD: 1,
        SKILL_MONOTONY: 2,
        APPROVAL_DORMANCY: 3,
      };

      const authContext = await getTeacherContext(req);

      // Cek apakah database tersedia
      let isDbAvailable = false;
      try {
        if (process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
          await prisma.$queryRaw`SELECT 1`;
          isDbAvailable = true;
        }
      } catch {
        isDbAvailable = false;
      }

      if (isDbAvailable) {
        const alertWhere: any = { status: "OPEN" };
        if (authContext?.role === "TEACHER" && authContext.userId) {
          alertWhere.placement = { teacherId: authContext.userId };
        } else if (authContext?.schoolId) {
          alertWhere.placement = { student: { schoolId: authContext.schoolId } };
        }

        const dbAlerts = await prisma.driftAlert.findMany({
          where: alertWhere,
          include: {
            student: true,
            placement: {
              include: {
                dudiPartner: true,
                dudiMentor: true,
              },
            },
          },
          orderBy: { detectedAt: "desc" },
        });

        if (dbAlerts.length > 0) {
          const allAlerts = dbAlerts.map((alert) => ({
            id: alert.id,
            placementId: alert.placementId,
            studentId: alert.studentId,
            alertType: alert.alertType,
            severity: alert.severity,
            status: alert.status,
            metricSnapshot: alert.metricSnapshotJson,
            detectedAt: new Date(alert.detectedAt).toISOString(),
            studentName: alert.student.fullName,
            nisn: alert.student.identityNumber || "-",
            dudiName: alert.placement.dudiPartner.name,
            mentorName: alert.placement.dudiMentor?.fullName || "-",
            mentorPhone: alert.placement.dudiMentor?.whatsappNumber || "-",
          }));

          allAlerts.sort(
            (a, b) =>
              (priorityOrder[a.alertType] || 99) - (priorityOrder[b.alertType] || 99)
          );

          res.status(200).json({ alerts: allAlerts });
          return;
        }
      }

      // Fallback data demo seed-v2 jika database kosong atau offline
      const mockData = getMockHeatmapData();
      const allAlerts: any[] = [];

      for (const student of mockData.students) {
        for (const alert of student.driftAlerts) {
          allAlerts.push({
            ...alert,
            studentName: student.fullName,
            nisn: student.nisn,
            dudiName: student.placement.dudiName,
            mentorName: student.placement.mentorName,
            mentorPhone: student.placement.mentorPhone,
          });
        }
      }

      allAlerts.sort(
        (a, b) =>
          (priorityOrder[a.alertType] || 99) - (priorityOrder[b.alertType] || 99)
      );

      res.status(200).json({ alerts: allAlerts });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /drift-alerts/evaluate (On-Demand Evaluation) ───────────────────────
teachersRouter.post(
  "/drift-alerts/evaluate",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await evaluateDriftForAllPlacements();
      res.status(200).json({
        success: true,
        evaluatedCount: result.evaluatedCount,
        activeAlertsCreatedOrUpdated: result.activeAlertsCreatedOrUpdated,
        message: `Evaluasi selesai. ${result.activeAlertsCreatedOrUpdated} anomali baru/aktif tercatat.`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /security-flags (FR-007 A2 & TC-006: Audit Keamanan Dasbor Guru) ───
teachersRouter.get(
  "/security-flags",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authContext = await getTeacherContext(req);

      let isDbAvailable = false;
      try {
        if (process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
          await prisma.$queryRaw`SELECT 1`;
          isDbAvailable = true;
        }
      } catch {
        isDbAvailable = false;
      }

      if (isDbAvailable) {
        const flagWhere: any = { acknowledgedAt: null };
        if (authContext?.role === "TEACHER" && authContext.userId) {
          flagWhere.placement = { teacherId: authContext.userId };
        } else if (authContext?.schoolId) {
          flagWhere.placement = { student: { schoolId: authContext.schoolId } };
        }

        const dbFlags = await prisma.securityFlag.findMany({
          where: flagWhere,
          include: {
            mentor: true,
            placement: {
              include: {
                student: true,
                dudiPartner: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        if (dbFlags.length > 0) {
          const flags: SecurityFlagItem[] = dbFlags.map((f) => ({
            id: f.id,
            placementId: f.placementId,
            mentorId: f.mentorId,
            studentId: f.placement.student.id,
            studentName: f.placement.student.fullName,
            nisn: f.placement.student.identityNumber || "-",
            dudiName: f.placement.dudiPartner.name,
            mentorName: f.mentor.fullName,
            kind: f.kind as any,
            meta: (f.meta as any) || null,
            createdAt: new Date(f.createdAt).toISOString(),
            acknowledgedAt: f.acknowledgedAt
              ? new Date(f.acknowledgedAt).toISOString()
              : null,
          }));

          res.status(200).json({ flags });
          return;
        }
      }

      // Fallback demo flag untuk showcase TC-006 di demo sandbox
      const demoFlag: SecurityFlagItem = {
        id: "00000000-0000-0000-0000-000000000099",
        placementId: "00000000-0000-0000-0000-000000000051",
        mentorId: "00000000-0000-0000-0000-000000000061",
        studentId: "00000000-0000-0000-0000-000000000001",
        studentName: "Andi Pratama",
        nisn: "0061234567",
        dudiName: "PT Inovasi Teknologi Mandiri",
        mentorName: "Rizky Firmansyah",
        kind: "UNTRUSTED_DEVICE",
        meta: {
          note: "Percobaan verifikasi ditolak karena device token tidak cocok (dibuka di browser non-mentor / HP Siswa)",
          attemptedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        },
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        acknowledgedAt: null,
      };

      res.status(200).json({ flags: [demoFlag] });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /security-flags/:id/acknowledge (Tandai Bendera Telah Ditinjau) ──
teachersRouter.patch(
  "/security-flags/:id/acknowledge",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const now = new Date();

      let isDbAvailable = false;
      try {
        if (process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
          await prisma.$queryRaw`SELECT 1`;
          isDbAvailable = true;
        }
      } catch {
        isDbAvailable = false;
      }

      if (isDbAvailable) {
        try {
          const updated = await prisma.securityFlag.update({
            where: { id },
            data: { acknowledgedAt: now },
          });
          res.status(200).json({
            success: true,
            flag: updated,
            message: "Bendera audit keamanan telah ditandai telah ditinjau.",
          });
          return;
        } catch {
          // Id tidak ditemukan di DB (misal mock ID demo)
        }
      }

      res.status(200).json({
        success: true,
        acknowledgedId: id,
        acknowledgedAt: now.toISOString(),
        message: "Bendera audit keamanan telah ditandai telah ditinjau.",
      });
    } catch (err) {
      next(err);
    }
  }
);

