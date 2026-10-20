/**
 * Deterministic Canonical JSON Stringify
 * Sorts object keys recursively to guarantee identical JSON outputs
 * for identical data structures regardless of insertion order.
 * Essential for HMAC signing of verified logs and skill passports.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const mapped = value.map((item) => canonicalJson(item));
    return `[${mapped.join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`
  );

  return `{${pairs.join(",")}}`;
}
