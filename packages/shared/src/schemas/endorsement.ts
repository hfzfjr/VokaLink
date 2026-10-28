import { z } from "zod";
import { PIN_LENGTH, MAX_ENDORSEMENT_BADGES } from "../constants/index";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FR-010: 1-Click Soft Skills Endorsement & DUDI Partnership Quality Schemas
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const generateEndorsementLinkSchema = z.object({
  placementId: z.string().uuid("ID penempatan tidak valid"),
  studentId: z.string().uuid("ID siswa tidak valid").optional(),
});

export type GenerateEndorsementLinkInput = z.infer<typeof generateEndorsementLinkSchema>;

export const endorsementSubmitSchema = z.object({
  attitudeScore: z
    .number()
    .int("Skor sikap harus berupa angka bulat")
    .min(1, "Skor sikap minimal 1")
    .max(100, "Skor sikap maksimal 100"),
  selectedBadges: z
    .array(z.string().min(1).max(100))
    .min(1, "Pilih minimal 1 lencana etos kerja")
    .max(MAX_ENDORSEMENT_BADGES, `Maksimal memilih ${MAX_ENDORSEMENT_BADGES} lencana etos kerja`),
  endorsementQuote: z
    .string()
    .max(300, "Kutipan testimoni maksimal 300 karakter")
    .optional(),
  deviceToken: z
    .string()
    .min(16, "Device token tidak valid"),
  pin: z
    .string()
    .length(PIN_LENGTH, `PIN harus tepat ${PIN_LENGTH} digit angka`)
    .regex(/^\d{4}$/, "PIN harus 4 digit angka"),
});

export type EndorsementSubmitInput = z.infer<typeof endorsementSubmitSchema>;

export const dudiQualityIndexQuerySchema = z.object({
  academicPeriodId: z.string().uuid().optional(),
  sectorCategory: z.string().optional(),
});

export type DudiQualityIndexQuery = z.infer<typeof dudiQualityIndexQuerySchema>;

export type DudiQualityCategory =
  | "Mitra Unggulan"
  | "Mitra Perlu Evaluasi Penugasan"
  | "Mitra Zona Merah";

export type DudiQualityRecommendation =
  | "Direkomendasikan Perpanjangan MoU"
  | "Perlu Evaluasi Penugasan & Rotasi Job Card"
  | "Tidak Direkomendasikan / Dominan Tugas Non-Kejuruan";

export interface DudiQualityMetricItem {
  dudiId: string;
  dudiName: string;
  sectorCategory: string;
  city: string;
  studentCount: number;
  totalJp: number;
  competencyJp: number;
  relevanceRatio: number; // 0..100
  avgValidationDays: number;
  speedScore: number; // 0..100
  supportedCpCount: number;
  achievedCpCount: number;
  coverageScore: number; // 0..100
  overallQualityScore: number; // 0..100
  category: DudiQualityCategory;
  recommendation: DudiQualityRecommendation;
}

export interface DudiQualityAuditSummary {
  totalDudi: number;
  excellentCount: number;
  evaluationCount: number;
  redZoneCount: number;
  avgQualityScore: number;
}

export interface DudiQualityAuditResponse {
  summary: DudiQualityAuditSummary;
  partners: DudiQualityMetricItem[];
}

export interface EndorsementDetailResponse {
  student: {
    id: string;
    fullName: string;
    nisn: string;
    schoolName: string;
    departmentName: string;
    avatarUrl?: string | null;
  };
  placement: {
    id: string;
    dudiName: string;
    mentorName: string;
    mentorJobTitle?: string;
    startDate: string;
    endDate: string;
    totalVerifiedJp: number;
    completionPercentage: number;
  };
  standardBadges: string[];
  isAlreadyEndorsed: boolean;
  existingEndorsement?: {
    attitudeScore: number;
    badges: string[];
    quote?: string | null;
    signatureHash: string;
    createdAt: string;
  } | null;
}
