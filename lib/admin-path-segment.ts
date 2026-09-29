import { createHash } from "node:crypto";

/**
 * Public path segment for organizer pages. SHA-256 of server-only key material,
 * so the URL is not the word "admin" and cannot be derived from the source tree.
 * next.config.ts publishes only this digest as NEXT_PUBLIC_ADMIN_PATH.
 */
export function adminPathSegment(): string {
  const material =
    process.env.ADMIN_PATH_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim() ||
    "";
  if (!material || material.includes("YOUR_PRIVATE_KEY")) {
    throw new Error(
      "Cannot derive the admin path. Set ADMIN_SESSION_SECRET or FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }
  return createHash("sha256").update(`wolf-admin-path:v1:${material}`).digest("hex");
}
