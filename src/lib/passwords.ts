import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  if (!storedHash.startsWith("scrypt:")) {
    return password === storedHash;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const [, salt, hexDigest] = parts;
  try {
    const expected = Buffer.from(hexDigest, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
