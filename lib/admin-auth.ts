import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminAuth, isFirebaseAdminReal } from "@/lib/firebase-admin";

export interface AdminContext {
  uid: string;
  email?: string;
}

/**
 * Gate for all /api/admin/* routes (§6, §8 non-negotiable #8).
 * Real Firebase mode: verifies the Firebase ID token AND the `role: "admin"`
 * custom claim. Dev/mock mode (no Admin SDK credentials): still requires a
 * Bearer token so routes are never fully open, and the caller is identified
 * from the (mock) decoded token. Production MUST set Admin SDK credentials
 * and assign custom claims (see FIREBASE_SETUP.md).
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

    if (isFirebaseAdminReal() && decoded.role !== "admin") {
      return {
        error: NextResponse.json(
          { error: "Forbidden: admin role required." },
          { status: 403 }
        ),
      };
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
