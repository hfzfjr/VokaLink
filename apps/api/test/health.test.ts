import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Mock prisma queryRaw to test DB readiness independently of network
vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe("Health API Endpoints", () => {
  const app = createApp();

  beforeEach(() => {
    process.env["DATABASE_URL"] = "postgresql://mock:5432/test";
    vi.clearAllMocks();
  });

  it("GET / returns 200 with service info", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("VokaLink API");
    expect(res.body.status).toBe("running");
  });

  it("GET /healthz returns 200 ok", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("vokalink-api");
  });

  it("GET /readyz returns 200 when database connection succeeds", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }]);

    const res = await request(app).get("/readyz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
    expect(res.body.service).toBe("vokalink-api");
  });

  it("GET /readyz returns 503 when database query fails", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("Connection refused"));

    const res = await request(app).get("/readyz");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("not_ready");
    expect(res.body.error).toContain("Connection refused");
  });
});
