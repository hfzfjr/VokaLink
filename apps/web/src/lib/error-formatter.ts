/**
 * Utility Sanitasi & Formatter Pesan Error Aplikasi VokaLink
 * Mencegah eksposur stack trace internal, file path OS, database pooler,
 * dan mengubah technical errors menjadi pesan ramah pengguna (human-friendly).
 */

import type { ProblemDetails } from "@vokalink/shared";

export function sanitizeErrorMessage(
  err: unknown,
  fallbackMessage = "Terjadi kendala pada sistem. Silakan coba beberapa saat lagi."
): string {
  if (!err) return fallbackMessage;

  let rawMessage = "";

  if (typeof err === "string") {
    rawMessage = err;
  } else if (err instanceof Error) {
    rawMessage = err.message;
  } else if (typeof err === "object" && err !== null) {
    const obj = err as Partial<ProblemDetails> & { message?: string };
    rawMessage = obj.detail || obj.title || obj.message || "";
  }

  if (!rawMessage || typeof rawMessage !== "string") {
    return fallbackMessage;
  }

  const trimmed = rawMessage.trim();

  // 1. Prisma & Database Connection Errors
  if (
    trimmed.includes("prisma.") ||
    trimmed.includes("Can't reach database") ||
    trimmed.includes("PrismaClient") ||
    trimmed.includes("invocation in") ||
    trimmed.includes("pooler.supabase") ||
    trimmed.includes("DATABASE_CONNECTION_ERROR") ||
    trimmed.includes("DATABASE_ERROR") ||
    trimmed.includes("Please make sure your database server is running")
  ) {
    return "Layanan basis data sedang tidak dapat dihubungi. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.";
  }

  // 2. Network & Fetch Failures (API offline, network timeout, CORS)
  if (
    trimmed.includes("Failed to fetch") ||
    trimmed.includes("NetworkError") ||
    trimmed.includes("fetch failed") ||
    trimmed.includes("ECONNREFUSED") ||
    trimmed.includes("ETIMEDOUT") ||
    trimmed.includes("ERR_CONNECTION_REFUSED") ||
    trimmed.includes("Load failed") ||
    trimmed.includes("net::ERR_")
  ) {
    return "Tidak dapat terhubung ke server VokaLink. Pastikan koneksi internet aktif dan server sedang berjalan.";
  }

  // 3. System File Paths & Code Leaks (Windows/Linux paths, stack trace line numbers)
  if (
    trimmed.includes(":\\") ||
    trimmed.includes("/apps/") ||
    trimmed.includes(".ts:") ||
    trimmed.includes(".tsx:") ||
    trimmed.includes(".js:") ||
    trimmed.includes("at async ") ||
    trimmed.includes("node_modules")
  ) {
    return fallbackMessage;
  }

  // 4. Client-side runtime / JSON parse errors
  if (
    trimmed.includes("Unexpected token") ||
    trimmed.includes("is not valid JSON") ||
    trimmed.includes("Cannot read properties of") ||
    trimmed.includes("is not a function") ||
    trimmed.includes("undefined is not")
  ) {
    return "Terjadi kendala pemrosesan data pada aplikasi. Silakan muat ulang halaman.";
  }

  // 5. Auth / Session token errors
  if (
    trimmed.toLowerCase().includes("jwt") ||
    trimmed.toLowerCase().includes("token expired") ||
    trimmed.toLowerCase().includes("session expired")
  ) {
    return "Sesi login Anda telah berakhir. Silakan masuk kembali.";
  }

  // Return legitimate human-readable message if safe
  return trimmed;
}

export function getFriendlyErrorTitle(
  err: unknown,
  fallbackTitle = "Terjadi Kesalahan"
): string {
  if (!err) return fallbackTitle;

  const msg = typeof err === "string" ? err : (err as any)?.message || (err as any)?.detail || "";

  if (
    msg.includes("prisma.") ||
    msg.includes("Can't reach database") ||
    msg.includes("pooler.supabase") ||
    msg.includes("DATABASE_CONNECTION_ERROR")
  ) {
    return "Koneksi Basis Data Gagal";
  }

  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("fetch failed")
  ) {
    return "Tidak Dapat Terhubung";
  }

  if (msg.includes("VALIDATION_ERROR") || msg.includes("Validasi")) {
    return "Validasi Formulir Gagal";
  }

  if (msg.includes("404") || msg.includes("NOT_FOUND") || msg.includes("tidak ditemukan")) {
    return "Data Tidak Ditemukan";
  }

  return fallbackTitle;
}
