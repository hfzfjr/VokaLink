import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { validateBackdate, validateImageMagicBytes } from "../src/routes/logs.js";

// Mock Prisma
vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    dailyLog: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    placement: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  createTenantPrisma: vi.fn(),
}));

describe("Log Sync & Validation Engine (FR-005, FR-006 & DESIGN.md §7.3)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit: validateBackdate (BR-003)", () => {
    it("menerima tanggal hari ini", () => {
      const today = new Date().toISOString().split("T")[0]!;
      const res = validateBackdate(today);
      expect(res.isValid).toBe(true);
      expect(res.clockSkew).toBe(false);
    });

    it("menerima tanggal H-2", () => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      const hMinus2 = d.toISOString().split("T")[0]!;
      const res = validateBackdate(hMinus2);
      expect(res.isValid).toBe(true);
    });

    it("menolak tanggal di masa depan (diff < 0)", () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      const future = d.toISOString().split("T")[0]!;
      const res = validateBackdate(future);
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("masa depan");
    });

    it("menolak tanggal melebihi batas maksimal H-3", () => {
      const d = new Date();
      d.setDate(d.getDate() - 5);
      const hMinus5 = d.toISOString().split("T")[0]!;
      const res = validateBackdate(hMinus5);
      expect(res.isValid).toBe(false);
      expect(res.message).toContain("H-3");
    });

    it("mendeteksi clock skew bila waktu klien mendahului server > 5 menit", () => {
      const today = new Date().toISOString().split("T")[0]!;
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // +10 menit
      const res = validateBackdate(today, futureTime);
      expect(res.clockSkew).toBe(true);
    });
  });

  describe("Unit: validateImageMagicBytes", () => {
    it("mengenali biner format WebP", () => {
      // Header WebP: 'RIFF' + 4 bytes size + 'WEBP'
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      const res = validateImageMagicBytes(webpBuffer);
      expect(res.isValid).toBe(true);
      expect(res.mimeType).toBe("image/webp");
    });

    it("mengenali biner format JPEG", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const res = validateImageMagicBytes(jpegBuffer);
      expect(res.isValid).toBe(true);
      expect(res.mimeType).toBe("image/jpeg");
    });

    it("menolak biner yang bukan gambar (contoh teks plain)", () => {
      const textBuffer = Buffer.from("Hello world, this is not an image");
      const res = validateImageMagicBytes(textBuffer);
      expect(res.isValid).toBe(false);
    });
  });

  describe("Integration: POST /api/v1/logs/sync (Fase 1 Batch Sync)", () => {
    it("menolak payload bila batch lebih dari 20 log (DESIGN.md §7.3)", async () => {
      const logs = Array.from({ length: 21 }, () => ({
        clientLogUuid: crypto.randomUUID(),
        placementId: crypto.randomUUID(),
        logDate: "2026-10-21",
        attendanceType: "PRESENT",
        items: [
          {
            jobCardId: crypto.randomUUID(),
            durationJp: 8,
            autonomyLevel: 3,
          },
        ],
      }));

      const res = await request(app).post("/api/v1/logs/sync").send({ logs });
      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("menolak log jika durasi harian melebihi 12 JP (BR-002)", async () => {
      const logs = [
        {
          clientLogUuid: crypto.randomUUID(),
          placementId: crypto.randomUUID(),
          logDate: "2026-10-21",
          attendanceType: "PRESENT",
          items: [
            {
              jobCardId: crypto.randomUUID(),
              durationJp: 14, // > 12 JP
              autonomyLevel: 3,
            },
          ],
        },
      ];

      const res = await request(app).post("/api/v1/logs/sync").send({ logs });
      expect(res.status).toBe(422);
    });

    it("memproses log baru dan mengembalikan status accepted", async () => {
      const clientUuid = crypto.randomUUID();
      const placementUuid = crypto.randomUUID();
      const today = new Date().toISOString().split("T")[0]!;

      // Mock database calls
      vi.mocked(prisma.dailyLog.findUnique).mockResolvedValueOnce(null); // not existing yet
      vi.mocked(prisma.placement.findUnique).mockResolvedValueOnce({
        id: placementUuid,
        studentId: crypto.randomUUID(),
        status: "ACTIVE",
      } as any);
      vi.mocked(prisma.dailyLog.findFirst).mockResolvedValueOnce(null); // no duplicate date
      vi.mocked(prisma.$transaction).mockResolvedValueOnce({ id: "server-log-123" } as any);

      const logs = [
        {
          clientLogUuid: clientUuid,
          placementId: placementUuid,
          logDate: today,
          attendanceType: "PRESENT",
          shortNote: "Pengerjaan router Express",
          items: [
            {
              jobCardId: crypto.randomUUID(),
              durationJp: 8,
              autonomyLevel: 3,
            },
          ],
        },
      ];

      const res = await request(app).post("/api/v1/logs/sync").send({ logs });
      expect(res.status).toBe(200);
      expect(res.body.acceptedCount).toBe(1);
      expect(res.body.results[0].status).toBe("accepted");
      expect(res.body.results[0].serverLogId).toBe("server-log-123");
    });

    it("mengembalikan status duplicate secara idempoten jika clientLogUuid sudah ada", async () => {
      const clientUuid = crypto.randomUUID();
      const placementUuid = crypto.randomUUID();
      const today = new Date().toISOString().split("T")[0]!;

      // Mock log already exists
      vi.mocked(prisma.dailyLog.findUnique).mockResolvedValueOnce({
        id: "existing-log-id",
        status: "PENDING_VERIFICATION",
      } as any);

      const logs = [
        {
          clientLogUuid: clientUuid,
          placementId: placementUuid,
          logDate: today,
          attendanceType: "PRESENT",
          items: [
            {
              jobCardId: crypto.randomUUID(),
              durationJp: 8,
              autonomyLevel: 3,
            },
          ],
        },
      ];

      const res = await request(app).post("/api/v1/logs/sync").send({ logs });
      expect(res.status).toBe(200);
      expect(res.body.duplicateCount).toBe(1);
      expect(res.body.results[0].status).toBe("duplicate");
      expect(res.body.results[0].serverLogId).toBe("existing-log-id");
    });
  });

  describe("Integration: PUT /api/v1/logs/:clientLogUuid/evidence (Fase 2)", () => {
    it("menolak unggahan bukti jika ukuran melebihi 150 KB (DESIGN.md §7.1)", async () => {
      const largeBuffer = Buffer.alloc(160 * 1024, 0); // 160 KB
      const res = await request(app)
        .put("/api/v1/logs/00000000-0000-0000-0000-000000000001/evidence")
        .set("Content-Type", "image/webp")
        .send(largeBuffer);

      expect(res.status).toBe(413);
      expect(res.body.code).toBe("FILE_TOO_LARGE");
    });

    it("menolak jika checksum SHA-256 tidak cocok dengan header X-Content-SHA256", async () => {
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x01, 0x02,
      ]);

      const res = await request(app)
        .put("/api/v1/logs/00000000-0000-0000-0000-000000000001/evidence")
        .set("Content-Type", "image/webp")
        .set("X-Content-SHA256", "0000000000000000000000000000000000000000000000000000000000000000") // Salah
        .send(webpBuffer);

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("SHA256_MISMATCH");
    });

    it("menerima bukti WebP valid dengan header SHA-256 yang cocok", async () => {
      const clientUuid = crypto.randomUUID();
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x01, 0x02,
      ]);
      const validSha256 = crypto.createHash("sha256").update(webpBuffer).digest("hex");

      vi.mocked(prisma.dailyLog.findUnique).mockResolvedValueOnce({
        id: "log-123",
        status: "PENDING_VERIFICATION",
        studentId: "student-1",
      } as any);

      vi.mocked(prisma.dailyLog.update).mockResolvedValueOnce({} as any);

      const res = await request(app)
        .put(`/api/v1/logs/${clientUuid}/evidence`)
        .set("Content-Type", "image/webp")
        .set("X-Content-SHA256", validSha256)
        .send(webpBuffer);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.evidenceSha256).toBe(validSha256);
      expect(res.body.mimeType).toBe("image/webp");
    });

    it("menolak unggahan foto jika hash identik dengan foto logbook sebelumnya (anti-fraud duplikasi)", async () => {
      const clientUuid = crypto.randomUUID();
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x01,
      ]);
      const validSha256 = crypto.createHash("sha256").update(webpBuffer).digest("hex");

      vi.mocked(prisma.dailyLog.findUnique).mockResolvedValueOnce({
        id: "log-123",
        status: "PENDING_VERIFICATION",
        studentId: "student-1",
      } as any);

      vi.mocked(prisma.dailyLog.findFirst).mockResolvedValueOnce({
        id: "log-old-456",
        logDate: new Date("2026-10-18"),
      } as any);

      const res = await request(app)
        .put(`/api/v1/logs/${clientUuid}/evidence`)
        .set("Content-Type", "image/webp")
        .set("X-Content-SHA256", validSha256)
        .send(webpBuffer);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DUPLICATE_PHOTO");
      expect(res.body.detail).toContain("sudah pernah diunggah");
    });

    it("menerima batch sync multi-job card dengan alokasi durasi yang valid", async () => {
      const clientUuid = crypto.randomUUID();
      const placementUuid = crypto.randomUUID();
      const today = new Date().toISOString().split("T")[0]!;

      vi.mocked(prisma.dailyLog.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.placement.findUnique).mockResolvedValueOnce({
        id: placementUuid,
        studentId: crypto.randomUUID(),
        status: "ACTIVE",
      } as any);
      vi.mocked(prisma.dailyLog.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.$transaction).mockResolvedValueOnce({ id: "server-log-456" } as any);

      const res = await request(app)
        .post("/api/v1/logs/sync")
        .send({
          logs: [
            {
              clientLogUuid: clientUuid,
              placementId: placementUuid,
              logDate: today,
              attendanceType: "PRESENT",
              items: [
                {
                  jobCardId: crypto.randomUUID(),
                  durationJp: 4,
                  autonomyLevel: 3,
                },
                {
                  jobCardId: crypto.randomUUID(),
                  durationJp: 4,
                  autonomyLevel: 2,
                },
              ],
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.acceptedCount).toBe(1);
      expect(res.body.results[0].status).toBe("accepted");
    });
  });
});
