import { z } from "zod";
import {
  MAX_DAILY_JP,
  MIN_DAILY_JP,
  MAX_EVIDENCE_SIZE_BYTES,
  PIN_LENGTH,
  MAX_ENDORSEMENT_BADGES,
} from "../constants/index.js";

export const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const dailyLogItemCreateSchema = z.object({
  jobCardId: z.string().uuid(),
  durationJp: z.number().int().min(1).max(10),
  autonomyLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  nonCompetencyCategory: z
    .enum(["ADMIN_UMUM", "KEBERSIHAN_GUDANG", "KURIR", "JAGA_TOKO"])
    .optional(),
});

export const dailyLogCreateSchema = z.object({
  clientLogUuid: z.string().uuid(),
  placementId: z.string().uuid(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  attendanceType: z.enum(["PRESENT", "SICK", "PERMIT"]),
  shortNote: z.string().max(250).optional(),
  evidenceSha256: z.string().length(64).optional(),
  evidenceSizeBytes: z.number().max(MAX_EVIDENCE_SIZE_BYTES).optional(),
  isEvidencePublic: z.boolean().default(true),
  clientCreatedAt: z.string().datetime().optional(),
  items: z.array(dailyLogItemCreateSchema).min(1).refine(
    (items) => {
      const totalJp = items.reduce((acc, curr) => acc + curr.durationJp, 0);
      return totalJp >= MIN_DAILY_JP && totalJp <= MAX_DAILY_JP;
    },
    {
      message: `Total durasi JP harian harus antara ${MIN_DAILY_JP} sampai ${MAX_DAILY_JP} JP`,
    }
  ),
});

export type DailyLogCreateInput = z.infer<typeof dailyLogCreateSchema>;

/**
 * FR-006 & DESIGN.md §7.3: Batch Sync Schema (Maks 20 logs)
 */
export const syncLogsBatchSchema = z.object({
  logs: z
    .array(dailyLogCreateSchema)
    .min(1, "Minimal 1 log untuk disinkronkan")
    .max(20, "Batch maksimal 20 log per permintaan (DESIGN.md §7.3)"),
});

export type SyncLogsBatchInput = z.infer<typeof syncLogsBatchSchema>;

export const syncItemResultSchema = z.object({
  clientLogUuid: z.string().uuid(),
  status: z.enum(["accepted", "duplicate", "rejected"]),
  serverLogId: z.string().uuid().optional(),
  errorCode: z.string().optional(),
  message: z.string().optional(),
});

export type SyncItemResult = z.infer<typeof syncItemResultSchema>;

export const syncBatchResponseSchema = z.object({
  processedCount: z.number(),
  acceptedCount: z.number(),
  duplicateCount: z.number(),
  rejectedCount: z.number(),
  results: z.array(syncItemResultSchema),
});

export type SyncBatchResponse = z.infer<typeof syncBatchResponseSchema>;

export const mentorDeviceCheckSchema = z.object({
  deviceToken: z.string().min(16).nullable().optional(),
});

export const mentorActivateDeviceSchema = z.object({
  pin: z.string().length(PIN_LENGTH).regex(/^\d{4}$/, "PIN harus 4 digit angka"),
});

export const mentorVerifyExecuteSchema = z.object({
  nonce: z.string().min(8),
  deviceToken: z.string().min(16),
  pin: z.string().length(PIN_LENGTH).regex(/^\d{4}$/, "PIN harus 4 digit angka"),
  decision: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().max(300).optional(),
  correctedItems: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        durationJp: z.number().int().min(1).max(10),
        autonomyLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      })
    )
    .optional(),
});

export const endorsementSubmitSchema = z.object({
  attitudeScore: z.number().int().min(1).max(100),
  selectedBadges: z
    .array(z.string().min(1).max(80))
    .min(1)
    .max(MAX_ENDORSEMENT_BADGES),
  endorsementQuote: z.string().max(300).optional(),
  deviceToken: z.string().min(16),
  pin: z.string().length(PIN_LENGTH).regex(/^\d{4}$/, "PIN harus 4 digit angka"),
});

