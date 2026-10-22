import rateLimit from "express-rate-limit";

/**
 * BR-007 / Security Guard:
 * Rate limiter untuk rute zero-login publik (verifikasi token mentor, endorsement, paspor publik).
 * Mencegah serangan brute-force PIN atau spamming pada tautan kriptografis.
 */
export const zeroLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 100, // batas 100 permintaan per window per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => process.env["NODE_ENV"] === "test" || Boolean(process.env["VITEST"]),
  handler: (_req, res) => {
    res.status(429).json({
      type: "about:blank",
      title: "Batas Permintaan Terlampaui",
      status: 429,
      detail:
        "Terlalu banyak permintaan verifikasi dari alamat IP Anda. Silakan coba lagi setelah 15 menit demi keamanan.",
      code: "RATE_LIMIT_EXCEEDED",
    });
  },
});
