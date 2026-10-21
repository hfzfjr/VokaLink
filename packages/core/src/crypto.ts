import { createHmac, createHash, scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import { canonicalJson } from "./canonical-json.js";

/**
 * Encodes string/buffer to base64url format
 */
export function toBase64Url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf-8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decodes base64url string to Buffer
 */
export function fromBase64Url(input: string): Buffer {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64");
}

/**
 * Constant-time string equality comparison
 */
export function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Generates an HMAC-SHA256 signature (hex) for data
 */
export function generateHmacHex(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Seals verified log or passport data using canonical JSON and HMAC-SHA256
 */
export function sealObjectWithHmac(secret: string, data: Record<string, unknown>): string {
  const canonical = canonicalJson(data);
  return generateHmacHex(secret, canonical);
}

/**
 * Formats a signed magic link token: v1.<b64url(payload)>.<b64url(mac)>
 */
export function createSignedToken(
  payload: Record<string, unknown>,
  secret: string
): string {
  const json = JSON.stringify(payload);
  const b64Payload = toBase64Url(json);
  const macInput = `vokalink.link.v1|${b64Payload}`;
  const hmacBuf = createHmac("sha256", secret).update(macInput).digest();
  const b64Mac = toBase64Url(hmacBuf);
  return `v1.${b64Payload}.${b64Mac}`;
}

export interface VerifyTokenResult {
  valid: boolean;
  payload?: Record<string, unknown>;
  error?: string;
}

/**
 * Parses and verifies a signed magic link token in constant time
 */
export function parseAndVerifySignedToken(
  token: string,
  secret: string
): VerifyTokenResult {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return { valid: false, error: "Token format invalid" };
  }

  const b64Payload = parts[1];
  const b64Mac = parts[2];
  if (!b64Payload || !b64Mac) {
    return { valid: false, error: "Malformed token parts" };
  }

  const macInput = `vokalink.link.v1|${b64Payload}`;
  const expectedHmacBuf = createHmac("sha256", secret).update(macInput).digest();
  const expectedB64Mac = toBase64Url(expectedHmacBuf);

  if (!constantTimeCompare(b64Mac, expectedB64Mac)) {
    return { valid: false, error: "Invalid cryptographic signature" };
  }

  try {
    const rawJson = fromBase64Url(b64Payload).toString("utf-8");
    const payload = JSON.parse(rawJson) as Record<string, unknown>;

    // Expiry check
    if (typeof payload["exp"] === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec > payload["exp"]) {
        return { valid: false, payload, error: "Token expired" };
      }
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Failed to parse token payload" };
  }
}

/**
 * Generates a cryptographically secure random token (hex)
 */
export function generateRandomHex(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Computes SHA-256 hash in hexadecimal format
 */
export function hashSha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Generates a cryptographically secure random salt in hex format
 */
export function generateSalt(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Hashes a 4-digit PIN using scrypt with per-mentor salt and server-wide PIN_PEPPER
 * Cost parameters: N=16384, r=8, p=1, keylen=64 (industry standard for password/PIN hashing)
 */
export function hashPinWithScrypt(
  pin: string,
  salt: string,
  pepper: string
): string {
  const saltedInput = `${pin}|${pepper}`;
  const derivedKey = scryptSync(saltedInput, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return derivedKey.toString("hex");
}

/**
 * Verifies a 4-digit PIN against its stored scrypt hash using timing-safe comparison
 */
export function verifyPinWithScrypt(
  pin: string,
  salt: string,
  pepper: string,
  expectedHash: string
): boolean {
  try {
    const computedHash = hashPinWithScrypt(pin, salt, pepper);
    return constantTimeCompare(computedHash, expectedHash);
  } catch {
    return false;
  }
}
