import { describe, it, expect, vi } from "vitest";
import { errorHandler, AppError } from "../src/middlewares/error-handler.js";
import type { Request, Response } from "express";

function createMockReqRes() {
  const req = {
    path: "/api/schools/123/erapor",
    originalUrl: "/api/schools/123/erapor",
    method: "GET",
  } as unknown as Request;

  let responseStatus = 200;
  let responseData: any = null;

  const res = {
    status: vi.fn((code: number) => {
      responseStatus = code;
      return res;
    }),
    contentType: vi.fn(() => res),
    json: vi.fn((data: any) => {
      responseData = data;
      return res;
    }),
  } as unknown as Response;

  return { req, res, getStatus: () => responseStatus, getData: () => responseData };
}

describe("RFC 7807 Error Handler Sanitization (IT Auditor / QA)", () => {
  it("sanitizes raw Prisma database connection errors (P1001/PrismaClientInitializationError) without leaking pooler host or local disk paths", () => {
    const { req, res, getStatus, getData } = createMockReqRes();

    const rawPrismaError = new Error(
      "Invalid `prisma.school.findUnique()` invocation in D:\\CODING\\PROJECT\\vokalink\\apps\\api\\src\\routes\\erapor.ts:55:42\n" +
        "Can't reach database server at 'aws-0-ap-southeast-1.pooler.supabase.com:6543'\n" +
        "Please make sure your database server is running at 'aws-0-ap-southeast-1.pooler.supabase.com:6543'."
    );
    rawPrismaError.name = "PrismaClientInitializationError";

    errorHandler(rawPrismaError, req, res, vi.fn());

    expect(getStatus()).toBe(503);
    const body = getData();
    expect(body.code).toBe("DATABASE_CONNECTION_ERROR");
    expect(body.title).toBe("Layanan Basis Data Tidak Dapat Dihubungi");
    expect(body.detail).toBe(
      "Sistem tidak dapat terhubung ke server basis data. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi."
    );
    expect(body.detail).not.toContain("aws-0-ap-southeast-1");
    expect(body.detail).not.toContain("D:\\CODING");
    expect(body.detail).not.toContain("prisma.school");
  });

  it("handles Prisma P2002 unique constraint conflict cleanly", () => {
    const { req, res, getStatus, getData } = createMockReqRes();

    const p2002 = new Error("Unique constraint failed on the fields: (`npsn`)") as any;
    p2002.name = "PrismaClientKnownRequestError";
    p2002.code = "P2002";
    p2002.meta = { target: ["npsn"] };

    errorHandler(p2002, req, res, vi.fn());

    expect(getStatus()).toBe(409);
    const body = getData();
    expect(body.code).toBe("DATA_CONFLICT");
    expect(body.detail).toContain("sudah terdaftar dalam sistem");
  });

  it("handles Prisma P2025 record not found cleanly", () => {
    const { req, res, getStatus, getData } = createMockReqRes();

    const p2025 = new Error("An operation failed because it depends on one or more records that were required but not found") as any;
    p2025.name = "PrismaClientKnownRequestError";
    p2025.code = "P2025";

    errorHandler(p2025, req, res, vi.fn());

    expect(getStatus()).toBe(404);
    const body = getData();
    expect(body.code).toBe("NOT_FOUND");
    expect(body.detail).toBe("Data yang diminta tidak ditemukan dalam sistem database.");
  });

  it("sanitizes unhandled 500 errors and never leaks stack traces or file paths in the HTTP response", () => {
    const { req, res, getStatus, getData } = createMockReqRes();

    const internalError = new Error("TypeError: Cannot read properties of undefined at D:\\CODING\\PROJECT\\vokalink\\apps\\api\\src\\index.ts:12");

    errorHandler(internalError, req, res, vi.fn());

    expect(getStatus()).toBe(500);
    const body = getData();
    expect(body.code).toBe("INTERNAL_SERVER_ERROR");
    expect(body.detail).toBe(
      "Terjadi kendala pada server saat memproses permintaan. Silakan coba beberapa saat lagi."
    );
    expect(body.detail).not.toContain("D:\\CODING");
    expect(body.detail).not.toContain("TypeError");
  });

  it("preserves safe AppError messages while sanitizing any unintended system path leaks", () => {
    const { req, res, getStatus, getData } = createMockReqRes();

    const safeAppError = new AppError("PIN mentor salah 5 kali. Akses dikunci 15 menit.", 423, "PIN_LOCKOUT");
    errorHandler(safeAppError, req, res, vi.fn());

    expect(getStatus()).toBe(423);
    const body = getData();
    expect(body.code).toBe("PIN_LOCKOUT");
    expect(body.detail).toBe("PIN mentor salah 5 kali. Akses dikunci 15 menit.");

    // Leaky AppError
    const leakyAppError = new AppError("Error in D:\\CODING\\secret.key", 400, "BAD_REQUEST");
    const { req: req2, res: res2, getStatus: getStatus2, getData: getData2 } = createMockReqRes();
    errorHandler(leakyAppError, req2, res2, vi.fn());
    expect(getStatus2()).toBe(400);
    expect(getData2().detail).toBe("Terjadi kendala saat memproses permintaan Anda.");
  });
});
