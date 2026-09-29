import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth, adminDb, isFirebaseAdminReal } from "@/lib/firebase-admin";

/** How long a completed OTP 2FA check authorizes admin API calls. */
const OTP_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

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
 * Admin authorization is NEVER mocked — there is no dev login.
 *   1. A Bearer Firebase ID token is mandatory (401 when absent/invalid).
 *   2. Admin SDK credentials must be configured (503 otherwise), then
 *   3. the token must carry `email_verified: true` (403 otherwise), and
 *   4. the caller must satisfy ONE of:
 *        a. ADMIN_EMAILS allowlist (when configured — the strict gate), or
 *        b. the `role: "admin"` custom claim (when no allowlist is configured), and
 *   5. (requireAdmin only) a fresh email-OTP 2FA verification must exist in
 *      Firestore `otp_verified/{uid}` within OTP_SESSION_TTL_MS (403
 *      otherwise). POST /api/admin/otp/verify sets that document on every
 *      successful code check. This makes 2FA mandatory on EVERY admin API
 *      call — an ID token alone (e.g. used directly against
 *      /api/admin/session) cannot administer the event.
 * The OTP endpoints themselves (/api/admin/otp/send, /api/admin/otp/verify)
 * use requireAdminIdentity() — steps 1-4 only — because they are the flow
 * that PRODUCES the otp_verified record; requiring it there would deadlock.
 * Production MUST set Admin SDK credentials (see FIREBASE_SETUP.md).
 */
export async function requireAdminIdentity(
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

  // Fail closed: without real Admin SDK credentials no token can be verified,
  // so admin APIs are unavailable rather than open to any Bearer token.
  if (!isFirebaseAdminReal()) {
    return {
      error: NextResponse.json(
        {
          error:
            "Admin API unavailable: Firebase Admin credentials are not configured. See FIREBASE_SETUP.md.",
        },
        { status: 503 }
      ),
    };
  }

  try {
    const decoded = (await adminAuth.verifyIdToken(token)) as {
      uid?: string;
      email?: string;
      email_verified?: boolean;
      role?: string;
    };

    // Mandatory email verification: the admin signs in with email + password,
    // then completes the verification email Firebase sends. The verified
    // state lives in the ID token's `email_verified` claim, so it cannot be
    // faked client-side.
    if (!decoded.email_verified) {
      return {
        error: NextResponse.json(
          {
            error:
              "Forbidden: email address not verified. Open the verification email Firebase sent you, then sign in again.",
          },
          { status: 403 }
        ),
      };
    }

    if (ADMIN_ALLOWLIST.length > 0) {
      if (!isAllowlisted(decoded.email)) {
        return {
          error: NextResponse.json(
            {
              error: "Forbidden: this account is not authorized for admin access.",
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

    const uid = decoded.uid ?? "admin";
    return {
      admin: { uid, email: decoded.email },
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

/**
 * Full admin gate: requireAdminIdentity() PLUS the email-OTP 2FA check.
 * Every data/mutation route (session probe, dashboard APIs, audit logs,
 * settings, …) MUST use this. The OTP endpoints must NOT — use
 * requireAdminIdentity() there so the challenge can be issued and completed.
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ admin: AdminContext } | { error: NextResponse }> {
  const identity = await requireAdminIdentity(req);
  if ("error" in identity) return identity;
  const { uid } = identity.admin;

  try {
    const snap = await adminDb.collection("otp_verified").doc(uid).get();
    const verifiedAt = snap.exists
      ? (snap.data() as { verifiedAt?: unknown } | undefined)?.verifiedAt
      : undefined;
    const age =
      typeof verifiedAt === "string"
        ? Date.now() - new Date(verifiedAt).getTime()
        : Number.POSITIVE_INFINITY;
    if (age >= 0 && age < OTP_SESSION_TTL_MS) return identity;
  } catch {
    // Fall through to the 403 below — an unreadable 2FA record fails closed.
  }

  return {
    error: NextResponse.json(
      {
        error:
          "Forbidden: two-factor verification required. Sign in again and enter the emailed code.",
      },
      { status: 403 }
    ),
  };
}
