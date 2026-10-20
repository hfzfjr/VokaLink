import { describe, it, expect } from "vitest";
import {
  canonicalJson,
  sealObjectWithHmac,
  createSignedToken,
  parseAndVerifySignedToken,
  calculateHaversineDistanceKm,
  calculatePlacementScore,
  detectNonCompetencyOverload,
  detectSkillMonotony,
  detectApprovalDormancy,
  calculateElementGrade,
  calculateFinalPklGrade,
} from "../src/index.js";

describe("Canonical JSON & HMAC", () => {
  it("produces deterministic output regardless of key ordering", () => {
    const objA = { b: 2, a: 1, c: { z: 9, y: 8 } };
    const objB = { a: 1, c: { y: 8, z: 9 }, b: 2 };
    expect(canonicalJson(objA)).toEqual(canonicalJson(objB));
    expect(canonicalJson(objA)).toBe('{"a":1,"b":2,"c":{"y":8,"z":9}}');
  });

  it("seals objects identically for identical structures", () => {
    const secret = "test_super_secret_key_1234567890";
    const sealA = sealObjectWithHmac(secret, { x: 10, y: "abc" });
    const sealB = sealObjectWithHmac(secret, { y: "abc", x: 10 });
    expect(sealA).toBe(sealB);
    expect(typeof sealA).toBe("string");
  });

  it("creates and verifies signed magic link tokens", () => {
    const secret = "magic_link_hmac_secret_key_32bytes!";
    const payload = {
      rid: "123e4567-e89b-12d3-a456-426614174000",
      mid: "mentor-uuid-1",
      p: "LOG_VERIFY",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = createSignedToken(payload, secret);
    expect(token.startsWith("v1.")).toBe(true);

    const verified = parseAndVerifySignedToken(token, secret);
    expect(verified.valid).toBe(true);
    expect(verified.payload?.["rid"]).toBe(payload.rid);

    // Tampered token test
    const tampered = token.slice(0, -3) + "xyz";
    const tamperedResult = parseAndVerifySignedToken(tampered, secret);
    expect(tamperedResult.valid).toBe(false);
  });
});

describe("Haversine Distance & Smart Placement (BR-005, BR-006)", () => {
  it("calculates haversine distance accurately", () => {
    // Jakarta Monas to Bundaran HI (~2.5 km)
    const dist = calculateHaversineDistanceKm(-6.1754, 106.8272, -6.195, 106.823);
    expect(dist).toBeGreaterThan(2);
    expect(dist).toBeLessThan(3);
  });

  it("computes placement score with bonus for distance <= 5km", () => {
    const result = calculatePlacementScore({
      supportedCpJp: 792,
      targetTotalJp: 792,
      studentLat: -6.1754,
      studentLon: 106.8272,
      dudiLat: -6.18,
      dudiLon: 106.828, // ~0.5 km
    });

    expect(result.competencyScore).toBe(100);
    expect(result.distanceScore).toBe(100);
    expect(result.totalScore).toBe(100);
    expect(result.requiresMidtermRotation).toBe(false);
  });

  it("flags placement for midterm rotation if competency < 50%", () => {
    const result = calculatePlacementScore({
      supportedCpJp: 300,
      targetTotalJp: 792, // ~37.88%
      studentLat: -6.1754,
      studentLon: 106.8272,
      dudiLat: -6.18,
      dudiLon: 106.828,
    });

    expect(result.competencyScore).toBeLessThan(50);
    expect(result.requiresMidtermRotation).toBe(true);
  });
});

describe("Competency Drift Detection (BR-008)", () => {
  it("detects NON_COMPETENCY_OVERLOAD when ratio > 30% and total >= 20 JP", () => {
    // 15 JP non-competency out of 40 JP total = 37.5%
    const drift = detectNonCompetencyOverload({
      totalJpLast14Days: 40,
      nonCompetencyJpLast14Days: 15,
    });
    expect(drift.detected).toBe(true);
    expect(drift.ratio).toBe(0.38);

    // Below 20 JP total should not trigger
    const belowMinJp = detectNonCompetencyOverload({
      totalJpLast14Days: 15,
      nonCompetencyJpLast14Days: 8,
    });
    expect(belowMinJp.detected).toBe(false);
  });

  it("detects SKILL_MONOTONY when > 80% concentrated in 1 element and >= 2 elements 0%", () => {
    const monotony = detectSkillMonotony({
      daysSincePklStart: 20,
      totalCumulativeJp: 100,
      cpElementsJp: [
        { elementId: "el-1", jp: 85 }, // 85%
        { elementId: "el-2", jp: 0 },
        { elementId: "el-3", jp: 0 },
        { elementId: "el-4", jp: 15 },
      ],
    });
    expect(monotony.detected).toBe(true);
    expect(monotony.dominantElementId).toBe("el-1");

    // During orientation (< 5 days) should not trigger
    const orientation = detectSkillMonotony({
      daysSincePklStart: 3,
      totalCumulativeJp: 100,
      cpElementsJp: [
        { elementId: "el-1", jp: 90 },
        { elementId: "el-2", jp: 0 },
        { elementId: "el-3", jp: 0 },
      ],
    });
    expect(orientation.detected).toBe(false);
  });

  it("detects APPROVAL_DORMANCY when >= 5 logs pending > 7 days", () => {
    const logs = [
      { logId: "1", logDate: "2026-10-01" },
      { logId: "2", logDate: "2026-10-02" },
      { logId: "3", logDate: "2026-10-03" },
      { logId: "4", logDate: "2026-10-04" },
      { logId: "5", logDate: "2026-10-05" },
    ];
    const result = detectApprovalDormancy({
      pendingLogs: logs,
      currentDate: "2026-10-15", // 10+ days later
    });
    expect(result.detected).toBe(true);
    expect(result.dormantLogCount).toBe(5);
  });
});

describe("e-Rapor Grades (BR-009)", () => {
  it("calculates element grade based on 60% JP ratio + 40% autonomy weight", () => {
    const grade = calculateElementGrade({
      targetJp: 100,
      verifiedItems: [
        { durationJp: 50, autonomyLevel: 3 }, // Mandiri (100)
        { durationJp: 50, autonomyLevel: 2 }, // Terbimbing (88)
      ],
    });

    // 100 verified out of 100 target = 100% * 0.60 = 60
    // Autonomy avg: (50*100 + 50*88) / 100 = 94. 94 * 0.40 = 37.6
    // Total = 60 + 37.6 = 97.6
    expect(grade.score).toBe(97.6);
  });

  it("calculates final PKL grade combining technical (80%) and attitude (20%)", () => {
    const finalScore = calculateFinalPklGrade({
      elementScores: [90, 80, 100], // avg = 90
      mentorAttitudeScore: 95,
    });
    // 90 * 0.80 + 95 * 0.20 = 72 + 19 = 91
    expect(finalScore).toBe(91);
  });
});
