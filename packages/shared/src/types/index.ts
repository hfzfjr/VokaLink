/**
 * VokaLink Shared Domain Types & Enums
 */

export type UserRole = "SCHOOL_ADMIN" | "TEACHER" | "STUDENT";

export type AttendanceType = "PRESENT" | "SICK" | "PERMIT";

export type LogStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REVISION_REQUIRED";

export type AutonomyLevel = 1 | 2 | 3; // 1: Observasi, 2: Terbimbing, 3: Mandiri

export type NonCompetencyCategory =
  | "ADMIN_UMUM"
  | "KEBERSIHAN_GUDANG"
  | "KURIR"
  | "JAGA_TOKO";

export type SignedLinkPurpose =
  | "DEVICE_ACTIVATION"
  | "LOG_VERIFY"
  | "ENDORSEMENT";

export type SignedLinkMode = "QR" | "WA_BATCH";

export type SecurityFlagKind =
  | "UNTRUSTED_DEVICE"
  | "PIN_LOCKOUT"
  | "TOKEN_REUSE";

export type DriftAlertType =
  | "NON_COMPETENCY_OVERLOAD"
  | "SKILL_MONOTONY"
  | "APPROVAL_DORMANCY"
  | "STUDENT_OVERWORK_HOURS";

export type DriftAlertSeverity = "WARNING" | "CRITICAL";

export type DriftAlertStatus = "OPEN" | "INTERVENED" | "RESOLVED";

export type InterventionActionType =
  | "WA_COORDINATION"
  | "SITE_VISIT"
  | "DUDI_ROTATION";

export type PlacementStatus =
  | "PLANNED"
  | "ACTIVE"
  | "ROTATED_OUT"
  | "COMPLETED";

/**
 * Standard RFC 7807 Problem Details
 */
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  errors?: Record<string, string[]>;
}
