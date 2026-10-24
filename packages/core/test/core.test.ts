import { describe, it, expect } from "vitest";
import {
  sealObjectWithHmac,
  createSignedToken,
  parseAndVerifySignedToken,
  hashPinWithScrypt,
  verifyPinWithScrypt,
  generateSalt,
  hashSha256Hex,
} from "../src/crypto.js";
import {
  canonicalJson,
  calculateHaversineDistanceKm,
  calculatePlacementScore,
  rankDudiForStudent,
  matchPlacementsGreedy,
  detectNonCompetencyOverload,
  detectSkillMonotony,
  detectApprovalDormancy,
  detectStudentOverwork,
  evaluateCompetencyDrift,
  calculateElementGrade,
  calculateFinalPklGrade,
  calculateSopRubricScore,
  calculateOfficialFourElementsPklGrade,
  generateEraporNarratives,
  generateEraporCsv,
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

  it("hashes and verifies 4-digit PIN using scrypt with salt and pepper", () => {
    const pin = "1234";
    const salt = generateSalt(16);
    const pepper = "server_super_secret_pin_pepper_32bytes!";

    const hash = hashPinWithScrypt(pin, salt, pepper);
    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(128); // 64 bytes = 128 hex chars

    // Verifikasi PIN benar
    const isCorrect = verifyPinWithScrypt(pin, salt, pepper, hash);
    expect(isCorrect).toBe(true);

    // Verifikasi PIN salah
    const isWrong = verifyPinWithScrypt("9999", salt, pepper, hash);
    expect(isWrong).toBe(false);

    // Verifikasi pepper salah
    const isWrongPepper = verifyPinWithScrypt(pin, salt, "wrong_pepper", hash);
    expect(isWrongPepper).toBe(false);
  });

  it("computes standard SHA-256 hex correctly", () => {
    const hash = hashSha256Hex("hello-vokalink");
    expect(hash).toBe("aa93432e844deade566358df5c20a985ebfa72a718b087a7d7be7742dbbf41a9");
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

  it("ranks candidate DUDIs for a student ordered by totalScore descending", () => {
    const student = {
      studentId: "s-1",
      name: "Ahmad Rizky",
      homeLatitude: -7.2575,
      homeLongitude: 112.7521,
    };

    const dudis = [
      {
        dudiId: "d-far",
        name: "PT Jauh Banget",
        latitude: -7.50, // ~30 km
        longitude: 112.75,
        remainingQuota: 3,
        supportedCpJp: 400,
      },
      {
        dudiId: "d-near-high",
        name: "PT Dekat & Lengkap",
        latitude: -7.26, // ~0.5 km
        longitude: 112.752,
        remainingQuota: 2,
        supportedCpJp: 792,
      },
      {
        dudiId: "d-near-low",
        name: "PT Dekat Tapi Rendah",
        latitude: -7.26,
        longitude: 112.752,
        remainingQuota: 5,
        supportedCpJp: 200,
      },
    ];

    const ranked = rankDudiForStudent(student, dudis, 792);
    expect(ranked[0]?.dudiId).toBe("d-near-high");
    expect(ranked[0]?.totalScore).toBe(100);
    expect(ranked[0]?.requiresMidtermRotation).toBe(false);

    // The lowest competency one requires midterm rotation
    const lowMatch = ranked.find((r) => r.dudiId === "d-near-low");
    expect(lowMatch?.requiresMidtermRotation).toBe(true);
  });

  it("performs greedy placement assignment respecting quota limits", () => {
    const students = [
      { studentId: "s-1", name: "Siswa 1", homeLatitude: -7.2575, homeLongitude: 112.7521 },
      { studentId: "s-2", name: "Siswa 2", homeLatitude: -7.2576, homeLongitude: 112.7522 },
      { studentId: "s-3", name: "Siswa 3", homeLatitude: -7.2577, homeLongitude: 112.7523 },
    ];

    const dudis = [
      {
        dudiId: "d-limited",
        name: "PT Kuota 1 Orang",
        latitude: -7.26,
        longitude: 112.752,
        remainingQuota: 1, // Only 1 slot!
        supportedCpJp: 792,
      },
      {
        dudiId: "d-backup",
        name: "PT Kuota Cadangan",
        latitude: -7.28,
        longitude: 112.75,
        remainingQuota: 5,
        supportedCpJp: 600,
      },
    ];

    const result = matchPlacementsGreedy(students, dudis, 792);

    expect(result.assigned.length).toBe(3);
    expect(result.unassigned.length).toBe(0);

    // First student gets the 1 slot at d-limited
    expect(result.assigned[0]?.dudiId).toBe("d-limited");
    // Next students fall back to d-backup because d-limited quota is exhausted
    expect(result.assigned[1]?.dudiId).toBe("d-backup");
    expect(result.assigned[2]?.dudiId).toBe("d-backup");
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

  it("generates Kurikulum Merdeka narrative descriptions accurately", () => {
    const narrative = generateEraporNarratives({
      studentName: "Ahmad Rizky",
      dudiName: "PT Inovasi Digital",
      topJobCardTitle: "Implementasi REST API & Microservices",
      topElementTitle: "Pemrograman Web & Mobile",
      lowestElementTitle: "Keamanan Sistem & Jaringan",
      lowestElementScore: 65,
    });

    expect(narrative.highestAchievement).toContain("Implementasi REST API & Microservices");
    expect(narrative.highestAchievement).toContain("PT Inovasi Digital");
    expect(narrative.highestAchievement).toContain("Pemrograman Web & Mobile");
    expect(narrative.needsImprovement).toContain("Keamanan Sistem & Jaringan");
    expect(narrative.needsImprovement).toContain("Perlu peningkatan jam praktik");
  });

  it("generates RFC-compliant e-Rapor CSV string with escaping", () => {
    const rows = [
      {
        nisn: "0012345678",
        studentName: 'Ahmad "Rizky", S.Kom',
        dudiName: "PT Teknologi, Inovasi",
        totalVerifiedJp: 792,
        finalGrade: 94.5,
        highestAchievement: "Kompeten dalam web development",
        needsImprovement: "Konsisten dan baik",
      },
    ];

    const csv = generateEraporCsv(rows);
    expect(csv).toContain("NISN,Nama_Siswa,Nama_Mitra_DUDI");
    expect(csv).toContain('"Ahmad ""Rizky"", S.Kom"'); // escaped quotes
    expect(csv).toContain('"PT Teknologi, Inovasi"'); // escaped comma
    expect(csv).toContain("94.5");
  });

  it("evaluates SOP mastery rubric according to industrial autonomy levels and consistency", () => {
    // 1. Observasi (Level 1)
    const obsRubric = calculateSopRubricScore([
      { durationJp: 8, autonomyLevel: 1 },
      { durationJp: 8, autonomyLevel: 1 },
    ]);
    expect(obsRubric.score).toBe(75);
    expect(obsRubric.predicate).toBe("Cukup");

    // 2. Terbimbing (Level 2)
    const terbimbingRubric = calculateSopRubricScore([
      { durationJp: 8, autonomyLevel: 2 },
      { durationJp: 8, autonomyLevel: 2 },
      { durationJp: 8, autonomyLevel: 2 },
    ]);
    expect(terbimbingRubric.score).toBe(84);
    expect(terbimbingRubric.predicate).toBe("Baik");

    // 3. Mandiri SOP (Level 3) konsisten (>= 3 kali validasi)
    const mandiriRubric = calculateSopRubricScore([
      { durationJp: 8, autonomyLevel: 3 },
      { durationJp: 8, autonomyLevel: 3 },
      { durationJp: 8, autonomyLevel: 3 },
    ]);
    expect(mandiriRubric.score).toBeGreaterThanOrEqual(92);
    expect(mandiriRubric.predicate).toBe("Sangat Baik");
  });

  it("calculates official 4 elements PKL grade accurately according to BSKAP standards", () => {
    const result = calculateOfficialFourElementsPklGrade({
      studentName: "Budi Santoso",
      dudiName: "PT Auto Mekanika",
      totalVerifiedHours: 600,
      attendanceDisciplinePercent: 98,
      mentorAttitudeScore: 92,
      technicalElementScores: [
        { title: "Tune-up Mesin Bensin & Diesel", score: 94, isAdvanced: false },
        { title: "Overhaul Transmisi Otomatis", score: 88, isAdvanced: true },
      ],
    });

    expect(result.elements.length).toBe(4);
    // Element 1: Soft Skills
    expect(result.elements[0]?.code).toBe("PKL-EL-01");
    expect(result.elements[0]?.title).toContain("Soft Skills");
    expect(result.elements[0]?.score).toBe(95); // 0.50*98 + 0.50*92 = 95

    // Element 2: Core Hard Skills
    expect(result.elements[1]?.code).toBe("PKL-EL-02");
    expect(result.elements[1]?.score).toBe(94);

    // Element 3: Advanced Hard Skills
    expect(result.elements[2]?.code).toBe("PKL-EL-03");
    expect(result.elements[2]?.score).toBe(88);

    // Element 4: Entrepreneurship
    expect(result.elements[3]?.code).toBe("PKL-EL-04");
    expect(result.elements[3]?.score).toBeGreaterThanOrEqual(85);

    // Final Grade weighted
    expect(result.finalGrade).toBeGreaterThanOrEqual(90);
    expect(result.highestAchievement).toContain("PT Auto Mekanika");
  });

  describe("Student Welfare Protection & Overwork Risk Detection (BR-013 & Permendikbudristek No. 50/2020)", () => {
    it("recognizes standard 40-hour work week as healthy (NONE)", () => {
      const logs = [
        { logDate: "2026-10-19", realHours: 8 },
        { logDate: "2026-10-20", realHours: 8 },
        { logDate: "2026-10-21", realHours: 8 },
        { logDate: "2026-10-22", realHours: 8 },
        { logDate: "2026-10-23", realHours: 8 },
      ];

      const res = detectStudentOverwork({
        studentName: "Aditya Pratama",
        logsLast7Days: logs,
      });

      expect(res.detected).toBe(false);
      expect(res.severity).toBe("NONE");
      expect(res.totalHours7Days).toBe(40);
      expect(res.overtimeDaysCount).toBe(0);
    });

    it("triggers WARNING when exceeding 40 hours or having 3 overtime days", () => {
      const logs = [
        { logDate: "2026-10-19", realHours: 9 },
        { logDate: "2026-10-20", realHours: 9 },
        { logDate: "2026-10-21", realHours: 9 },
        { logDate: "2026-10-22", realHours: 8 },
        { logDate: "2026-10-23", realHours: 8 },
      ];

      const res = detectStudentOverwork({
        studentName: "Dewi Lestari",
        logsLast7Days: logs,
      });

      expect(res.detected).toBe(true);
      expect(res.severity).toBe("WARNING");
      expect(res.totalHours7Days).toBe(43);
      expect(res.overtimeDaysCount).toBe(3);
      expect(res.alertTitle).toContain("Peringatan Beban Kerja");
      expect(res.alertMessage).toContain("Dewi Lestari");
    });

    it("triggers CRITICAL when total hours exceed 45 or 4 consecutive overtime days (exploitative risk)", () => {
      const logs = [
        { logDate: "2026-10-19", realHours: 10 },
        { logDate: "2026-10-20", realHours: 10 },
        { logDate: "2026-10-21", realHours: 10 },
        { logDate: "2026-10-22", realHours: 10 },
        { logDate: "2026-10-23", realHours: 8 },
      ];

      const res = detectStudentOverwork({
        studentName: "Rian Hidayat",
        logsLast7Days: logs,
      });

      expect(res.detected).toBe(true);
      expect(res.severity).toBe("CRITICAL");
      expect(res.totalHours7Days).toBe(48);
      expect(res.overtimeDaysCount).toBe(4);
      expect(res.consecutiveOvertimeDays).toBe(4);
      expect(res.alertTitle).toContain("Peringatan Kritis K3");
      expect(res.recommendedIntervention).toContain("WhatsApp");
    });

    it("evaluates comprehensive drift including student overwork alert", () => {
      const alerts = evaluateCompetencyDrift({
        nonCompetency: { totalJpLast14Days: 30, nonCompetencyJpLast14Days: 2 },
        skillMonotony: { daysSincePklStart: 10, totalCumulativeJp: 100, cpElementsJp: [{ elementId: "1", jp: 50 }, { elementId: "2", jp: 50 }] },
        approvalDormancy: { pendingLogs: [], currentDate: "2026-10-24" },
        studentOverwork: {
          logsLast7Days: [
            { logDate: "2026-10-19", realHours: 10 },
            { logDate: "2026-10-20", realHours: 10 },
            { logDate: "2026-10-21", realHours: 10 },
            { logDate: "2026-10-22", realHours: 10 },
            { logDate: "2026-10-23", realHours: 8 },
          ],
        },
      });

      expect(alerts).toContain("STUDENT_OVERWORK_HOURS");
    });
  });
});

