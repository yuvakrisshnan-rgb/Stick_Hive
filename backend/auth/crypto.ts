import { createHash, randomInt, randomBytes } from "node:crypto";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
