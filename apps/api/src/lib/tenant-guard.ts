import { prisma } from "./prisma.js";
import type { UserRole } from "@vokalink/shared";

export interface SessionContext {
  userId: string;
  schoolId: string;
  role: UserRole;
}

/**
 * Pure tenant scope filter builder.
 * Guarantees that where-clauses injected into Prisma queries comply with multi-tenant isolation rules.
 */
export function applyTenantScope<T extends Record<string, unknown> | undefined>(
  model: "userProfile" | "schoolDepartment" | "academicPeriod" | "placement" | "dailyLog",
  ctx: SessionContext,
  where?: T
): Record<string, unknown> {
  const baseWhere = (where ?? {}) as Record<string, unknown>;

  switch (model) {
    case "schoolDepartment":
    case "academicPeriod":
      return {
        ...baseWhere,
        schoolId: ctx.schoolId,
      };

    case "userProfile":
      if (ctx.role === "STUDENT") {
        return {
          ...baseWhere,
          id: ctx.userId,
          schoolId: ctx.schoolId,
        };
      }
      return {
        ...baseWhere,
        schoolId: ctx.schoolId,
      };

    case "placement":
      if (ctx.role === "STUDENT") {
        return {
          ...baseWhere,
          studentId: ctx.userId,
        };
      }
      if (ctx.role === "TEACHER") {
        return {
          ...baseWhere,
          teacherId: ctx.userId,
        };
      }
      // SCHOOL_ADMIN: scope to students of this school
      return {
        ...baseWhere,
        student: {
          ...(typeof baseWhere["student"] === "object" ? baseWhere["student"] : {}),
          schoolId: ctx.schoolId,
        },
      };

    case "dailyLog":
      if (ctx.role === "STUDENT") {
        return {
          ...baseWhere,
          placement: {
            ...(typeof baseWhere["placement"] === "object" ? baseWhere["placement"] : {}),
            studentId: ctx.userId,
          },
        };
      }
      if (ctx.role === "TEACHER") {
        return {
          ...baseWhere,
          placement: {
            ...(typeof baseWhere["placement"] === "object" ? baseWhere["placement"] : {}),
            teacherId: ctx.userId,
          },
        };
      }
      // SCHOOL_ADMIN: scope to student's school
      return {
        ...baseWhere,
        placement: {
          ...(typeof baseWhere["placement"] === "object" ? baseWhere["placement"] : {}),
          student: {
            schoolId: ctx.schoolId,
          },
        },
      };

    default:
      return baseWhere;
  }
}

/**
 * Tenant Guard Prisma Client Extension
 * Enforces multi-tenant data isolation at the ORM layer.
 *
 * Rules:
 * - Every school query automatically filters by schoolId
 * - Students can only query their own records (placements, logs)
 * - Teachers are scoped to their assigned students/placements
 * - Federated exception: dudi_partners basic profile is shared across schools (BR-011)
 *
 * Reference: docs/DESIGN.md Section 4.2 & PRD BR-011
 */
export function createTenantPrisma(ctx: SessionContext) {
  return prisma.$extends({
    name: "tenantGuard",
    query: {
      schoolDepartment: {
        async findMany({ args, query }) {
          args.where = applyTenantScope("schoolDepartment", ctx, args.where);
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = applyTenantScope("schoolDepartment", ctx, args.where);
          return query(args);
        },
        async count({ args, query }) {
          args.where = applyTenantScope("schoolDepartment", ctx, args.where);
          return query(args);
        },
      },

      academicPeriod: {
        async findMany({ args, query }) {
          args.where = applyTenantScope("academicPeriod", ctx, args.where);
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = applyTenantScope("academicPeriod", ctx, args.where);
          return query(args);
        },
        async count({ args, query }) {
          args.where = applyTenantScope("academicPeriod", ctx, args.where);
          return query(args);
        },
      },

      userProfile: {
        async findMany({ args, query }) {
          args.where = applyTenantScope("userProfile", ctx, args.where);
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = applyTenantScope("userProfile", ctx, args.where);
          return query(args);
        },
        async count({ args, query }) {
          args.where = applyTenantScope("userProfile", ctx, args.where);
          return query(args);
        },
      },

      placement: {
        async findMany({ args, query }) {
          args.where = applyTenantScope("placement", ctx, args.where);
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = applyTenantScope("placement", ctx, args.where);
          return query(args);
        },
        async count({ args, query }) {
          args.where = applyTenantScope("placement", ctx, args.where);
          return query(args);
        },
      },

      dailyLog: {
        async findMany({ args, query }) {
          args.where = applyTenantScope("dailyLog", ctx, args.where);
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = applyTenantScope("dailyLog", ctx, args.where);
          return query(args);
        },
        async count({ args, query }) {
          args.where = applyTenantScope("dailyLog", ctx, args.where);
          return query(args);
        },
      },
    },
  });
}
