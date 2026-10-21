/**
 * seed-v2.ts — VokaLink Seeder v2
 *
 * Mengisi data demo komprehensif untuk pengujian dan evaluasi juri (TC-005 s/d TC-010):
 * 1. Riwayat logbook 8 minggu (40 hari kerja) untuk 5 siswa RPL
 * 2. Bukti foto WebP realistis (< 150 KB, SHA-256) dan segel HMAC-SHA256 untuk log VERIFIED
 * 3. 4 log PENDING_VERIFICATION batch 4 hari untuk mentor Rizky (TC-005 demo batch approval)
 * 4. Pengikatan perangkat & PIN scrypt ("1234") untuk seluruh mentor demo
 * 5. Tiga skenario deteksi Competency Drift (BR-008):
 *    - Bintang: NON_COMPETENCY_OVERLOAD (40% non-kompetensi dalam 14 hari terakhir) (TC-008)
 *    - Citra: SKILL_MONOTONY (85% jam di 1 Elemen CP, 2 Elemen CP 0 JP)
 *    - Dewi: APPROVAL_DORMANCY (7 log pending > 7 hari belum divalidasi)
 * 6. Rotasi tengah semester Eko (380 JP di DUDI A + 50 JP di DUDI B = 430 JP) + InterventionLog (TC-009)
 * 7. Endorsement etos kerja mentor untuk Andi dan Eko
 * 8. Paspor Keterampilan publik ber-QR terverifikasi (andi-pratama-rpl-2026, eko-saputra-rpl-2026) (TC-010)
 *
 * Jalankan: pnpm --filter api seed:v2
 */

import {
  PrismaClient,
  LogStatus,
  AttendanceType,
  NonCompetencyCategory,
  DriftAlertType,
  DriftAlertSeverity,
  DriftAlertStatus,
  InterventionActionType,
  SignedLinkPurpose,
  SignedLinkMode,
  PlacementStatus,
} from "@prisma/client";
import { createHash } from "crypto";
import dotenv from "dotenv";
import {
  sealObjectWithHmac,
  hashPinWithScrypt,
  hashSha256Hex,
  generateSalt,
  createSignedToken,
} from "@vokalink/core/crypto";

dotenv.config();

const prisma = new PrismaClient();

const SERVER_CRYPTO_SECRET =
  process.env.SERVER_CRYPTO_SECRET ||
  "44cf2ed7fbbf25c00cd72449cda689a90ef8b63b61cfa52c7baca6976b1bd4e7";
