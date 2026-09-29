import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import { adminBasePath, adminHref } from "@/lib/admin-path";

/**
 * Server-side page gate for the admin area.
 *
 * The Firebase ID token lives in sessionStorage and every /api/admin/* route
 * already fails closed through requireAdmin(). That protects the DATA but not
 * the admin HTML: any visitor could still download /admin/* documents and the
 * pages were indexable. This module adds the missing layer — a short-lived,
 * HMAC-signed, httpOnly cookie that the admin layout verifies on the server
 * before rendering, so unauthenticated requests never receive admin markup.
 *
 * The cookie is issued by POST /api/admin/otp/verify, i.e. only after the
 * email OTP is verified, and cleared by POST /api/admin/logout. It carries no
 * privileges of its own: it only proves a completed 2FA step in this browser.
 */
export const ADMIN_GATE_COOKIE = "wolf_admin_gate";

/** Matches OTP_SESSION_TTL_MS in lib/admin-auth.ts. */
export const ADMIN_GATE_TTL_SECONDS = 12 * 60 * 60;

const ADMIN_GATE_PATH = adminBasePath();
const TOKEN_VERSION = "v1";
const UID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const EXPIRY_PATTERN = /^\d{13}$/;

let cachedSecret: string | null | undefined;

/**
 * Explicit ADMIN_SESSION_SECRET wins. Otherwise a stable per-deployment secret
 * is derived from the Admin SDK service-account key that must already exist
 * for admin APIs to work at all — this keeps the gate working with zero extra
 * configuration while remaining server-only. No usable key and no explicit
 * secret means the gate cannot be signed: it then fails closed.
 */
function resolveSecret(): string | null {
  if (cachedSecret !== undefined) return cachedSecret;

  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicit) {
    cachedSecret = explicit;
    return cachedSecret;
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();
  if (clientEmail && privateKey && !privateKey.includes("YOUR_PRIVATE_KEY")) {
    cachedSecret = createHash("sha256")
      .update(`${TOKEN_VERSION}:admin-gate:${clientEmail}:${privateKey}`)
      .digest("hex");
    return cachedSecret;
  }

  cachedSecret = null;
  return cachedSecret;
}

export function adminSessionGateAvailable(): boolean {
  return resolveSecret() !== null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminGateToken(uid: string): string | null {
  const secret = resolveSecret();
  if (!secret || !UID_PATTERN.test(uid)) return null;
  const expiresAt = Date.now() + ADMIN_GATE_TTL_SECONDS * 1000;
  const payload = `${TOKEN_VERSION}.${uid}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyAdminGateToken(value: string | undefined | null): string | null {
  const secret = resolveSecret();
  if (!secret || !value) return null;

  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [version, uid, expiresAt, signature] = parts;
  if (version !== TOKEN_VERSION || !UID_PATTERN.test(uid) || !EXPIRY_PATTERN.test(expiresAt)) {
    return null;
  }

  const expected = sign(`${version}.${uid}.${expiresAt}`, secret);
  const given = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (given.length !== computed.length || !timingSafeEqual(given, computed)) return null;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return null;
  return uid;
}

export function isValidAdminGate(value: string | undefined | null): boolean {
  return verifyAdminGateToken(value) !== null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: ADMIN_GATE_PATH,
    maxAge: ADMIN_GATE_TTL_SECONDS,
  };
}

export function setAdminGateCookie<T extends NextResponse>(response: T, uid: string): T {
  const token = createAdminGateToken(uid);
  if (token) response.cookies.set(ADMIN_GATE_COOKIE, token, cookieOptions());
  return response;
}

export function clearAdminGateCookie<T extends NextResponse>(response: T): T {
  response.cookies.set(ADMIN_GATE_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}

export const ADMIN_GATE_PATHS = { login: adminHref("/login") };
