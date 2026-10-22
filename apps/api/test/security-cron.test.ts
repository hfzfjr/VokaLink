import { describe, it, expect, vi } from "vitest";
import { zeroLoginRateLimiter } from "../src/middlewares/rate-limiter.js";
import { initNightlyDriftCron } from "../src/services/drift-cron.js";
import { evaluateDriftForAllPlacements } from "../src/services/drift-evaluator.js";

describe("Security & Cron Services (Orang C Hardening)", () => {
  it("zeroLoginRateLimiter is properly configured as an express middleware", () => {
    expect(zeroLoginRateLimiter).toBeDefined();
    expect(typeof zeroLoginRateLimiter).toBe("function");
  });

  it("initNightlyDriftCron skips scheduling in test environment to avoid lingering handles", () => {
    const task = initNightlyDriftCron();
    expect(task).toBeNull();
  });

  it("evaluateDriftForAllPlacements completes and returns structured evaluation metrics", async () => {
    const result = await evaluateDriftForAllPlacements();
    expect(result).toBeDefined();
    expect(result.evaluatedCount).toBeGreaterThanOrEqual(0);
    expect(result.activeAlertsCreatedOrUpdated).toBeGreaterThanOrEqual(0);
  });
});
