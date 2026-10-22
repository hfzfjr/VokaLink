import { z } from "zod";

/**
 * FR-008: Schema filter & kueri Dasbor Heatmap Guru
 */
export const heatmapQuerySchema = z.object({
  departmentId: z.string().min(1).optional(),
  dudiId: z.string().min(1).optional(),
  driftOnly: z.enum(["true", "false"]).optional(),
});

export type HeatmapQueryInput = z.infer<typeof heatmapQuerySchema>;

/**
 * Tipe status sel kompetensi pada matriks heatmap
 */
export type CpCellStatus = "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED";

export interface CpElementSummary {
  id: string;
  code: string;
  title: string;
  targetJp: number;
  sortOrder: number;
}

export interface StudentCpProgress {
  cpElementId: string;
  code: string;
  title: string;
  verifiedJp: number;
  targetJp: number;
  percentage: number;
  status: CpCellStatus;
}

export interface DriftAlertItem {
  id: string;
  placementId: string;
  studentId: string;
  alertType: "NON_COMPETENCY_OVERLOAD" | "SKILL_MONOTONY" | "APPROVAL_DORMANCY";
  severity: "WARNING" | "CRITICAL";
  status: "OPEN" | "INTERVENED" | "RESOLVED";
  metricSnapshot: {
    ratio?: number;
    thresholdRatio?: number;
    dominantRatio?: number;
    dominantElementName?: string;
    dormantLogCount?: number;
    detectedReason?: string;
    mentorName?: string;
    dudiName?: string;
  };
  detectedAt: string;
}

export interface HeatmapStudentRow {
  studentId: string;
  fullName: string;
  nisn: string;
  avatarUrl?: string | null;
  placement: {
    id: string;
    dudiId: string;
    dudiName: string;
    mentorName: string;
    mentorPhone?: string;
    city: string;
  };
  totalVerifiedJp: number;
  totalPendingJp: number;
  nonCompetencyJpLast14Days: number;
  totalJpLast14Days: number;
  overallPercentage: number;
  cpProgress: StudentCpProgress[];
  driftAlerts: DriftAlertItem[];
  hasDriftWarning: boolean;
  orientationGracePeriod: boolean;
}

export interface HeatmapResponse {
  department: {
    id: string;
    name: string;
    sectorCode: string;
    targetTotalJp: number;
  };
  cpElements: CpElementSummary[];
  students: HeatmapStudentRow[];
  summary: {
    totalStudents: number;
    studentsWithDrift: number;
    averageCompetencyPercentage: number;
    activeAlertsCount: {
      nonCompetency: number;
      skillMonotony: number;
      approvalDormancy: number;
    };
  };
}
