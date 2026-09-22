import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth, isFirebaseAdminReal } from "@/lib/firebase-admin";

export interface AdminContext {
  uid: string;
  email?: string;
}

/**
 * Strict allowlist: when ADMIN_EMAILS is configured, ONLY these accounts may
 * administer the event — matching emails are accepted, everyone else is
 * rejected regardless of custom claims. Case-insensitive, comma-separated.
 */
const ADMIN_ALLOWLIST = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const isAllowlisted = (email: string | undefined) =>
  !!email && ADMIN_ALLOWLIST.includes(email.toLowerCase());

/**
 * Gate for all /api/admin/* routes (§6, §8 non-negotiable #8).
 * Real Firebase mode: verifies the Firebase ID token, then enforces ONE of:
 *   1. ADMIN_EMAILS allowlist (when configured — the strict gate), or
 *   2. the `role: "admin"` custom claim (when no allowlist is configured).
 * Dev/mock mode (no Admin SDK credentials): still requires a Bearer token so
 * routes are never fully open, and the caller is identified from the (mock)
 * decoded token. Production MUST set Admin SDK credentials (see
 * FIREBASE_SETUP.md).
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ admin: AdminContext } | { error: NextResponse }> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized: admin sign-in required." },
        { status: 401 }
      ),
    };
  }

  try {
    const decoded = (await adminAuth.verifyIdToken(token)) as {
      uid?: string;
      email?: string;
      role?: string;
    };

    if (isFirebaseAdminReal()) {
      if (ADMIN_ALLOWLIST.length > 0) {
        if (!isAllowlisted(decoded.email)) {
          return {
            error: NextResponse.json(
              {
                error: `Forbidden: ${
                  decoded.email || "this account"
                } is not on the admin allowlist (ADMIN_EMAILS).`,
              },
              { status: 403 }
            ),
          };
        }
      } else if (decoded.role !== "admin") {
        return {
          error: NextResponse.json(
            { error: "Forbidden: admin role required." },
            { status: 403 }
          ),
        };
      }
    }

    return {
      admin: { uid: decoded.uid ?? "admin", email: decoded.email },
    };
  } catch {
    return {
      error: NextResponse.json(
        {
          error:
            "Unauthorized: invalid or expired session. Please sign in again.",
        },
        { status: 401 }
      ),
    };
  }
}
