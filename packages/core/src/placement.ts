import {
  PLACEMENT_WEIGHT_COMPETENCY,
  PLACEMENT_WEIGHT_DISTANCE,
  PLACEMENT_DISTANCE_MAX_FREE_KM,
  PLACEMENT_DISTANCE_PENALTY_RANGE_KM,
  ROTATION_THRESHOLD_COMPETENCY_SCORE,
  TOTAL_TARGET_JP,
} from "@vokalink/shared";
import { calculateHaversineDistanceKm } from "./haversine.js";

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
