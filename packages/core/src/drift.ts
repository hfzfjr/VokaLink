import {
  DRIFT_NON_COMPETENCY_THRESHOLD,
  DRIFT_NON_COMPETENCY_MIN_JP,
  DRIFT_MONOTONY_MIN_JP,
  DRIFT_MONOTONY_THRESHOLD,
  DRIFT_DORMANCY_MIN_LOGS,
  DRIFT_DORMANCY_DAYS,
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

export interface ComprehensiveDriftInput {
  nonCompetency: NonCompetencyDriftInput;
  skillMonotony: SkillMonotonyInput;
  approvalDormancy: ApprovalDormancyInput;
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

  return alerts;
}