const PIN_PEPPER =
  process.env.PIN_PEPPER ||
  "2368e2efd2c3f72399a155b368dfaa0377122fc6d41afd66c2215d717f8543f4";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deterministicUuid(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

// ─── Konstanta ID Demo Sesuai seed-v1 ─────────────────────────────────────────

const SCHOOL_ID = deterministicUuid("vokalink-demo-school-v1");
const PERIOD_ID = deterministicUuid("vokalink-demo-period-2026");
const TEACHER_ID = deterministicUuid("vokalink-demo-teacher-budi");

const STUDENT_IDS = [
  deterministicUuid("vokalink-demo-student-1-andi"),
  deterministicUuid("vokalink-demo-student-2-bintang"),
  deterministicUuid("vokalink-demo-student-3-citra"),
  deterministicUuid("vokalink-demo-student-4-dewi"),
  deterministicUuid("vokalink-demo-student-5-eko"),
];

const DUDI_IDS = [
  deterministicUuid("vokalink-demo-dudi-1-softwarehouse"),
  deterministicUuid("vokalink-demo-dudi-2-startup"),
  deterministicUuid("vokalink-demo-dudi-3-studio"),
  deterministicUuid("vokalink-demo-dudi-4-bengkel"),
  deterministicUuid("vokalink-demo-dudi-5-apotek"),
  deterministicUuid("vokalink-demo-dudi-6-resto"),
];

const MENTOR_IDS = [
  deterministicUuid("vokalink-demo-mentor-1"),
  deterministicUuid("vokalink-demo-mentor-2"),
  deterministicUuid("vokalink-demo-mentor-3"),
  deterministicUuid("vokalink-demo-mentor-4"),
  deterministicUuid("vokalink-demo-mentor-5"),
  deterministicUuid("vokalink-demo-mentor-6"),
];

// ─── 40 Hari Kerja (8 Minggu, Senin - Jumat) ──────────────────────────────────
// Dimulai 5 Januari 2026 sampai 27 Februari 2026
function generateWorkDates(): Date[] {
  const dates: Date[] = [];
  const curr = new Date("2026-01-05T08:00:00.000Z");
  while (dates.length < 40) {
    const day = curr.getUTCDay();
    if (day >= 1 && day <= 5) {
      dates.push(new Date(curr));
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

export async function seedV2(): Promise<void> {
  console.log("🌱 Menjalankan VokaLink Seeder v2 (Riwayat 8 Minggu, Drift, Endorsement & Paspor)...");

  // 1. Validasi Prasyarat: Pastikan Sekolah Demo dari seeder v1 sudah ada
  const school = await prisma.school.findUnique({ where: { id: SCHOOL_ID } });
  if (!school) {
    throw new Error(
      "Sekolah demo tidak ditemukan! Silakan jalankan 'pnpm --filter api seed:v1' terlebih dahulu sebelum seed:v2."
    );
  }

  // 2. Ambil Job Cards & Elemen CP untuk Jurusan RPL
  const rplDept = await prisma.schoolDepartment.findFirst({
    where: { schoolId: SCHOOL_ID, sectorCode: "RPL" },
    include: {
      cpElements: {
        include: {
          jobCards: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!rplDept || rplDept.cpElements.length === 0) {
    throw new Error("Kurikulum jurusan RPL tidak ditemukan di database.");
  }

  const cpElements = rplDept.cpElements;
  const nonCompJobCard = await prisma.jobCard.findFirst({
    where: {
      cpElement: { schoolDepartmentId: rplDept.id },
      isNonCompetency: true,
    },
  }) ?? cpElements[0]?.jobCards[0]; // fallback safe

  console.log(`   📚 Memuat ${cpElements.length} Elemen CP dan katalog Job Cards RPL`);

  // 3. Bind Perangkat & PIN untuk Semua Mentor Demo (Zero-Login PIN: 1234)
  console.log("   🔑 Mengonfigurasi kredensial mentor (PIN demo: 1234, token perangkat)...");
  const DEMO_PIN = "1234";
  const mentorDeviceTokens: Record<string, { token: string; hash: string }> = {};

  for (const mentorId of MENTOR_IDS) {
    const deviceToken = deterministicUuid(`mentor-device-${mentorId}`);
    const deviceTokenHash = hashSha256Hex(deviceToken);
    const pinSalt = deterministicUuid(`mentor-salt-${mentorId}`).replace(/-/g, "").slice(0, 32);
    const pinHash = hashPinWithScrypt(DEMO_PIN, pinSalt, PIN_PEPPER);

    mentorDeviceTokens[mentorId] = { token: deviceToken, hash: deviceTokenHash };

    await prisma.dudiMentor.update({
      where: { id: mentorId },
      data: {
        pinHash,
        pinSalt,
        deviceTokenHash,
        tokenBoundAt: new Date("2026-01-05T00:00:00Z"),
        failedPinAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  // 4. Konfigurasi Penempatan
  const placement1Id = deterministicUuid(`placement-${STUDENT_IDS[0]}-${DUDI_IDS[0]}`); // Andi -> PT Nusantara
  const placement2Id = deterministicUuid(`placement-${STUDENT_IDS[1]}-${DUDI_IDS[1]}`); // Bintang -> Startup Digital
  const placement3Id = deterministicUuid(`placement-${STUDENT_IDS[2]}-${DUDI_IDS[1]}`); // Citra -> Startup Digital
  const placement4Id = deterministicUuid(`placement-${STUDENT_IDS[3]}-${DUDI_IDS[2]}`); // Dewi -> Studio Wirajaya
  const placement5aId = deterministicUuid(`placement-${STUDENT_IDS[4]}-${DUDI_IDS[3]}`); // Eko -> Bengkel Auto Prima (Rotated Out)
  const placement5bId = deterministicUuid(`placement-eko-rotated-nusantara`); // Eko -> PT Nusantara Tech (Active)

  // Pastikan penempatan rotasi Eko (5b) tersedia
  await prisma.placement.upsert({
    where: { id: placement5bId },
    create: {
      id: placement5bId,
      academicPeriodId: PERIOD_ID,
      studentId: STUDENT_IDS[4],
      teacherId: TEACHER_ID,
      dudiPartnerId: DUDI_IDS[0], // PT Nusantara Tech
      dudiMentorId: MENTOR_IDS[0], // Rizky Firmansyah
      compatibilityScore: 86.5,
      coverageScore: 0,
      distanceKm: 2.8,
      status: PlacementStatus.ACTIVE,
    },
    update: {
      status: PlacementStatus.ACTIVE,
    },
  });

  // Update penempatan 5a Eko menjadi ROTATED_OUT
  await prisma.placement.update({
    where: { id: placement5aId },
    data: { status: PlacementStatus.ROTATED_OUT },
  });

  const workDates = generateWorkDates();
  console.log(`   🗓️ Menghasilkan ${workDates.length} hari kerja dalam rentang 8 minggu`);

  // Helper untuk membuat / meng-upsert logbook secara deterministik & idempoten
  async function upsertDailyLog(params: {
    clientUuidSeed: string;
    placementId: string;
    studentId: string;
    logDate: Date;
    status: LogStatus;
    items: { jobCardId: string; durationJp: number; autonomyLevel: number; nonCompetencyCategory?: NonCompetencyCategory }[];
    mentorId: string;
    shortNote: string;
    verifiedAtOffsetHours?: number;
  }) {
    const clientLogUuid = deterministicUuid(params.clientUuidSeed);
    const existing = await prisma.dailyLog.findUnique({
      where: { clientLogUuid },
      include: { items: true },
    });

    if (existing) {
      return existing;
    }

    const logDateStr = params.logDate.toISOString().split("T")[0];
    const evidenceSha256 = hashSha256Hex(`evidence-${params.studentId}-${logDateStr}`);
    const evidenceWebpUrl = `https://supabase.vokalink.id/storage/v1/object/public/evidence/demo/${params.studentId.slice(0, 8)}-${logDateStr}.webp`;
    const mentorDevice = mentorDeviceTokens[params.mentorId];

    let signatureHash: string | null = null;
    let verifiedAt: Date | null = null;

    if (params.status === LogStatus.VERIFIED) {
      verifiedAt = new Date(params.logDate.getTime() + (params.verifiedAtOffsetHours ?? 4) * 3600 * 1000);
      const sortedItems = [...params.items]
        .sort((a, b) => a.jobCardId.localeCompare(b.jobCardId))
        .map((it) => ({
          autonomyLevel: it.autonomyLevel,
          durationJp: it.durationJp,
          jobCardId: it.jobCardId,
        }));

      // Segel HMAC-SHA256 sesuai DESIGN.md §6.3
      signatureHash = sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
        deviceTokenHash: mentorDevice?.hash ?? "",
        evidenceSha256,
        items: sortedItems,
        logDate: logDateStr,
        logId: clientLogUuid,
        mentorId: params.mentorId,
        placementId: params.placementId,
        studentId: params.studentId,
        verifiedAt: verifiedAt.toISOString(),
      });
    }

    // Langkah 1: Buat log dengan status PENDING_VERIFICATION bersama items
    // (Trigger database melarang INSERT daily_log_items jika parent sudah berstatus VERIFIED)
    const created = await prisma.dailyLog.create({
      data: {
        id: clientLogUuid,
        clientLogUuid,
        placementId: params.placementId,
        studentId: params.studentId,
        logDate: params.logDate,
        attendanceType: AttendanceType.PRESENT,
        evidenceWebpUrl,
        evidenceSha256,
        evidenceSizeBytes: 52400,
        isEvidencePublic: true,
        shortNote: params.shortNote,
        status: LogStatus.PENDING_VERIFICATION,
        clientCreatedAt: params.logDate,
        serverReceivedAt: params.logDate,
        items: {
          create: params.items.map((it) => ({
            jobCardId: it.jobCardId,
            durationJp: it.durationJp,
            autonomyLevel: it.autonomyLevel,
            nonCompetencyCategory: it.nonCompetencyCategory ?? null,
          })),
        },
      },
      include: { items: true },
    });

    // Langkah 2: Jika target status adalah VERIFIED, lakukan transisi verifikasi resmi
    if (params.status === LogStatus.VERIFIED) {
      const updated = await prisma.dailyLog.update({
        where: { id: clientLogUuid },
        data: {
          status: LogStatus.VERIFIED,
          verifiedByMentorId: params.mentorId,
          verifiedAt,
          signatureHash,
        },
        include: { items: true },
      });
      return updated;
    }

    return created;
  }

  // ─── 5. Siswa 1: Andi Pratama (Bintang / 288 JP Terverifikasi + 4 Pending TC-005) ──
  console.log("   👨‍💻 Menghasilkan riwayat logbook 8 minggu: Andi Pratama (TC-005 batch approve)...");
  const andiVerifiedLogSignatures: string[] = [];
  const andiPendingLogIds: string[] = [];

  for (let i = 0; i < workDates.length; i++) {
    const d = workDates[i];
    const isPendingBatch = i >= 36; // 4 hari terakhir berstatus PENDING untuk demo TC-005
    const element = cpElements[i % cpElements.length];
    const card = element.jobCards[i % element.jobCards.length];

    const log = await upsertDailyLog({
      clientUuidSeed: `log-andi-${i}`,
      placementId: placement1Id,
      studentId: STUDENT_IDS[0],
      logDate: d,
      status: isPendingBatch ? LogStatus.PENDING_VERIFICATION : LogStatus.VERIFIED,
      mentorId: MENTOR_IDS[0],
      shortNote: `Pengerjaan ${card.title} - fitur modul sprint mingguan.`,
      items: [
        {
          jobCardId: card.id,
          durationJp: 8,
          autonomyLevel: 3, // Mandiri
        },
      ],
    });

    if (log.signatureHash) {
      andiVerifiedLogSignatures.push(log.signatureHash);
    }
    if (isPendingBatch) {
      andiPendingLogIds.push(log.id);
    }
  }

  // Demo SignedLink untuk TC-005 (Batch Approve 4 Hari < 10 Detik)
  const andiBatchToken = createSignedToken(
    {
      mentorId: MENTOR_IDS[0],
      purpose: "LOG_VERIFY",
      mode: "QR",
      logIds: andiPendingLogIds,
      exp: Math.floor(Date.now() / 1000) + 72 * 3600,
    },
    SERVER_CRYPTO_SECRET
  );

  const andiBatchTokenHash = hashSha256Hex(andiBatchToken);
  await prisma.signedLink.upsert({
    where: { tokenHash: andiBatchTokenHash },
    create: {
      purpose: SignedLinkPurpose.LOG_VERIFY,
      mode: SignedLinkMode.QR,
      tokenHash: andiBatchTokenHash,
      keyId: "k1",
      mentorId: MENTOR_IDS[0],
      placementId: placement1Id,
      logIds: andiPendingLogIds,
      payloadHash: hashSha256Hex(JSON.stringify(andiPendingLogIds)),
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
    },
    update: {},
  });

  // Endorsement Andi Pratama
  const andiEndorsementHash = sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
    attitudeScore: 95,
    badgesArray: ["EXCELLENT_COMMUNICATION", "HIGH_INITIATIVE", "TECHNICAL_MASTERY"],
    dudiMentorId: MENTOR_IDS[0],
    endorsementQuote:
      "Andi menunjukkan kedewasaan teknis luar biasa dalam perancangan API dan ketelitian database. Berinisiatif tinggi dan selalu menyelesaikan tugas tepat waktu.",
    placementId: placement1Id,
  });

  await prisma.endorsement.upsert({
    where: { placementId: placement1Id },
    create: {
      placementId: placement1Id,
      dudiMentorId: MENTOR_IDS[0],
      attitudeScore: 95,
      badgesArray: ["EXCELLENT_COMMUNICATION", "HIGH_INITIATIVE", "TECHNICAL_MASTERY"],
      endorsementQuote:
        "Andi menunjukkan kedewasaan teknis luar biasa dalam perancangan API dan ketelitian database. Berinisiatif tinggi dan selalu menyelesaikan tugas tepat waktu.",
      signatureHash: andiEndorsementHash,
    },
    update: {
      attitudeScore: 95,
    },
  });

  // Paspor Kompetensi Publik Andi Pratama (TC-010)
  const andiMasterSignatureHash = sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
    signatureHashes: andiVerifiedLogSignatures,
    studentId: STUDENT_IDS[0],
    totalVerifiedJp: 288,
  });

  await prisma.skillPassport.upsert({
    where: { studentId: STUDENT_IDS[0] },
    create: {
      studentId: STUDENT_IDS[0],
      passportSlug: "andi-pratama-rpl-2026",
      summaryBio:
        "Siswa SMK Jurusan Rekayasa Perangkat Lunak berprestasi dengan 288 JP terverifikasi resmi di PT Nusantara Tech. Memiliki spesialisasi dalam arsitektur backend TypeScript, PostgreSQL, dan REST API.",
      extraActivitiesJson: [
        {
          title: "Mini-Project Microservices Audit Log",
          year: "2026",
          description: "Membangun sistem logging audit internal berbasis Express dan PostgreSQL di PT Nusantara Tech.",
        },
      ],
      visibilityJson: {
        showPhotos: true,
        showGrades: true,
        showContact: true,
      },
      totalVerifiedJp: 288,
      masterSignatureHash: andiMasterSignatureHash,
    },
    update: {
      totalVerifiedJp: 288,
      masterSignatureHash: andiMasterSignatureHash,
    },
  });

  // ─── 6. Siswa 2: Bintang Ramadhan (Drift NON_COMPETENCY_OVERLOAD 40% - TC-008) ──
  console.log("   🚨 Menghasilkan kasus drift: Bintang Ramadhan (NON_COMPETENCY_OVERLOAD 40% - TC-008)...");
  for (let i = 0; i < workDates.length; i++) {
    const d = workDates[i];
    const isLast14Days = i >= 30; // 10 hari kerja terakhir

    if (isLast14Days) {
      // 10 hari × 8 JP = 80 JP total dalam 14 hari terakhir
      // 4 hari non-kompetensi 8 JP = 32 JP (tepat 40% > 30% batas BR-008)
      // 6 hari kompetensi 8 JP = 48 JP
      const isNonCompDay = i % 5 === 0 || i % 5 === 2; // 4 hari dari 10 hari

      if (isNonCompDay && nonCompJobCard) {
        await upsertDailyLog({
          clientUuidSeed: `log-bintang-${i}`,
          placementId: placement2Id,
          studentId: STUDENT_IDS[1],
          logDate: d,
          status: i >= 38 ? LogStatus.PENDING_VERIFICATION : LogStatus.VERIFIED,
          mentorId: MENTOR_IDS[1],
          shortNote: "Membantu inventaris gudang dan fotokopi berkas operasional.",
          items: [
            {
              jobCardId: nonCompJobCard.id,
              durationJp: 8,
              autonomyLevel: 2,
              nonCompetencyCategory: NonCompetencyCategory.ADMIN_UMUM,
            },
          ],
        });
      } else {
        const card = cpElements[0].jobCards[0];
        await upsertDailyLog({
          clientUuidSeed: `log-bintang-${i}`,
          placementId: placement2Id,
          studentId: STUDENT_IDS[1],
          logDate: d,
          status: i >= 38 ? LogStatus.PENDING_VERIFICATION : LogStatus.VERIFIED,
          mentorId: MENTOR_IDS[1],
          shortNote: `Pengerjaan ${card.title}.`,
          items: [
            {
              jobCardId: card.id,
              durationJp: 8,
              autonomyLevel: 2,
            },
          ],
        });
      }
    } else {
      // 30 hari pertama: normal kompetensi
      const card = cpElements[i % 2].jobCards[i % 2];
      await upsertDailyLog({
        clientUuidSeed: `log-bintang-${i}`,
        placementId: placement2Id,
        studentId: STUDENT_IDS[1],
        logDate: d,
        status: LogStatus.VERIFIED,
        mentorId: MENTOR_IDS[1],
        shortNote: `Pengerjaan ${card.title}.`,
        items: [
          {
            jobCardId: card.id,
            durationJp: 7,
            autonomyLevel: 2,
          },
        ],
      });
    }
  }

  // Drift Alert aktif untuk Bintang Ramadhan
  const bintangAlertId = deterministicUuid(`drift-alert-bintang-${placement2Id}`);
  await prisma.driftAlert.upsert({
    where: { id: bintangAlertId },
    create: {
      id: bintangAlertId,
      placementId: placement2Id,
      studentId: STUDENT_IDS[1],
      alertType: DriftAlertType.NON_COMPETENCY_OVERLOAD,
      severity: DriftAlertSeverity.CRITICAL,
      status: DriftAlertStatus.OPEN,
      metricSnapshotJson: {
        totalJpLast14Days: 80,
        nonCompetencyJpLast14Days: 32,
        ratio: 0.4,
        threshold: 0.3,
        detectedReason: "Rasio jam non-kompetensi mencapai 40% dalam 14 hari terakhir (minimal batas 30%).",
      },
      detectedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
    update: {
      status: DriftAlertStatus.OPEN,
    },
  });

  // ─── 7. Siswa 3: Citra Maharani (Drift SKILL_MONOTONY 85% di 1 Elemen CP) ──────
  console.log("   🚨 Menghasilkan kasus drift: Citra Maharani (SKILL_MONOTONY 85%)...");
  for (let i = 0; i < workDates.length; i++) {
    const d = workDates[i];
    // 34 hari di Elemen 0 (Frontend UI) = 204 JP (85%)
    // 6 hari di Elemen 2 (Git Testing) = 36 JP (15%)
    // Elemen 1 (Backend) = 0 JP, Elemen 3 (Cloud) = 0 JP
    const useFirstElement = i < 34;
    const element = useFirstElement ? cpElements[0] : cpElements[2];
    const card = element.jobCards[0];

    await upsertDailyLog({
      clientUuidSeed: `log-citra-${i}`,
      placementId: placement3Id,
      studentId: STUDENT_IDS[2],
      logDate: d,
      status: LogStatus.VERIFIED,
      mentorId: MENTOR_IDS[1],
      shortNote: `Pengerjaan ${card.title}.`,
      items: [
        {
          jobCardId: card.id,
          durationJp: 6,
          autonomyLevel: 2,
        },
      ],
    });
  }

  // Drift Alert aktif untuk Citra Maharani
  const citraAlertId = deterministicUuid(`drift-alert-citra-${placement3Id}`);
  await prisma.driftAlert.upsert({
    where: { id: citraAlertId },
    create: {
      id: citraAlertId,
      placementId: placement3Id,
      studentId: STUDENT_IDS[2],
      alertType: DriftAlertType.SKILL_MONOTONY,
      severity: DriftAlertSeverity.WARNING,
      status: DriftAlertStatus.OPEN,
      metricSnapshotJson: {
        totalCumulativeJp: 240,
        dominantRatio: 0.85,
        dominantElementTitle: cpElements[0].title,
        zeroCount: 2,
        uncoveredElements: [cpElements[1].title, cpElements[3]?.title ?? "Cloud/DevOps"],
        detectedReason: "85% jam praktik terkonsentrasi di 1 elemen, sementara 2 elemen lain masih 0 JP.",
      },
      detectedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    },
    update: {
      status: DriftAlertStatus.OPEN,
    },
  });

  // ─── 8. Siswa 4: Dewi Anggraini (Drift APPROVAL_DORMANCY > 7 Hari Belum Divalidasi)
  console.log("   ⏳ Menghasilkan kasus drift: Dewi Anggraini (APPROVAL_DORMANCY > 7 hari)...");
  for (let i = 0; i < workDates.length; i++) {
    const d = workDates[i];
    const isDormant = i >= 33; // 7 log terakhir dibiarkan pending
    const card = cpElements[i % 2].jobCards[i % 2];

    await upsertDailyLog({
      clientUuidSeed: `log-dewi-${i}`,
      placementId: placement4Id,
      studentId: STUDENT_IDS[3],
      logDate: d,
      status: isDormant ? LogStatus.PENDING_VERIFICATION : LogStatus.VERIFIED,
      mentorId: MENTOR_IDS[2],
      shortNote: `Pengerjaan ${card.title}.`,
      items: [
        {
          jobCardId: card.id,
          durationJp: 7,
          autonomyLevel: 2,
        },
      ],
    });
  }

  // Drift Alert aktif untuk Dewi Anggraini
  const dewiAlertId = deterministicUuid(`drift-alert-dewi-${placement4Id}`);
  await prisma.driftAlert.upsert({
    where: { id: dewiAlertId },
    create: {
      id: dewiAlertId,
      placementId: placement4Id,
      studentId: STUDENT_IDS[3],
      alertType: DriftAlertType.APPROVAL_DORMANCY,
      severity: DriftAlertSeverity.WARNING,
      status: DriftAlertStatus.OPEN,
      metricSnapshotJson: {
        dormantLogCount: 7,
        thresholdDays: 7,
        mentorName: "Wahyu Pratama",
        dudiName: "Studio Kreatif Wirajaya",
        detectedReason: "Terdapat 7 logbook menunggu validasi lebih dari 7 hari kalender tanpa respons mentor.",
      },
      detectedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    },
    update: {
      status: DriftAlertStatus.OPEN,
    },
  });

  // ─── 9. Siswa 5: Eko Saputra (Rotasi Mitra: 380 JP + 50 JP = 430 JP - TC-009) ──
  console.log("   🔄 Menghasilkan skenario rotasi mitra: Eko Saputra (380 JP + 50 JP = 430 JP - TC-009)...");
  const ekoVerifiedLogSignatures: string[] = [];

  // Bagian 1: 38 hari × 10 JP = 380 JP di Bengkel Auto Prima (status ROTATED_OUT)
  for (let i = 0; i < 38; i++) {
    const d = workDates[i];
    const card = cpElements[i % cpElements.length].jobCards[0];
    const log = await upsertDailyLog({
      clientUuidSeed: `log-eko-dudi1-${i}`,
      placementId: placement5aId,
      studentId: STUDENT_IDS[4],
      logDate: d,
      status: LogStatus.VERIFIED,
      mentorId: MENTOR_IDS[3],
      shortNote: `Pengerjaan ${card.title} di Bengkel Auto Prima.`,
      items: [
        {
          jobCardId: card.id,
          durationJp: 10,
          autonomyLevel: 3,
        },
      ],
    });
    if (log.signatureHash) {
      ekoVerifiedLogSignatures.push(log.signatureHash);
    }
  }

  // Bagian 2: 5 hari × 10 JP = 50 JP di PT Nusantara Tech (status ACTIVE)
  // Menghasilkan total 380 + 50 = 430 JP tepat sesuai TC-009
  for (let i = 35; i < 40; i++) {
    // Tanggal lanjutan rotasi
    const rotDate = new Date(workDates[i].getTime() + 7 * 24 * 3600 * 1000);
    const card = cpElements[(i + 1) % cpElements.length].jobCards[0];
    const log = await upsertDailyLog({
      clientUuidSeed: `log-eko-dudi2-${i}`,
      placementId: placement5bId,
      studentId: STUDENT_IDS[4],
      logDate: rotDate,
      status: LogStatus.VERIFIED,
      mentorId: MENTOR_IDS[0],
      shortNote: `Pengerjaan adaptasi ${card.title} di PT Nusantara Tech.`,
      items: [
        {
          jobCardId: card.id,
          durationJp: 10,
          autonomyLevel: 3,
        },
      ],
    });
    if (log.signatureHash) {
      ekoVerifiedLogSignatures.push(log.signatureHash);
    }
  }

  // Riwayat Drift Alert yang pernah terselesaikan (RESOLVED) dengan InterventionLog
  const ekoAlertId = deterministicUuid(`drift-alert-eko-${placement5aId}`);
  const resolvedAlert = await prisma.driftAlert.upsert({
    where: { id: ekoAlertId },
    create: {
      id: ekoAlertId,
      placementId: placement5aId,
      studentId: STUDENT_IDS[4],
      alertType: DriftAlertType.NON_COMPETENCY_OVERLOAD,
      severity: DriftAlertSeverity.WARNING,
      status: DriftAlertStatus.RESOLVED,
      metricSnapshotJson: {
        totalJpLast14Days: 70,
        nonCompetencyJpLast14Days: 25,
        ratio: 0.35,
        resolvedNote: "Siswa telah berhasil dipindahkan rotasi ke PT Nusantara Tech.",
      },
      detectedAt: new Date("2026-02-01T00:00:00Z"),
      resolvedAt: new Date("2026-02-05T00:00:00Z"),
    },
    update: {
      status: DriftAlertStatus.RESOLVED,
    },
  });

  const interventionLogId = deterministicUuid(`intervention-eko-${ekoAlertId}`);
  await prisma.interventionLog.upsert({
    where: { id: interventionLogId },
    create: {
      id: interventionLogId,
      driftAlertId: resolvedAlert.id,
      teacherId: TEACHER_ID,
      actionType: InterventionActionType.DUDI_ROTATION,
      messageSent:
        "Koordinasi rotasi siswa: Ananda Eko dipindahkan dari Bengkel Auto Prima ke PT Nusantara Tech untuk memenuhi cakupan capaian pembelajaran perangkat lunak.",
      createdAt: new Date("2026-02-04T10:00:00Z"),
    },
    update: {},
  });

  // Endorsement Eko Saputra (dari PT Nusantara Tech)
  const ekoEndorsementHash = sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
    attitudeScore: 89,
    badgesArray: ["ADAPTABILITY", "HIGH_INITIATIVE"],
    dudiMentorId: MENTOR_IDS[0],
    endorsementQuote:
      "Eko menunjukkan daya adaptasi yang sangat tinggi pasca rotasi penempatan. Tanggap terhadap instruksi dan mampu berkolaborasi positif.",
    placementId: placement5bId,
  });

  await prisma.endorsement.upsert({
    where: { placementId: placement5bId },
    create: {
      placementId: placement5bId,
      dudiMentorId: MENTOR_IDS[0],
      attitudeScore: 89,
      badgesArray: ["ADAPTABILITY", "HIGH_INITIATIVE"],
      endorsementQuote:
        "Eko menunjukkan daya adaptasi yang sangat tinggi pasca rotasi penempatan. Tanggap terhadap instruksi dan mampu berkolaborasi positif.",
      signatureHash: ekoEndorsementHash,
    },
    update: {
      attitudeScore: 89,
    },
  });

  // Paspor Kompetensi Eko Saputra (TC-009 / TC-010)
  const ekoMasterSignatureHash = sealObjectWithHmac(SERVER_CRYPTO_SECRET, {
    signatureHashes: ekoVerifiedLogSignatures,
    studentId: STUDENT_IDS[4],
    totalVerifiedJp: 430,
  });

  await prisma.skillPassport.upsert({
    where: { studentId: STUDENT_IDS[4] },
    create: {
      studentId: STUDENT_IDS[4],
      passportSlug: "eko-saputra-rpl-2026",
      summaryBio:
        "Siswa SMK dengan pengalaman magang lintas dua mitra industri dengan total 430 JP terverifikasi resmi (380 JP di Bengkel Auto Prima + 50 JP di PT Nusantara Tech).",
      extraActivitiesJson: [
        {
          title: "Program Rotasi Akselerasi Kompetensi Industri",
          year: "2026",
          description: "Menyelesaikan fase rotasi penugasan kejuruan dengan rekomendasi mentor positif.",
        },
      ],
      visibilityJson: {
        showPhotos: true,
        showGrades: true,
        showContact: true,
      },
      totalVerifiedJp: 430,
      masterSignatureHash: ekoMasterSignatureHash,
    },
    update: {
      totalVerifiedJp: 430,
      masterSignatureHash: ekoMasterSignatureHash,
    },
  });

  // ─── Ringkasan Hasil Eksekusi ───────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("✅ Seeder v2 Selesai dengan Sukses!\n");
  console.log("Data demo komprehensif yang telah dimuat:");
  console.log("  1. Andi Pratama (NISN: 0078901234):");
  console.log("     - 288 JP Terverifikasi (Segel HMAC) + 4 Hari Pending (TC-005)");
  console.log("     - Token Batch Approve Mentor Rizky: " + andiBatchToken);
  console.log("     - URL Batch Approve: http://localhost:3000/v/" + andiBatchToken);
  console.log("     - Endorsement Skor Sikap: 95/100, Paspor: /verify/andi-pratama-rpl-2026");
  console.log("  2. Bintang Ramadhan (NISN: 0078901235):");
  console.log("     - 🚨 Drift Alert Aktif: NON_COMPETENCY_OVERLOAD (40% non-kompetensi) (TC-008)");
  console.log("  3. Citra Maharani (NISN: 0078901236):");
  console.log("     - 🚨 Drift Alert Aktif: SKILL_MONOTONY (85% jam menumpuk di 1 elemen CP)");
  console.log("  4. Dewi Anggraini (NISN: 0078901237):");
  console.log("     - 🚨 Drift Alert Aktif: APPROVAL_DORMANCY (7 log pending > 7 hari)");
  console.log("  5. Eko Saputra (NISN: 0078901238):");
  console.log("     - 🔄 Rotasi Mitra Sukses: 380 JP (DUDI A) + 50 JP (DUDI B) = 430 JP (TC-009)");
  console.log("     - 1 Drift Alert RESOLVED dengan InterventionLog Guru Budi Santoso");
  console.log("     - Paspor: /verify/eko-saputra-rpl-2026 (430 JP terverifikasi)");
  console.log("  6. Seluruh 6 Mentor DUDI telah diikat dengan PIN demo: 1234");
  console.log("─".repeat(60));
}

// Eksekusi jika dipanggil langsung via CLI
if (process.argv[1]?.includes("seed-v2")) {
  seedV2()
    .catch((err) => {
      console.error("❌ Seeder v2 gagal:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
