import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { requireAdminIdentity } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { adminSessionGateAvailable, setAdminGateCookie } from "@/lib/admin-session";

/**
 * Admin 2FA step 2 — OTP verification.
 *
 * POST /api/admin/otp/verify  (Bearer Firebase ID token, { code })
 * Single-use: the token document is deleted on success. Max 3 attempts per
 * code, then it is invalidated and a new one must be requested. Every attempt
 * (success or failure) is written to `auditLogs`.
 */
const MAX_ATTEMPTS = 3;

interface OtpDoc {
  get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
  set: (data: Record<string, unknown>, opts?: { merge?: boolean }) => Promise<void>;
  update: (data: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminIdentity(req);
  if ("error" in auth) return auth.error;
  const { uid, email } = auth.admin;

  // Without a signable gate secret the admin layout could never render, so
  // fail closed BEFORE consuming the code instead of leaving the admin stuck.
  if (!adminSessionGateAvailable()) {
    return NextResponse.json(
      { error: "Admin session gate is not configured. See FIREBASE_SETUP.md." },
      { status: 503 }
    );
  }

  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code.trim() : "";
  } catch {
    /* fallthrough to validation error */
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "Enter the 6-digit code from your email." },
      { status: 400 }
    );
  }

  try {
    const ref = adminDb.collection("otp_tokens").doc(uid) as unknown as OtpDoc;
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : undefined;

    if (!data || typeof data.codeHash !== "string" || typeof data.expiresAt !== "string") {
      return NextResponse.json(
        { error: "No active code. Request a new one." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (new Date(data.expiresAt as string).getTime() < now.getTime()) {
      await ref.delete();
      return NextResponse.json(
        { error: "This code has expired. Request a new one." },
        { status: 400 }
      );
    }

    const attempts = typeof data.attempts === "number" ? data.attempts : 0;
    if (attempts >= MAX_ATTEMPTS) {
      await ref.delete();
      return NextResponse.json(
        { error: "Too many incorrect attempts. Request a new code." },
        { status: 429 }
      );
    }

    const provided = Buffer.from(createHash("sha256").update(`${uid}:${code}`).digest("hex"));
    const stored = Buffer.from(data.codeHash as string);
    const ok = provided.length === stored.length && timingSafeEqual(provided, stored);

    if (!ok) {
      await ref.update({ attempts: attempts + 1 });
      await adminDb.collection("auditLogs").add({
        actorUid: uid,
        action: "OTP_FAILED",
        targetId: `otp_tokens/${uid}`,
        after: { email: email ?? "", attempt: attempts + 1, maxAttempts: MAX_ATTEMPTS },
        timestamp: now.toISOString(),
      });
      const left = MAX_ATTEMPTS - (attempts + 1);
      return NextResponse.json(
        {
          error:
            left > 0
              ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.`
              : "Incorrect code. Request a new one.",
        },
        { status: 400 }
      );
    }

    // Success — single use, then remove the token. Record the completed
    // 2FA check so requireAdmin() authorizes this admin for the session TTL.
    await ref.delete();
    await adminDb.collection("otp_verified").doc(uid).set({
      verifiedAt: now.toISOString(),
      email: email ?? "",
    });
    await adminDb.collection("auditLogs").add({
      actorUid: uid,
      action: "OTP_VERIFIED",
      targetId: `otp_tokens/${uid}`,
      after: { email: email ?? "" },
      timestamp: now.toISOString(),
    });

    // A successful 2FA also mints the signed, httpOnly page-gate cookie so
    // the admin pages render server-side for this browser only.
    return setAdminGateCookie(
      NextResponse.json({ success: true, admin: auth.admin }),
      uid
    );
  } catch (error) {
    console.error("Admin OTP Verify Error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
