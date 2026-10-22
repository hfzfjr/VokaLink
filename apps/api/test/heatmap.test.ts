import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("FR-008: Live Competency Heatmap & Drift Alert Engine", () => {
  it("GET /api/v1/teachers/heatmap returns 200 with structured class CP matrix", async () => {
    const res = await request(app).get("/api/v1/teachers/heatmap");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("department");
    expect(res.body.department.targetTotalJp).toBe(792);
    expect(res.body).toHaveProperty("cpElements");
    expect(Array.isArray(res.body.cpElements)).toBe(true);
    expect(res.body.cpElements.length).toBeGreaterThanOrEqual(4);

    expect(res.body).toHaveProperty("students");
    expect(Array.isArray(res.body.students)).toBe(true);
    expect(res.body.students.length).toBeGreaterThanOrEqual(1);

    expect(res.body).toHaveProperty("summary");
    expect(res.body.summary).toHaveProperty("totalStudents");
    expect(res.body.summary).toHaveProperty("studentsWithDrift");
    expect(res.body.summary).toHaveProperty("averageCompetencyPercentage");
  });

  it("calculates accurate CP progress status: NOT_STARTED, IN_PROGRESS, ACHIEVED", async () => {
    const res = await request(app).get("/api/v1/teachers/heatmap");
    expect(res.status).toBe(200);

    const andi = res.body.students.find((s: any) => s.fullName === "Andi Pratama");
    expect(andi).toBeDefined();

    // Andi memiliki 78% di RPL-CP-01 -> ACHIEVED
    const cp1 = andi.cpProgress.find((cp: any) => cp.code === "RPL-CP-01");
    expect(cp1).toBeDefined();
    expect(cp1.percentage).toBeGreaterThanOrEqual(75);
    expect(cp1.status).toBe("ACHIEVED");

    // Andi memiliki 55% di RPL-CP-02 -> IN_PROGRESS
    const cp2 = andi.cpProgress.find((cp: any) => cp.code === "RPL-CP-02");
    expect(cp2).toBeDefined();
    expect(cp2.percentage).toBeGreaterThan(0);
    expect(cp2.percentage).toBeLessThan(75);
    expect(cp2.status).toBe("IN_PROGRESS");

    // Andi memiliki 0% di RPL-CP-04 -> NOT_STARTED
    const cp4 = andi.cpProgress.find((cp: any) => cp.code === "RPL-CP-04");
    expect(cp4).toBeDefined();
    expect(cp4.percentage).toBe(0);
    expect(cp4.status).toBe("NOT_STARTED");
  });

  it("TC-008: detects NON_COMPETENCY_OVERLOAD alert for student with >30% non-competency tasks", async () => {
    const res = await request(app).get("/api/v1/teachers/heatmap");
    expect(res.status).toBe(200);

    const bintang = res.body.students.find((s: any) => s.fullName === "Bintang Ramadhan");
    expect(bintang).toBeDefined();
    expect(bintang.hasDriftWarning).toBe(true);

    const overloadAlert = bintang.driftAlerts.find(
      (a: any) => a.alertType === "NON_COMPETENCY_OVERLOAD"
    );
    expect(overloadAlert).toBeDefined();
    expect(overloadAlert.severity).toBe("CRITICAL");
    expect(overloadAlert.metricSnapshot.ratio).toBeGreaterThan(0.3);
  });

  it("detects SKILL_MONOTONY when student accumulated >=90 JP with >80% on 1 CP and others at 0%", async () => {
    const res = await request(app).get("/api/v1/teachers/heatmap");
    expect(res.status).toBe(200);

    const citra = res.body.students.find((s: any) => s.fullName === "Citra Maharani");
    expect(citra).toBeDefined();
    expect(citra.hasDriftWarning).toBe(true);

    const monotonyAlert = citra.driftAlerts.find(
      (a: any) => a.alertType === "SKILL_MONOTONY"
    );
    expect(monotonyAlert).toBeDefined();
    expect(monotonyAlert.metricSnapshot.dominantRatio).toBeGreaterThanOrEqual(0.8);
  });

  it("detects APPROVAL_DORMANCY for student with >=5 pending logs older than 7 days", async () => {
    const res = await request(app).get("/api/v1/teachers/heatmap");
    expect(res.status).toBe(200);

    const dewi = res.body.students.find((s: any) => s.fullName === "Dewi Anggraini");
    expect(dewi).toBeDefined();
    expect(dewi.hasDriftWarning).toBe(true);

    const dormancyAlert = dewi.driftAlerts.find(
      (a: any) => a.alertType === "APPROVAL_DORMANCY"
    );
    expect(dormancyAlert).toBeDefined();
    expect(dormancyAlert.metricSnapshot.dormantLogCount).toBeGreaterThanOrEqual(5);
  });

  it("filters heatmap with ?driftOnly=true to show only students with active anomalies", async () => {
    const res = await request(app).get("/api/v1/teachers/heatmap?driftOnly=true");
    expect(res.status).toBe(200);

    // Semua siswa dalam hasil harus memiliki hasDriftWarning = true
    for (const student of res.body.students) {
      expect(student.hasDriftWarning).toBe(true);
      expect(student.driftAlerts.length).toBeGreaterThan(0);
    }

    // Andi tidak boleh ada di daftar ini karena tidak mengalami drift
    const andi = res.body.students.find((s: any) => s.fullName === "Andi Pratama");
    expect(andi).toBeUndefined();
  });

  it("filters heatmap by dudiId", async () => {
    const res = await request(app).get("/api/v1/teachers/heatmap?dudiId=dudi-1");
    expect(res.status).toBe(200);

    for (const student of res.body.students) {
      expect(student.placement.dudiId).toBe("dudi-1");
    }
  });

  it("GET /api/v1/teachers/drift-alerts returns sorted alerts by severity", async () => {
    const res = await request(app).get("/api/v1/teachers/drift-alerts");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("alerts");
    expect(Array.isArray(res.body.alerts)).toBe(true);
    expect(res.body.alerts.length).toBeGreaterThanOrEqual(3);

    // Urutan prioritas tertinggi harus NON_COMPETENCY_OVERLOAD
    expect(res.body.alerts[0].alertType).toBe("NON_COMPETENCY_OVERLOAD");
  });

  it("POST /api/v1/teachers/drift-alerts/evaluate triggers on-demand evaluation", async () => {
    const res = await request(app).post("/api/v1/teachers/drift-alerts/evaluate");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("evaluatedCount");
    expect(res.body).toHaveProperty("activeAlertsCreatedOrUpdated");
  });
});
