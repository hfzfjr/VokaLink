import {
  PLACEMENT_WEIGHT_COMPETENCY,
  PLACEMENT_WEIGHT_DISTANCE,
  PLACEMENT_DISTANCE_MAX_FREE_KM,
  PLACEMENT_DISTANCE_PENALTY_RANGE_KM,
  ROTATION_THRESHOLD_COMPETENCY_SCORE,
  TOTAL_TARGET_JP,
} from "@vokalink/shared";
import { calculateHaversineDistanceKm } from "./haversine";

export interface PlacementScoreInput {
  supportedCpJp: number;
  targetTotalJp?: number;
  studentLat: number;
  studentLon: number;
  dudiLat: number;
  dudiLon: number;
}

export interface PlacementScoreResult {
  totalScore: number;
  competencyScore: number;
  distanceScore: number;
  distanceKm: number;
  requiresMidtermRotation: boolean;
}

/**
 * Calculates distance score based on BR-005:
 * If d <= 5km: 100
 * If d > 5km: max(0, 100 - ((d - 5) / 20) * 100)
 */
export function calculateDistanceScore(distanceKm: number): number {
  if (distanceKm <= PLACEMENT_DISTANCE_MAX_FREE_KM) {
    return 100;
  }
  const penalty =
    ((distanceKm - PLACEMENT_DISTANCE_MAX_FREE_KM) /
      PLACEMENT_DISTANCE_PENALTY_RANGE_KM) *
    100;
  const score = Math.max(0, 100 - penalty);
  return Math.round(score * 100) / 100;
}

/**
 * Calculates Smart Placement Score according to BR-005 and BR-006
 */
export function calculatePlacementScore(
  input: PlacementScoreInput
): PlacementScoreResult {
  const targetJp = input.targetTotalJp ?? TOTAL_TARGET_JP;
  const rawCompetencyScore = (input.supportedCpJp / targetJp) * 100;
  const competencyScore = Math.min(100, Math.round(rawCompetencyScore * 100) / 100);

  const distanceKm = calculateHaversineDistanceKm(
    input.studentLat,
    input.studentLon,
    input.dudiLat,
    input.dudiLon
  );

  const distanceScore = calculateDistanceScore(distanceKm);

  const totalScore = Math.round(
    (competencyScore * PLACEMENT_WEIGHT_COMPETENCY +
      distanceScore * PLACEMENT_WEIGHT_DISTANCE) *
      100
  ) / 100;

  const requiresMidtermRotation =
    competencyScore < ROTATION_THRESHOLD_COMPETENCY_SCORE;

  return {
    totalScore,
    competencyScore,
    distanceScore,
    distanceKm,
    requiresMidtermRotation,
  };
}

export interface CandidateDudi {
  dudiId: string;
  name: string;
  latitude: number;
  longitude: number;
  remainingQuota: number;
  supportedCpJp: number;
}

export interface CandidateStudent {
  studentId: string;
  name: string;
  homeLatitude: number;
  homeLongitude: number;
}

export interface StudentDudiMatch {
  dudiId: string;
  dudiName: string;
  totalScore: number;
  competencyScore: number;
  distanceScore: number;
  distanceKm: number;
  requiresMidtermRotation: boolean;
  remainingQuota: number;
}

export interface StudentPlacementRecommendation {
  studentId: string;
  studentName: string;
  matches: StudentDudiMatch[];
  bestMatch: StudentDudiMatch | null;
}

export interface GreedyAssignmentResult {
  assigned: Array<{
    studentId: string;
    studentName: string;
    dudiId: string;
    dudiName: string;
    score: StudentDudiMatch;
  }>;
  unassigned: Array<{
    studentId: string;
    studentName: string;
    reason: string;
  }>;
}

/**
 * Memberikan peringkat seluruh mitra DUDI untuk 1 orang siswa terurut dari skor tertinggi
 */
export function rankDudiForStudent(
  student: CandidateStudent,
  dudis: CandidateDudi[],
  targetTotalJp: number = TOTAL_TARGET_JP
): StudentDudiMatch[] {
  return dudis
    .map((dudi) => {
      const score = calculatePlacementScore({
        supportedCpJp: dudi.supportedCpJp,
        targetTotalJp,
        studentLat: student.homeLatitude,
        studentLon: student.homeLongitude,
        dudiLat: dudi.latitude,
        dudiLon: dudi.longitude,
      });

      return {
        dudiId: dudi.dudiId,
        dudiName: dudi.name,
        totalScore: score.totalScore,
        competencyScore: score.competencyScore,
        distanceScore: score.distanceScore,
        distanceKm: score.distanceKm,
        requiresMidtermRotation: score.requiresMidtermRotation,
        remainingQuota: dudi.remainingQuota,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Algoritma greedy assignment penempatan massal dengan penegakan kuota (DESIGN.md §8.1)
 */
export function matchPlacementsGreedy(
  students: CandidateStudent[],
  dudis: CandidateDudi[],
  targetTotalJp: number = TOTAL_TARGET_JP
): GreedyAssignmentResult {
  const quotaMap = new Map<string, number>();
  for (const d of dudis) {
    quotaMap.set(d.dudiId, Math.max(0, d.remainingQuota));
  }

  const assigned: GreedyAssignmentResult["assigned"] = [];
  const unassigned: GreedyAssignmentResult["unassigned"] = [];

  for (const student of students) {
    const ranked = rankDudiForStudent(student, dudis, targetTotalJp);
    const chosen = ranked.find((r) => (quotaMap.get(r.dudiId) ?? 0) > 0);

    if (chosen) {
      const currentRemaining = quotaMap.get(chosen.dudiId) ?? 1;
      quotaMap.set(chosen.dudiId, currentRemaining - 1);
      assigned.push({
        studentId: student.studentId,
        studentName: student.name,
        dudiId: chosen.dudiId,
        dudiName: chosen.dudiName,
        score: chosen,
      });
    } else {
      unassigned.push({
        studentId: student.studentId,
        studentName: student.name,
        reason: "Kuota seluruh mitra DUDI pilihan telah penuh",
      });
    }
  }

  return { assigned, unassigned };
}
