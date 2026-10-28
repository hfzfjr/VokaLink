import { describe, it, expect } from "vitest";
import { sanitizeErrorMessage, getFriendlyErrorTitle } from "./error-formatter";

describe("Frontend Error Sanitizer (IT Auditor / QA)", () => {
  it("sanitizes the exact raw Prisma error from the screenshot", () => {
    const rawError =
      "Invalid `prisma.school.findUnique()` invocation in D:\\CODING\\PROJECT\\vokalink\\apps\\api\\src\\routes\\erapor.ts:55:42 52 const isCsv = format === \"csv\"; 53 54 // 1. Ambil data sekolah -> 55 const school = await prisma.school.findUnique( Can't reach database server at 'aws-0-ap-southeast-1.pooler.supabase.com:6543' Please make sure your database server is running at 'aws-0-ap-southeast-1.pooler.supabase.com:6543'.";

    const clean = sanitizeErrorMessage(rawError);
    expect(clean).toBe(
      "Layanan basis data sedang tidak dapat dihubungi. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi."
    );
    expect(clean).not.toContain("prisma");
    expect(clean).not.toContain("aws-0-ap-southeast-1");
    expect(clean).not.toContain("D:\\CODING");
  });

  it("sanitizes network failures and Failed to fetch", () => {
    const err = new Error("TypeError: Failed to fetch");
    const clean = sanitizeErrorMessage(err);
    expect(clean).toBe(
      "Tidak dapat terhubung ke server VokaLink. Pastikan koneksi internet aktif dan server sedang berjalan."
    );
  });

  it("sanitizes unhandled syntax or runtime errors", () => {
    const err = new Error("SyntaxError: Unexpected token < in JSON at position 0");
    const clean = sanitizeErrorMessage(err);
    expect(clean).toBe(
      "Terjadi kendala pemrosesan data pada aplikasi. Silakan muat ulang halaman."
    );
  });

  it("sanitizes disk paths and stack traces", () => {
    const raw = "Error occurred at D:\\CODING\\PROJECT\\vokalink\\apps\\web\\src\\app\\page.tsx:42:10";
    const clean = sanitizeErrorMessage(raw, "Gagal memuat halaman");
    expect(clean).toBe("Gagal memuat halaman");
  });

  it("preserves clean user-facing Indonesian validation/business messages", () => {
    const msg = "Email resmi, NIP, atau NISN siswa wajib diisi.";
    const clean = sanitizeErrorMessage(msg);
    expect(clean).toBe(msg);

    const pinMsg = "Percobaan PIN salah telah mencapai batas 5 kali. Akses verifikasi terkunci selama 15 menit.";
    expect(sanitizeErrorMessage(pinMsg)).toBe(pinMsg);
  });

  it("returns appropriate friendly titles", () => {
    expect(getFriendlyErrorTitle("prisma.school.findUnique failed")).toBe("Koneksi Basis Data Gagal");
    expect(getFriendlyErrorTitle("Failed to fetch")).toBe("Tidak Dapat Terhubung");
    expect(getFriendlyErrorTitle("VALIDATION_ERROR")).toBe("Validasi Formulir Gagal");
  });
});
