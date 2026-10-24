import {
  DRIFT_NON_COMPETENCY_THRESHOLD,
  DRIFT_NON_COMPETENCY_MIN_JP,
  DRIFT_MONOTONY_MIN_JP,
  DRIFT_MONOTONY_THRESHOLD,
  DRIFT_DORMANCY_MIN_LOGS,
  DRIFT_DORMANCY_DAYS,
  STUDENT_MAX_NORMAL_WEEKLY_HOURS,
  STUDENT_OVERWORK_WARNING_HOURS,
  STUDENT_OVERWORK_CRITICAL_HOURS,
  STUDENT_OVERTIME_DAILY_THRESHOLD,
  STUDENT_MAX_WEEKLY_OVERTIME_DAYS,
  DriftAlertType,
} from "@vokalink/shared";

export interface NonCompetencyDriftInput {
  totalJpLast14Days: number;
  nonCompetencyJpLast14Days: number;
}

export function detectNonCompetencyOverload(
  input: NonCompetencyDriftInput
): { detected: boolean; ratio: number } {
  if (input.totalJpLast14Days < DRIFT_NON_COMPETENCY_MIN_JP) {
    return { detected: false, ratio: 0 };
  }
  const ratio = input.nonCompetencyJpLast14Days / input.totalJpLast14Days;
  return {
    detected: ratio > DRIFT_NON_COMPETENCY_THRESHOLD,
    ratio: Math.round(ratio * 100) / 100,
  };
}

export interface SkillMonotonyInput {
  daysSincePklStart: number;
  totalCumulativeJp: number;
  cpElementsJp: { elementId: string; jp: number }[];
}

export function detectSkillMonotony(
  input: SkillMonotonyInput
): { detected: boolean; dominantElementId?: string; dominantRatio?: number } {
  // Grace period for early orientation (< 5 days)
  if (input.daysSincePklStart < 5) {
    return { detected: false };
  }

  if (input.totalCumulativeJp < DRIFT_MONOTONY_MIN_JP) {
    return { detected: false };
  }

  if (input.cpElementsJp.length < 3) {
    return { detected: false };
  }

  let maxJp = 0;
  let dominantId: string | undefined;
  let zeroCount = 0;

  for (const el of input.cpElementsJp) {
    if (el.jp > maxJp) {
      maxJp = el.jp;
      dominantId = el.elementId;
    }
    if (el.jp === 0) {
      zeroCount++;
    }
  }

  const ratio = maxJp / input.totalCumulativeJp;
  const isMonotonous = ratio > DRIFT_MONOTONY_THRESHOLD && zeroCount >= 2;

  return {
    detected: isMonotonous,
    dominantElementId: dominantId,
    dominantRatio: Math.round(ratio * 100) / 100,
  };
}

export interface ApprovalDormancyInput {
  pendingLogs: { logId: string; logDate: string }[];
  currentDate: string; // YYYY-MM-DD
}

export function detectApprovalDormancy(
  input: ApprovalDormancyInput
): { detected: boolean; dormantLogCount: number } {
  const currentMs = new Date(input.currentDate).getTime();
  const msInDay = 24 * 60 * 60 * 1000;

  const dormantLogs = input.pendingLogs.filter((log) => {
    const logMs = new Date(log.logDate).getTime();
    const diffDays = (currentMs - logMs) / msInDay;
    return diffDays > DRIFT_DORMANCY_DAYS;
  });

  return {
    detected: dormantLogs.length >= DRIFT_DORMANCY_MIN_LOGS,
    dormantLogCount: dormantLogs.length,
  };
}

export interface StudentOverworkDailyLog {
  logDate: string; // YYYY-MM-DD
  realHours: number;
}

export interface StudentOverworkInput {
  studentName?: string;
  logsLast7Days: StudentOverworkDailyLog[];
  weeklyHoursLimit?: number;
}

export interface StudentOverworkResult {
  detected: boolean;
  severity: "NONE" | "WARNING" | "CRITICAL";
  totalHours7Days: number;
  overtimeDaysCount: number;
  consecutiveOvertimeDays: number;
  alertTitle?: string;
  alertMessage?: string;
  recommendedIntervention?: string;
}

/**
 * BR-013 & Permendikbudristek No. 50/2020:
 * Mendeteksi potensi beban kerja berlebih (Student Overwork Risk)
 * untuk melindungi keselamatan & kesehatan kerja (K3) peserta didik PKL.
 */
