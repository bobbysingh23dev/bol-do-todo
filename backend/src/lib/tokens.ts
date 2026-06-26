import { createHash, randomBytes } from "node:crypto";

export function createRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function createOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function getTokenExpiry(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
