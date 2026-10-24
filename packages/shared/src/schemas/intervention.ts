import { z } from "zod";
import type { InterventionActionType } from "../types/index.js";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FR-009: Smart Intervention Dispatcher & Mid-Term Rotation Schemas
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const interventionActionTypeSchema = z.enum([
  "WA_COORDINATION",
  "SITE_VISIT",
  "DUDI_ROTATION",
]);

/**
 * Body POST /api/v1/interventions
 * Pencatatan tindakan bimbingan / intervensi guru
 */
export const createInterventionSchema = z.object({
  driftAlertId: z.string().uuid().optional(),
  placementId: z.string().uuid(),
  studentId: z.string().uuid(),
  actionType: interventionActionTypeSchema,
  messageSent: z.string().min(1, "Catatan / pesan intervensi wajib diisi"),
  newDudiId: z.string().uuid().optional(),
  newMentorId: z.string().uuid().optional(),
});

export type CreateInterventionInput = z.infer<typeof createInterventionSchema>;

/**
 * Body POST /api/v1/placements/:id/rotate
 * Eksekusi rotasi mitra DUDI tengah semester (A1 & TC-009)
 */
export const rotatePlacementSchema = z.object({
  studentId: z.string().uuid("ID siswa harus berupa UUID valid"),
  fromPlacementId: z.string().uuid("ID penempatan asal harus berupa UUID valid"),
  toDudiId: z.string().uuid("ID DUDI tujuan baru harus berupa UUID valid"),
  toMentorId: z.string().uuid("ID mentor baru harus berupa UUID valid").optional(),
  driftAlertId: z.string().uuid().optional(),
  reason: z.string().min(5, "Alasan rotasi minimal 5 karakter agar terdokumentasi dengan baik"),
  notes: z.string().optional(),
});

export type RotatePlacementInput = z.infer<typeof rotatePlacementSchema>;

/**
 * Query / Body POST /api/v1/interventions/draft
 * Pembangkitan draf pesan koordinasi WhatsApp berbasis data
 */
export const generateInterventionDraftSchema = z.object({
  studentId: z.string().uuid(),
  placementId: z.string().uuid(),
  driftAlertId: z.string().uuid().optional(),
  alertType: z
    .enum([
      "NON_COMPETENCY_OVERLOAD",
      "SKILL_MONOTONY",
      "APPROVAL_DORMANCY",
      "STUDENT_OVERWORK_HOURS",
      "GENERAL",
    ])
    .optional(),
});

export type GenerateInterventionDraftInput = z.infer<
  typeof generateInterventionDraftSchema
>;

/**
 * Representasi Data Respons Intervensi
 */
export interface InterventionLogItem {
  id: string;
  driftAlertId?: string;
  teacherId: string;
  actionType: InterventionActionType;
  messageSent: string;
  createdAt: string;
}

export interface InterventionDraftResult {
  messageText: string;
  waLink: string;
  mentorName: string;
  mentorPhone: string;
  studentName: string;
  dudiName: string;
  alertType?: string;
}

export interface RotationExecutionResult {
  success: boolean;
  message: string;
  previousPlacement: {
    id: string;
    dudiName: string;
    status: string;
    verifiedJp: number;
  };
  newPlacement: {
    id: string;
    dudiId: string;
    dudiName: string;
    mentorName: string;
    status: string;
    rotationSequence: number;
  };
  cumulativeVerifiedJp: number;
  interventionLogId?: string;
}
