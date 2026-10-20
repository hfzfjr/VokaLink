import { describe, it, expect } from "vitest";
import { applyTenantScope, createTenantPrisma } from "../src/lib/tenant-guard.js";

const VALID_STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const VALID_SCHOOL_ID = "22222222-2222-4222-8222-222222222222";
const VALID_TEACHER_ID = "33333333-3333-4333-8333-333333333333";
const VALID_ADMIN_ID = "44444444-4444-4444-8444-444444444444";

describe("Tenant Guard - applyTenantScope", () => {
  it("scopes userProfile queries for STUDENT strictly to own id and schoolId", () => {
    const where = applyTenantScope("userProfile", {
      userId: VALID_STUDENT_ID,
      schoolId: VALID_SCHOOL_ID,
      role: "STUDENT",
    }, { fullName: { contains: "Budi" } });

    expect(where).toEqual({
      fullName: { contains: "Budi" },
      id: VALID_STUDENT_ID,
      schoolId: VALID_SCHOOL_ID,
    });
  });

  it("scopes userProfile queries for SCHOOL_ADMIN to entire school", () => {
    const where = applyTenantScope("userProfile", {
      userId: VALID_ADMIN_ID,
      schoolId: VALID_SCHOOL_ID,
      role: "SCHOOL_ADMIN",
    });

    expect(where).toEqual({
      schoolId: VALID_SCHOOL_ID,
    });
  });

  it("scopes placement queries for TEACHER to assigned teacherId", () => {
    const where = applyTenantScope("placement", {
      userId: VALID_TEACHER_ID,
      schoolId: VALID_SCHOOL_ID,
      role: "TEACHER",
    }, { status: "ACTIVE" });

    expect(where).toEqual({
      status: "ACTIVE",
      teacherId: VALID_TEACHER_ID,
    });
  });

  it("scopes placement queries for STUDENT to studentId", () => {
    const where = applyTenantScope("placement", {
      userId: VALID_STUDENT_ID,
      schoolId: VALID_SCHOOL_ID,
      role: "STUDENT",
    });

    expect(where).toEqual({
      studentId: VALID_STUDENT_ID,
    });
  });

  it("scopes academicPeriod queries to schoolId", () => {
    const where = applyTenantScope("academicPeriod", {
      userId: VALID_ADMIN_ID,
      schoolId: VALID_SCHOOL_ID,
      role: "SCHOOL_ADMIN",
    }, { isActive: true });

    expect(where).toEqual({
      isActive: true,
      schoolId: VALID_SCHOOL_ID,
    });
  });

  it("scopes dailyLog queries for STUDENT to placement.studentId", () => {
    const where = applyTenantScope("dailyLog", {
      userId: VALID_STUDENT_ID,
      schoolId: VALID_SCHOOL_ID,
      role: "STUDENT",
    }, { status: "SUBMITTED" });

    expect(where).toEqual({
      status: "SUBMITTED",
      placement: {
        studentId: VALID_STUDENT_ID,
      },
    });
  });

  it("creates extended Prisma client instance with tenantGuard extension name", () => {
    const client = createTenantPrisma({
      userId: VALID_STUDENT_ID,
      schoolId: VALID_SCHOOL_ID,
      role: "STUDENT",
    });

    expect(client).toBeDefined();
    expect(typeof client.userProfile.findMany).toBe("function");
  });
});
