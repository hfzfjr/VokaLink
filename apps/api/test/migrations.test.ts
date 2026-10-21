import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Database Migrations & Security Guards Audit (BUG-001)", () => {
  const migrationsDir = path.resolve(__dirname, "../prisma/migrations");
  const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");

  it("verifies Prisma DailyLog model uses verified_by_mentor_id and not mentor_id", () => {
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    // DailyLog should define verifiedByMentorId with @map("verified_by_mentor_id")
    expect(schemaContent).toContain('verifiedByMentorId String?        @map("verified_by_mentor_id")');

    // DailyLog should NOT have a raw mentor_id field
    const dailyLogModelMatch = schemaContent.match(/model DailyLog \{([^}]+)\}/s);
    expect(dailyLogModelMatch).toBeTruthy();
    const dailyLogFields = dailyLogModelMatch![1];
    expect(dailyLogFields).not.toMatch(/@map\("mentor_id"\)/);
    expect(dailyLogFields).toMatch(/@map\("verified_by_mentor_id"\)/);
  });

  it("ensures the latest block_verified_log_update trigger references verified_by_mentor_id", () => {
    const fixMigrationPath = path.join(
      migrationsDir,
      "20261021183000_fix_verified_log_immutable_trigger/migration.sql"
    );

    expect(fs.existsSync(fixMigrationPath)).toBe(true);

    const migrationSql = fs.readFileSync(fixMigrationPath, "utf-8");

    // Function must be replaced
    expect(migrationSql).toContain("CREATE OR REPLACE FUNCTION block_verified_log_update()");

    // Must correctly check verified_by_mentor_id
    expect(migrationSql).toContain("NEW.verified_by_mentor_id IS DISTINCT FROM OLD.verified_by_mentor_id");

    // Must NOT contain the buggy typo NEW.mentor_id
    expect(migrationSql).not.toContain("NEW.mentor_id");

    // Must enforce immutability exception
    expect(migrationSql).toContain("RAISE EXCEPTION 'verified log is immutable'");
  });

  it("verifies that all daily_logs immutable triggers are defined", () => {
    const securityGuardsPath = path.join(
      migrationsDir,
      "20261020192102_security_guards/migration.sql"
    );
    const sql = fs.readFileSync(securityGuardsPath, "utf-8");

    expect(sql).toContain("CREATE TRIGGER trg_daily_logs_immutable");
    expect(sql).toContain("CREATE TRIGGER trg_daily_logs_no_delete");
    expect(sql).toContain("CREATE TRIGGER trg_daily_log_items_immutable");
  });
});