export function detectStudentOverwork(input: StudentOverworkInput): StudentOverworkResult {
  const { logsLast7Days, studentName = "Siswa", weeklyHoursLimit = STUDENT_MAX_NORMAL_WEEKLY_HOURS } = input;

  if (!logsLast7Days || logsLast7Days.length === 0) {
    return {
      detected: false,
      severity: "NONE",
      totalHours7Days: 0,
      overtimeDaysCount: 0,
      consecutiveOvertimeDays: 0,
    };
  }

  // 1. Urutkan berdasarkan tanggal
  const sorted = [...logsLast7Days].sort(
    (a, b) => new Date(a.logDate).getTime() - new Date(b.logDate).getTime()
  );

  const totalHours7Days = sorted.reduce((sum, item) => sum + item.realHours, 0);

  // 2. Hitung hari lembur/proyek khusus (>= 9 Jam)
  let overtimeDaysCount = 0;
  let currentConsecutive = 0;
  let maxConsecutive = 0;

  for (const item of sorted) {
    if (item.realHours >= STUDENT_OVERTIME_DAILY_THRESHOLD) {
      overtimeDaysCount++;
      currentConsecutive++;
      if (currentConsecutive > maxConsecutive) {
        maxConsecutive = currentConsecutive;
      }
    } else {
      currentConsecutive = 0;
    }
  }

  // 3. Evaluasi ambang batas
  const isCritical =
    totalHours7Days >= STUDENT_OVERWORK_CRITICAL_HOURS ||
    maxConsecutive >= 4 ||
    overtimeDaysCount >= 4;

  const isWarning =
    !isCritical &&
    (totalHours7Days > weeklyHoursLimit ||
      maxConsecutive >= STUDENT_MAX_WEEKLY_OVERTIME_DAYS ||
      overtimeDaysCount >= STUDENT_MAX_WEEKLY_OVERTIME_DAYS);

  if (isCritical) {
    return {
      detected: true,
      severity: "CRITICAL",
      totalHours7Days,
      overtimeDaysCount,
      consecutiveOvertimeDays: maxConsecutive,
      alertTitle: "Peringatan Kritis K3: Potensi Eksploitasi Jam Kerja Peserta Didik",
      alertMessage: `${studentName} tercatat bekerja ${totalHours7Days} jam dalam 7 hari terakhir (${overtimeDaysCount} hari lembur 9–10 jam). Melebihi batas aman Permendikbudristek No. 50/2020 & UU Ketenagakerjaan.`,
      recommendedIntervention:
        "Segera lakukan koordinasi advokasi K3 via WhatsApp dengan Mentor DUDI untuk penyesuaian jam kerja siswa.",
    };
  }

  if (isWarning) {
    return {
      detected: true,
      severity: "WARNING",
      totalHours7Days,
      overtimeDaysCount,
      consecutiveOvertimeDays: maxConsecutive,
      alertTitle: "Peringatan Beban Kerja: Melebihi Batas Wajar Mingguan (40 Jam)",
      alertMessage: `${studentName} tercatat bekerja ${totalHours7Days} jam minggu ini (${overtimeDaysCount} hari dengan durasi 9–10 jam). Pantau agar kesehatan peserta didik tetap terjaga.`,
      recommendedIntervention:
        "Kirim pesan konfirmasi santun ke mentor DUDI untuk memastikan ritme kerja siswa tidak menimbulkan kelelahan fisik berlebih.",
    };
  }

  return {
    detected: false,
    severity: "NONE",
    totalHours7Days,
    overtimeDaysCount,
    consecutiveOvertimeDays: maxConsecutive,
  };
}

export interface ComprehensiveDriftInput {
  nonCompetency: NonCompetencyDriftInput;
  skillMonotony: SkillMonotonyInput;
  approvalDormancy: ApprovalDormancyInput;
  studentOverwork?: StudentOverworkInput;
}

export function evaluateCompetencyDrift(input: ComprehensiveDriftInput): DriftAlertType[] {
  const alerts: DriftAlertType[] = [];

  if (detectNonCompetencyOverload(input.nonCompetency).detected) {
    alerts.push("NON_COMPETENCY_OVERLOAD");
  }

  if (detectSkillMonotony(input.skillMonotony).detected) {
    alerts.push("SKILL_MONOTONY");
  }

  if (detectApprovalDormancy(input.approvalDormancy).detected) {
    alerts.push("APPROVAL_DORMANCY");
  }

  if (input.studentOverwork && detectStudentOverwork(input.studentOverwork).detected) {
    alerts.push("STUDENT_OVERWORK_HOURS");
  }

  return alerts;
}