export const schoolRegisterSchema = z.object({
  npsn: z.string().length(8).regex(/^\d{8}$/, "NPSN wajib terdiri dari 8 digit angka."),
  name: z.string().min(3, "Nama sekolah minimal 3 karakter").max(150),
  province: z.string().min(2, "Provinsi wajib diisi").max(80),
  city: z.string().min(2, "Kabupaten/Kota wajib diisi").max(80),
  latitude: z.number().min(-11).max(6).optional(),
  longitude: z.number().min(95).max(141).optional(),
  adminEmail: z.string().email("Format email admin tidak valid"),
  adminPassword: z.string().min(8, "Kata sandi minimal 8 karakter"),
  adminFullName: z.string().min(3, "Nama admin minimal 3 karakter").max(120),
  selectedDepartmentSectorCodes: z
    .array(z.string())
    .min(1, "Pilih minimal 1 konsentrasi keahlian yang aktif di sekolah"),
  academicPeriodName: z.string().min(3).default("PKL Semester Genap 2025/2026"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD").optional(),
  targetTotalJp: z
    .number()
    .int()
    .min(300, "Target total JP minimal 300 JP")
    .max(1200, "Target total JP maksimal 1200 JP")
    .default(792),
  isDemoSandbox: z.boolean().default(false),
});

export type SchoolRegisterInput = z.infer<typeof schoolRegisterSchema>;

// ─────────────────────────────────────────────────────────
// FR-002: Curriculum & Job Card schemas
// ─────────────────────────────────────────────────────────

/** Satu baris elemen CP beserta target JP yang ingin di-update */
export const cpElementUpdateSchema = z.object({
  id: z.string().uuid(),
  targetJp: z
    .number()
    .int()
    .min(1, "Target JP per elemen minimal 1 JP")
    .max(792, "Target JP per elemen tidak boleh melebihi 792 JP"),
});

/**
 * Body PUT /departments/:deptId/curriculum
 * Memperbarui bobot target JP seluruh elemen CP sekaligus.
 * Server memvalidasi: sum(targetJp) === period.targetTotalJp
 */
export const updateCpElementsSchema = z.object({
  elements: z
    .array(cpElementUpdateSchema)
    .min(1, "Minimal 1 elemen CP harus disertakan"),
});

export type UpdateCpElementsInput = z.infer<typeof updateCpElementsSchema>;

/** Body POST /departments/:deptId/job-cards — tambah Job Card baru */
export const addJobCardSchema = z.object({
  cpElementId: z
    .string()
    .uuid("cpElementId harus UUID valid")
    .nullable()
    .optional(),
  title: z
    .string()
    .min(3, "Judul Job Card minimal 3 karakter")
    .max(60, "Gunakan bahasa praktis maksimal 60 karakter agar mudah dibaca di layar HP"),
  skkniUnitCode: z
    .string()
    .max(40)
    .nullable()
    .optional(),
  toolsAndSoftware: z
    .array(z.string().max(60))
    .max(10)
    .default([]),
  actionVerbTemplate: z
    .string()
    .max(250)
    .default(""),
  isNonCompetency: z.boolean().default(false),
});

export type AddJobCardInput = z.infer<typeof addJobCardSchema>;

/** Body PATCH /job-cards/:id — update sebagian Job Card */
export const updateJobCardSchema = addJobCardSchema.partial().omit({
  isNonCompetency: true,
});

export type UpdateJobCardInput = z.infer<typeof updateJobCardSchema>;

// ─────────────────────────────────────────────────────────
// FR-003: Assisted DUDI Onboarding & Device Binding schemas
// ─────────────────────────────────────────────────────────

/**
 * Pendaftaran Mitra DUDI baru & Pemetaan Kapasitas Job Cards
 */
export const createDudiPartnerSchema = z.object({
  name: z.string().min(3, "Nama DUDI minimal 3 karakter").max(150),
  sectorCategory: z.string().min(2, "Kategori sektor wajib diisi").max(80),
  address: z.string().min(5, "Alamat DUDI minimal 5 karakter").max(500),
  city: z.string().min(2, "Kota/Kabupaten wajib diisi").max(80),
  latitude: z
    .number()
    .min(-11, "Latitude wilayah Indonesia harus antara -11 dan 6")
    .max(6, "Latitude wilayah Indonesia harus antara -11 dan 6"),
  longitude: z
    .number()
    .min(95, "Longitude wilayah Indonesia harus antara 95 dan 141")
    .max(141, "Longitude wilayah Indonesia harus antara 95 dan 141"),
  maxQuota: z
    .number()
    .int()
    .min(1, "Kuota siswa minimal 1 orang")
    .max(50, "Kuota siswa maksimal 50 orang per periode")
    .default(5),
  supportedJobCardIds: z
    .array(z.string().uuid("ID Job Card harus berformat UUID"))
    .min(1, "Pilih minimal 1 pekerjaan teknis yang tersedia di lokasi mitra ini."),
});

export type CreateDudiPartnerInput = z.infer<typeof createDudiPartnerSchema>;

/**
 * Pendaftaran Mentor Industri di DUDI
 */
export const createDudiMentorSchema = z.object({
  fullName: z.string().min(3, "Nama mentor minimal 3 karakter").max(120),
  jobTitle: z.string().min(2, "Jabatan / divisi mentor minimal 2 karakter").max(100),
  whatsappNumber: z
    .string()
    .regex(
      /^(\+62|62|08)[0-9]{8,13}$/,
      "Nomor WhatsApp tidak valid (Gunakan format 08123456789 atau +628123456789)"
    ),
});

export type CreateDudiMentorInput = z.infer<typeof createDudiMentorSchema>;

/**
 * Aktivasi & Pengikatan Perangkat Mentor (Device Token & PIN 4-digit)
 */
export const bindMentorDeviceSchema = z.object({
  activationToken: z.string().min(20, "Token aktivasi tidak valid"),
  deviceToken: z
    .string()
    .min(16, "Device token tidak valid")
    .max(128, "Device token terlalu panjang"),
  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN harus tepat 4 digit angka"),
});

export type BindMentorDeviceInput = z.infer<typeof bindMentorDeviceSchema>;

/**
 * Reset token perangkat mentor (A2: Pergantian HP / Kehilangan)
 */
export const resetMentorDeviceSchema = z.object({
  mentorId: z.string().uuid("ID mentor harus UUID valid"),
});

export type ResetMentorDeviceInput = z.infer<typeof resetMentorDeviceSchema>;

// ─────────────────────────────────────────────────────────
// FR-004: Smart Placement & Spatial Compatibility schemas
// ─────────────────────────────────────────────────────────
export * from "./placement.js";

// ─────────────────────────────────────────────────────────
// FR-011: e-Rapor SMK Grade & Narrative Exporter schemas
// ─────────────────────────────────────────────────────────
export * from "./erapor.js";

// ─────────────────────────────────────────────────────────
// FR-008: Live Competency Heatmap & Drift Alert schemas
// ─────────────────────────────────────────────────────────
export * from "./heatmap.js";
