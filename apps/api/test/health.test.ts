import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("Health API Endpoints", () => {
  const app = createApp();

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

  it("GET /readyz returns 200 ready connected to Supabase", async () => {
    const res = await request(app).get("/readyz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
    expect(res.body.service).toBe("vokalink-api");
  });
});
